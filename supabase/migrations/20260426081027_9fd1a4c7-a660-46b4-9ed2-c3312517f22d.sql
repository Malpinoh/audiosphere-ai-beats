-- Genre data migration: replace "Other" with "Afrobeats"
UPDATE public.tracks SET genre = 'Afrobeats' WHERE genre = 'Other';

-- Ensure uniqueness of playlist_followers and follower-count trigger
CREATE UNIQUE INDEX IF NOT EXISTS playlist_followers_unique
  ON public.playlist_followers (playlist_id, profile_id);

DROP TRIGGER IF EXISTS trg_update_playlist_follower_count ON public.playlist_followers;
CREATE TRIGGER trg_update_playlist_follower_count
AFTER INSERT OR DELETE ON public.playlist_followers
FOR EACH ROW EXECUTE FUNCTION public.update_playlist_follower_count();