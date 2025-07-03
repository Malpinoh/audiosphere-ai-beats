-- Fix the RLS policies (the charts ones failed because they're views)
-- The profiles and tracks policies should have succeeded

-- Add a clearQueue function to the context
-- This will be handled in the code

-- Let's also add a function to update play counts when tracks are played
CREATE OR REPLACE FUNCTION public.update_track_play_count_from_stream()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the track's play count
  UPDATE tracks 
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = NEW.track_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update play count when stream is logged
DROP TRIGGER IF EXISTS update_play_count_on_stream ON stream_logs;
CREATE TRIGGER update_play_count_on_stream
  AFTER INSERT ON stream_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_track_play_count_from_stream();