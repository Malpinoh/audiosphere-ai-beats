-- Insert a sample track for testing
INSERT INTO public.tracks (
  id,
  user_id,
  title,
  artist,
  genre,
  mood,
  audio_file_path,
  cover_art_path,
  description,
  published,
  track_type
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  'Sample Music Track',
  'Test Artist',
  'Electronic',
  'Energetic',
  'sample-audio.mp3',
  'sample-cover.jpg',
  'A sample track for testing the music player functionality',
  true,
  'single'
);