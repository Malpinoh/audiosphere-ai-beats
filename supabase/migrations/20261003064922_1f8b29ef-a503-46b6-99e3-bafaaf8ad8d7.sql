-- 1. Ownership mapping: which MAUDIO accounts manage which artist profile
CREATE TABLE public.artist_profile_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_role text NOT NULL DEFAULT 'owner',
  claim_id uuid REFERENCES public.artist_claims(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_profile_id, user_id)
);
CREATE UNIQUE INDEX artist_profile_one_owner ON public.artist_profile_managers(artist_profile_id) WHERE manager_role = 'owner';
CREATE INDEX artist_profile_managers_user_idx ON public.artist_profile_managers(user_id);
GRANT SELECT ON public.artist_profile_managers TO anon, authenticated;
GRANT ALL ON public.artist_profile_managers TO service_role;
ALTER TABLE public.artist_profile_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see artist profile managers" ON public.artist_profile_managers FOR SELECT USING (true);
CREATE POLICY "Admins manage artist profile managers" ON public.artist_profile_managers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.is_artist_manager(_artist_profile_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.artist_profile_managers WHERE artist_profile_id = _artist_profile_id AND user_id = _user_id) $$;

-- Backfill: legacy approved claims where the claimant already is the profile
INSERT INTO public.artist_profile_managers (artist_profile_id, user_id, manager_role, claim_id)
SELECT DISTINCT ON (c.claimant_user_id) c.claimant_user_id, c.claimant_user_id, 'owner', c.id
FROM public.artist_claims c JOIN public.profiles p ON p.id = c.claimant_user_id
WHERE c.claim_status = 'approved'
ON CONFLICT DO NOTHING;

-- 2. Cover photo field
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_path text;

-- 3. Artist managers can update the artist profile they manage
CREATE POLICY "Artist managers can update managed profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_artist_manager(id)) WITH CHECK (public.is_artist_manager(id));
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Protected columns can only change via admins or SECURITY DEFINER system functions
CREATE OR REPLACE FUNCTION public.protect_profile_system_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- auth.uid() null = system/service context (triggers, cron, definer RPCs run as owner still have uid; allow admins)
  IF auth.uid() IS NULL OR public.is_admin() OR current_setting('maudio.system_update', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.claimable IS DISTINCT FROM OLD.claimable
     OR NEW.auto_created IS DISTINCT FROM OLD.auto_created
     OR NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'You cannot change protected profile fields';
  END IF;
  -- counters are maintained by system triggers; ignore client edits
  IF pg_trigger_depth() = 1 THEN
    NEW.follower_count := OLD.follower_count;
    NEW.monthly_listeners := OLD.monthly_listeners;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_profile_system_fields ON public.profiles;
CREATE TRIGGER protect_profile_system_fields BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_system_fields();

-- 4. Duplicate-claim protection
CREATE UNIQUE INDEX IF NOT EXISTS artist_claims_one_active_per_user
  ON public.artist_claims(artist_profile_id, claimant_user_id) WHERE claim_status IN ('pending','approved');
CREATE UNIQUE INDEX IF NOT EXISTS artist_claims_one_approved_per_profile
  ON public.artist_claims(artist_profile_id) WHERE claim_status = 'approved';

CREATE OR REPLACE FUNCTION public.validate_artist_claim()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE p public.profiles%ROWTYPE;
BEGIN
  IF NEW.claimant_user_id IS NULL OR NEW.claimant_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Claims must be submitted by the signed-in user';
  END IF;
  SELECT * INTO p FROM public.profiles WHERE id = NEW.artist_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Artist profile not found'; END IF;
  IF NEW.artist_profile_id = NEW.claimant_user_id THEN RAISE EXCEPTION 'You cannot claim your own account'; END IF;
  IF NOT COALESCE(p.claimable, false) OR EXISTS (SELECT 1 FROM public.artist_profile_managers m WHERE m.artist_profile_id = p.id AND m.manager_role = 'owner') THEN
    RAISE EXCEPTION 'This artist page has already been claimed';
  END IF;
  NEW.claim_status := 'pending';
  NEW.reviewed_at := NULL; NEW.reviewed_by := NULL; NEW.admin_notes := NULL;
  NEW.artist_name := COALESCE(p.full_name, p.username, NEW.artist_name);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_artist_claim ON public.artist_claims;
CREATE TRIGGER validate_artist_claim BEFORE INSERT ON public.artist_claims
  FOR EACH ROW EXECUTE FUNCTION public.validate_artist_claim();

-- 5. Transactional approval (no profile copy/delete; identity and tracks preserved)
DROP FUNCTION IF EXISTS public.approve_artist_claim(uuid, uuid);
CREATE OR REPLACE FUNCTION public.approve_artist_claim(claim_id uuid, admin_notes text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE c public.artist_claims%ROWTYPE; caller_role public.app_role;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin','support') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO c FROM public.artist_claims WHERE id = claim_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim not found'; END IF;
  IF c.claim_status <> 'pending' THEN RAISE EXCEPTION 'Claim is no longer pending'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = c.claimant_user_id) THEN RAISE EXCEPTION 'Claimant account not found'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = c.artist_profile_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Artist profile not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.artist_profile_managers WHERE artist_profile_id = c.artist_profile_id AND manager_role = 'owner') THEN
    RAISE EXCEPTION 'Artist profile already has an owner';
  END IF;

  UPDATE public.artist_claims SET claim_status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(),
    admin_notes = COALESCE(approve_artist_claim.admin_notes, artist_claims.admin_notes), updated_at = now()
  WHERE id = claim_id;
  INSERT INTO public.artist_profile_managers (artist_profile_id, user_id, manager_role, claim_id)
  VALUES (c.artist_profile_id, c.claimant_user_id, 'owner', c.id);
  UPDATE public.profiles SET claimable = false, auto_created = false WHERE id = c.artist_profile_id;
  -- other pending claims for this profile are closed
  UPDATE public.artist_claims SET claim_status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE artist_profile_id = c.artist_profile_id AND claim_status = 'pending' AND id <> claim_id;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.reject_artist_claim(claim_id uuid, admin_notes text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE caller_role public.app_role;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin','support') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.artist_claims SET claim_status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(),
    admin_notes = COALESCE(reject_artist_claim.admin_notes, artist_claims.admin_notes), updated_at = now()
  WHERE id = claim_id AND claim_status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public.approve_artist_claim(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_artist_claim(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.approve_artist_claim(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_artist_claim(uuid, text) TO authenticated;

-- Claimants should not read private admin notes: expose status via a safe function
CREATE OR REPLACE FUNCTION public.my_artist_claim_status(_artist_profile_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT claim_status FROM public.artist_claims WHERE artist_profile_id = _artist_profile_id AND claimant_user_id = auth.uid() ORDER BY created_at DESC NULLS LAST LIMIT 1 $$;

-- 6. Cover photo storage: managers upload under artist/<artist_profile_id>/ in cover_art bucket
CREATE POLICY "Artist managers upload artist covers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cover_art' AND (storage.foldername(name))[1] = 'artist' AND public.is_artist_manager(((storage.foldername(name))[2])::uuid));
CREATE POLICY "Artist managers update artist covers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cover_art' AND (storage.foldername(name))[1] = 'artist' AND public.is_artist_manager(((storage.foldername(name))[2])::uuid));
CREATE POLICY "Artist managers delete artist covers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cover_art' AND (storage.foldername(name))[1] = 'artist' AND public.is_artist_manager(((storage.foldername(name))[2])::uuid));