-- Fix like count triggers for tracks table
CREATE OR REPLACE FUNCTION public.update_track_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment like count
    UPDATE public.tracks 
    SET like_count = COALESCE(like_count, 0) + 1 
    WHERE id = NEW.track_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement like count
    UPDATE public.tracks 
    SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
    WHERE id = OLD.track_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for like count updates
DROP TRIGGER IF EXISTS update_track_like_count_trigger ON public.likes;
CREATE TRIGGER update_track_like_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_track_like_count();

-- Fix follower count triggers
DROP TRIGGER IF EXISTS update_follower_count_trigger ON public.followers;
CREATE TRIGGER update_follower_count_trigger
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follower_count();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist_profile_id ON public.tracks(artist_profile_id);
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON public.tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_play_count ON public.tracks(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_stream_logs_track_id ON public.stream_logs(track_id);
CREATE INDEX IF NOT EXISTS idx_stream_logs_created_at ON public.stream_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_track_id ON public.likes(track_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Update track artist profile trigger
DROP TRIGGER IF EXISTS update_track_artist_profile_trigger ON public.tracks;
CREATE TRIGGER update_track_artist_profile_trigger
  BEFORE INSERT OR UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_track_artist_profile();