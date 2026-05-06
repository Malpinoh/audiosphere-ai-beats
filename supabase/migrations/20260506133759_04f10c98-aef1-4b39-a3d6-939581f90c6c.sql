-- Drop duplicate follower-count trigger (two were running, doubling counts)
DROP TRIGGER IF EXISTS update_playlist_follower_count_trigger ON public.playlist_followers;

-- Create saved_playlists (Library) table
CREATE TABLE IF NOT EXISTS public.saved_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, playlist_id)
);

ALTER TABLE public.saved_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved playlists"
  ON public.saved_playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save playlists"
  ON public.saved_playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave playlists"
  ON public.saved_playlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_playlists_user_idx ON public.saved_playlists(user_id);