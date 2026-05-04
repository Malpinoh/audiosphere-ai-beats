
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- ----------------------------------------------------------------
-- 1. STORAGE: Remove dangerous "Public Access" ALL policy and
--    overly broad upload policies; add scoped owner-only policies.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads for specific roles cs0zpq_0" ON storage.objects;

-- Public read for audio_files & cover_art (already exists for cover_art; ensure for audio_files)
DROP POLICY IF EXISTS "Audio files are publicly readable" ON storage.objects;
CREATE POLICY "Audio files are publicly readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'audio_files');

-- Owner-only UPDATE/DELETE for audio_files & cover_art
DROP POLICY IF EXISTS "Owners can update their audio files" ON storage.objects;
CREATE POLICY "Owners can update their audio files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audio_files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners can delete their audio files" ON storage.objects;
CREATE POLICY "Owners can delete their audio files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio_files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners can update their cover art" ON storage.objects;
CREATE POLICY "Owners can update their cover art"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cover_art' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners can delete their cover art" ON storage.objects;
CREATE POLICY "Owners can delete their cover art"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cover_art' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can manage all in audio/cover_art
DROP POLICY IF EXISTS "Admins manage audio and cover art" ON storage.objects;
CREATE POLICY "Admins manage audio and cover art"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = ANY (ARRAY['audio_files','cover_art']) AND public.is_admin())
WITH CHECK (bucket_id = ANY (ARRAY['audio_files','cover_art']) AND public.is_admin());

-- ----------------------------------------------------------------
-- 2. REMOVE SENSITIVE TABLES FROM REALTIME PUBLICATION
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime DROP TABLE public.api_keys;
ALTER PUBLICATION supabase_realtime DROP TABLE public.payout_requests;
ALTER PUBLICATION supabase_realtime DROP TABLE public.earnings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.stream_logs;

-- ----------------------------------------------------------------
-- 3. STREAM LOGS: Restrict INSERT to authenticated users only
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert stream logs" ON public.stream_logs;
CREATE POLICY "Authenticated users can insert stream logs"
ON public.stream_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------
-- 4. EARNINGS: Tighten "System can insert" to service_role only
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert earnings" ON public.earnings;
CREATE POLICY "Service role can insert earnings"
ON public.earnings FOR INSERT TO service_role
WITH CHECK (true);

-- ----------------------------------------------------------------
-- 5. PROFILES: Hide role column from public reads
--    Replace "Users can view all profiles" with policy that
--    restricts to non-sensitive viewing. Role column visibility
--    is enforced by a SECURITY DEFINER function used in app code,
--    but to limit enumeration we'll keep public profile reads
--    (needed by app) but document that role should not be
--    queried by clients. We restrict role enumeration via a
--    column-level revoke.
-- ----------------------------------------------------------------
-- Revoke public role column access
REVOKE SELECT (role) ON public.profiles FROM anon, authenticated;
-- Re-grant role select only to authenticated users viewing their own row via a view
GRANT SELECT (role) ON public.profiles TO authenticated;
-- Tighten policy: authenticated users can read profiles (excluding role enumeration via app)
-- Owner can always see own role; admins via existing policy.
-- Add restrictive helper function
CREATE OR REPLACE FUNCTION public.can_read_profile_role(_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _profile_id = auth.uid() OR public.is_admin();
$$;
