-- Temporarily disable the trigger that creates artist profiles
DROP TRIGGER IF EXISTS update_track_artist_profile_trigger ON tracks;

-- Insert sample track without triggering artist profile creation
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
  track_type,
  artist_profile_id
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
  'single',
  '91714e34-9c1e-479e-9122-7c6014a26570'
);

-- Re-enable the trigger for future uploads
CREATE TRIGGER update_track_artist_profile_trigger
  BEFORE INSERT OR UPDATE ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_track_artist_profile();