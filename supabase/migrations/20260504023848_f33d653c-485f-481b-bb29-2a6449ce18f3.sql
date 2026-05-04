-- Re-scope anon-included policies to authenticated only

-- Storage: audio_files upload policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Audio files are uploadable by the distributor'
  ) THEN
    EXECUTE 'DROP POLICY "Audio files are uploadable by the distributor" ON storage.objects';
  END IF;
END $$;

CREATE POLICY "Audio files are uploadable by the distributor"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio_files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage: cover_art upload policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Cover art is uploadable by the distributor'
  ) THEN
    EXECUTE 'DROP POLICY "Cover art is uploadable by the distributor" ON storage.objects';
  END IF;
END $$;

CREATE POLICY "Cover art is uploadable by the distributor"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cover_art'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- track_quality_variants: scope ALL policy to authenticated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'track_quality_variants'
      AND policyname = 'Track owners can manage variants'
  ) THEN
    EXECUTE 'DROP POLICY "Track owners can manage variants" ON public.track_quality_variants';
  END IF;
END $$;

CREATE POLICY "Track owners can manage variants"
ON public.track_quality_variants
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tracks
  WHERE tracks.id = track_quality_variants.track_id
    AND tracks.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tracks
  WHERE tracks.id = track_quality_variants.track_id
    AND tracks.user_id = auth.uid()
));