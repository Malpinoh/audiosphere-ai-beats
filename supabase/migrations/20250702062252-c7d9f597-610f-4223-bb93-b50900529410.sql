-- Insert a sample track for testing with valid user_id
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
  '91714e34-9c1e-479e-9122-7c6014a26570',
  'Sample Music Track',
  'Demo Artist',
  'Electronic',
  'Energetic',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://via.placeholder.com/400x400/9333ea/ffffff?text=Demo+Track',
  'A sample track for testing the music player functionality',
  true,
  'single'
);