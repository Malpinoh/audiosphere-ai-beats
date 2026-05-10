-- 1. Tighten stream_logs INSERT policy (prevent user_id spoofing)
DROP POLICY IF EXISTS "Authenticated users can insert stream logs" ON public.stream_logs;
CREATE POLICY "Users can insert their own stream logs"
ON public.stream_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id = auth.uid() OR user_id IS NULL)
);

-- 2. Hide admin/support profiles from anonymous (and non-admin authenticated) users
--    so the role column cannot be used to enumerate admins.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Public can view non-privileged profiles"
ON public.profiles
FOR SELECT
TO anon
USING (role NOT IN ('admin'::app_role, 'support'::app_role));

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_admin()
  OR role NOT IN ('admin'::app_role, 'support'::app_role)
);

-- 3. Add INSERT policy on tracks restricted to privileged roles
CREATE POLICY "Privileged users can insert tracks"
ON public.tracks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('artist'::app_role, 'distributor'::app_role, 'editorial'::app_role, 'admin'::app_role)
  )
);

-- 4. Add DELETE policy on tracks for owners and admins
CREATE POLICY "Owners and admins can delete tracks"
ON public.tracks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 5. approve_artist_claim: require caller be admin/support
CREATE OR REPLACE FUNCTION public.approve_artist_claim(claim_id uuid, admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  claim_record public.artist_claims%ROWTYPE;
  profile_record public.profiles%ROWTYPE;
  new_profile_id uuid;
  caller_role public.app_role;
BEGIN
  -- Authorization guard: only admins/support may approve claims
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin'::public.app_role, 'support'::public.app_role) THEN
    RETURN false;
  END IF;

  -- Force admin_id to be the caller (prevents spoofing the audit field)
  admin_id := auth.uid();

  -- Get the claim
  SELECT * INTO claim_record FROM public.artist_claims WHERE id = claim_id;
  IF NOT FOUND OR claim_record.claim_status != 'pending' THEN
    RETURN false;
  END IF;

  SELECT * INTO profile_record FROM public.profiles WHERE id = claim_record.artist_profile_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  new_profile_id := claim_record.claimant_user_id;

  UPDATE public.artist_claims
  SET claim_status = 'approved', reviewed_at = now(), reviewed_by = admin_id
  WHERE id = claim_id;

  INSERT INTO public.profiles (
    id, username, full_name, role, bio, avatar_url, website, slug,
    is_verified, follower_count, monthly_listeners, claimable, auto_created, created_at
  ) VALUES (
    new_profile_id, profile_record.username, profile_record.full_name, 'artist'::public.app_role,
    profile_record.bio, profile_record.avatar_url, profile_record.website, profile_record.slug,
    profile_record.is_verified, profile_record.follower_count, profile_record.monthly_listeners,
    false, false, now()
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = 'artist'::public.app_role,
    bio = COALESCE(EXCLUDED.bio, public.profiles.bio),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    website = COALESCE(EXCLUDED.website, public.profiles.website),
    slug = EXCLUDED.slug,
    is_verified = EXCLUDED.is_verified,
    follower_count = EXCLUDED.follower_count,
    monthly_listeners = EXCLUDED.monthly_listeners,
    claimable = false,
    auto_created = false;

  UPDATE public.tracks
  SET user_id = new_profile_id, artist_profile_id = new_profile_id
  WHERE artist_profile_id = claim_record.artist_profile_id;

  UPDATE public.followers
  SET artist_id = new_profile_id
  WHERE artist_id = claim_record.artist_profile_id;

  IF claim_record.artist_profile_id != new_profile_id THEN
    DELETE FROM public.profiles WHERE id = claim_record.artist_profile_id;
  END IF;

  RETURN true;
END;
$function$;

-- 6. Realtime: scope channel access to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can send realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);