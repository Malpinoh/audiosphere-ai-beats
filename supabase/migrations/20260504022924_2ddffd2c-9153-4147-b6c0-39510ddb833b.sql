
-- =========================================================
-- 1. STORAGE: Fix role check for audio_files & cover_art uploads
-- =========================================================
DROP POLICY IF EXISTS "Allow insert for all roles  cs0zpq_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload for all roles wqvil7_0" ON storage.objects;

CREATE POLICY "Creators can upload audio files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'audio_files'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin'::public.app_role, 'artist'::public.app_role, 'distributor'::public.app_role, 'editorial'::public.app_role)
  )
);

CREATE POLICY "Creators can upload cover art"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cover_art'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin'::public.app_role, 'artist'::public.app_role, 'distributor'::public.app_role, 'editorial'::public.app_role)
  )
);

-- =========================================================
-- 2. REMOVE SENSITIVE TABLES FROM REALTIME PUBLICATION
-- =========================================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.reports;
ALTER PUBLICATION supabase_realtime DROP TABLE public.system_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.verification_requests;
ALTER PUBLICATION supabase_realtime DROP TABLE public.artist_claims;
ALTER PUBLICATION supabase_realtime DROP TABLE public.royalty_rates;
ALTER PUBLICATION supabase_realtime DROP TABLE public.trending_scores;

-- =========================================================
-- 3. LIKES: Restrict SELECT to owner
-- =========================================================
DROP POLICY IF EXISTS "Likes are publicly readable" ON public.likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Public can view likes" ON public.likes;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='likes' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.likes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view their own likes"
ON public.likes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- 4. HLS_SEGMENTS: Only published tracks (or owner) readable
-- =========================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='hls_segments' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.hls_segments', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Published track segments are readable"
ON public.hls_segments FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = hls_segments.track_id AND t.published = true
  )
);

CREATE POLICY "Owners can read their track segments"
ON public.hls_segments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = hls_segments.track_id AND t.user_id = auth.uid()
  )
);

-- =========================================================
-- 5. TRACK_QUALITY_VARIANTS: Only published (or owner) readable
-- =========================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='track_quality_variants' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.track_quality_variants', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Published track variants are readable"
ON public.track_quality_variants FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = track_quality_variants.track_id AND t.published = true
  )
);

CREATE POLICY "Owners can read their track variants"
ON public.track_quality_variants FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.id = track_quality_variants.track_id AND t.user_id = auth.uid()
  )
);
