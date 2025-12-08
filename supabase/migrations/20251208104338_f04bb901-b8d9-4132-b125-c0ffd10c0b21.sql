-- Create user listening history table for collaborative filtering
CREATE TABLE public.user_listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  listen_count INTEGER NOT NULL DEFAULT 1,
  last_listened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_listen_time INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Create user preferences table for explicit preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  genre_scores JSONB DEFAULT '{}'::jsonb,
  mood_scores JSONB DEFAULT '{}'::jsonb,
  artist_scores JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create track similarity cache for content-based filtering
CREATE TABLE public.track_similarity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  similar_track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(track_id, similar_track_id)
);

-- Enable RLS
ALTER TABLE public.user_listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_similarity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_listening_history
CREATE POLICY "Users can view their own listening history"
ON public.user_listening_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listening history"
ON public.user_listening_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listening history"
ON public.user_listening_history FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for track_similarity (public read)
CREATE POLICY "Anyone can view track similarity"
ON public.track_similarity FOR SELECT
USING (true);

CREATE POLICY "System can manage track similarity"
ON public.track_similarity FOR ALL
USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_listening_history_user ON public.user_listening_history(user_id);
CREATE INDEX idx_listening_history_track ON public.user_listening_history(track_id);
CREATE INDEX idx_listening_history_last_listened ON public.user_listening_history(last_listened_at DESC);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX idx_track_similarity_track ON public.track_similarity(track_id);
CREATE INDEX idx_track_similarity_score ON public.track_similarity(similarity_score DESC);

-- Function to update listening history
CREATE OR REPLACE FUNCTION public.update_listening_history(
  p_user_id UUID,
  p_track_id UUID,
  p_listen_time INTEGER DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_listening_history (user_id, track_id, listen_count, total_listen_time, last_listened_at)
  VALUES (p_user_id, p_track_id, 1, p_listen_time, now())
  ON CONFLICT (user_id, track_id)
  DO UPDATE SET
    listen_count = user_listening_history.listen_count + 1,
    total_listen_time = user_listening_history.total_listen_time + p_listen_time,
    last_listened_at = now();
END;
$$;

-- Function to update user preferences based on listening history
CREATE OR REPLACE FUNCTION public.update_user_preferences(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  genre_data JSONB;
  mood_data JSONB;
  artist_data JSONB;
BEGIN
  -- Calculate genre scores
  SELECT COALESCE(jsonb_object_agg(genre, score), '{}'::jsonb)
  INTO genre_data
  FROM (
    SELECT t.genre, SUM(h.listen_count * 2 + COALESCE(l.like_weight, 0) * 5) as score
    FROM user_listening_history h
    JOIN tracks t ON t.id = h.track_id
    LEFT JOIN (
      SELECT track_id, 1 as like_weight FROM likes WHERE user_id = p_user_id
    ) l ON l.track_id = h.track_id
    WHERE h.user_id = p_user_id
    GROUP BY t.genre
  ) s;

  -- Calculate mood scores
  SELECT COALESCE(jsonb_object_agg(mood, score), '{}'::jsonb)
  INTO mood_data
  FROM (
    SELECT t.mood, SUM(h.listen_count * 2 + COALESCE(l.like_weight, 0) * 5) as score
    FROM user_listening_history h
    JOIN tracks t ON t.id = h.track_id
    LEFT JOIN (
      SELECT track_id, 1 as like_weight FROM likes WHERE user_id = p_user_id
    ) l ON l.track_id = h.track_id
    WHERE h.user_id = p_user_id
    GROUP BY t.mood
  ) s;

  -- Calculate artist scores
  SELECT COALESCE(jsonb_object_agg(artist_profile_id::text, score), '{}'::jsonb)
  INTO artist_data
  FROM (
    SELECT t.artist_profile_id, SUM(h.listen_count * 2 + COALESCE(l.like_weight, 0) * 5 + COALESCE(f.follow_weight, 0) * 10) as score
    FROM user_listening_history h
    JOIN tracks t ON t.id = h.track_id
    LEFT JOIN (
      SELECT track_id, 1 as like_weight FROM likes WHERE user_id = p_user_id
    ) l ON l.track_id = h.track_id
    LEFT JOIN (
      SELECT artist_id, 1 as follow_weight FROM followers WHERE follower_id = p_user_id
    ) f ON f.artist_id = t.artist_profile_id
    WHERE h.user_id = p_user_id AND t.artist_profile_id IS NOT NULL
    GROUP BY t.artist_profile_id
  ) s;

  -- Upsert preferences
  INSERT INTO user_preferences (user_id, genre_scores, mood_scores, artist_scores, updated_at)
  VALUES (p_user_id, genre_data, mood_data, artist_data, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    genre_scores = genre_data,
    mood_scores = mood_data,
    artist_scores = artist_data,
    updated_at = now();
END;
$$;

-- Function to get personalized recommendations (hybrid algorithm)
CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  track_id UUID,
  title TEXT,
  artist TEXT,
  artist_profile_id UUID,
  cover_art_path TEXT,
  genre TEXT,
  mood TEXT,
  play_count INTEGER,
  recommendation_score NUMERIC,
  recommendation_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no user, return popular tracks
  IF p_user_id IS NULL THEN
    RETURN QUERY
    SELECT 
      t.id as track_id,
      t.title,
      t.artist,
      t.artist_profile_id,
      t.cover_art_path,
      t.genre,
      t.mood,
      t.play_count,
      t.play_count::numeric as recommendation_score,
      'Popular'::text as recommendation_reason
    FROM tracks t
    WHERE t.published = true
    ORDER BY t.play_count DESC NULLS LAST
    LIMIT p_limit;
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_prefs AS (
    SELECT genre_scores, mood_scores, artist_scores
    FROM user_preferences
    WHERE user_id = p_user_id
  ),
  listened_tracks AS (
    SELECT track_id FROM user_listening_history WHERE user_id = p_user_id
  ),
  liked_tracks AS (
    SELECT track_id FROM likes WHERE user_id = p_user_id
  ),
  followed_artists AS (
    SELECT artist_id FROM followers WHERE follower_id = p_user_id
  ),
  scored_tracks AS (
    SELECT 
      t.id,
      t.title,
      t.artist,
      t.artist_profile_id,
      t.cover_art_path,
      t.genre,
      t.mood,
      t.play_count,
      -- Content-based score (genre + mood preferences)
      COALESCE((up.genre_scores->>t.genre)::numeric, 0) * 0.3 +
      COALESCE((up.mood_scores->>t.mood)::numeric, 0) * 0.2 +
      -- Artist affinity score
      COALESCE((up.artist_scores->>t.artist_profile_id::text)::numeric, 0) * 0.25 +
      -- Following bonus
      CASE WHEN t.artist_profile_id IN (SELECT artist_id FROM followed_artists) THEN 20 ELSE 0 END +
      -- Popularity score (normalized)
      LEAST(COALESCE(t.play_count, 0)::numeric / 1000, 10) * 0.15 +
      -- Recency boost for newer tracks
      CASE 
        WHEN t.uploaded_at > now() - interval '7 days' THEN 15
        WHEN t.uploaded_at > now() - interval '30 days' THEN 10
        WHEN t.uploaded_at > now() - interval '90 days' THEN 5
        ELSE 0
      END * 0.1
      as total_score,
      CASE
        WHEN t.artist_profile_id IN (SELECT artist_id FROM followed_artists) THEN 'From artists you follow'
        WHEN COALESCE((up.genre_scores->>t.genre)::numeric, 0) > 10 THEN 'Based on your genre preferences'
        WHEN COALESCE((up.mood_scores->>t.mood)::numeric, 0) > 10 THEN 'Matches your mood'
        WHEN t.uploaded_at > now() - interval '7 days' THEN 'New release'
        ELSE 'Recommended for you'
      END as reason
    FROM tracks t
    CROSS JOIN user_prefs up
    WHERE t.published = true
      AND t.id NOT IN (SELECT track_id FROM listened_tracks)
  )
  SELECT 
    st.id as track_id,
    st.title,
    st.artist,
    st.artist_profile_id,
    st.cover_art_path,
    st.genre,
    st.mood,
    st.play_count,
    st.total_score as recommendation_score,
    st.reason as recommendation_reason
  FROM scored_tracks st
  ORDER BY st.total_score DESC, RANDOM()
  LIMIT p_limit;
END;
$$;

-- Function to get similar tracks (content-based)
CREATE OR REPLACE FUNCTION public.get_similar_tracks(
  p_track_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  track_id UUID,
  title TEXT,
  artist TEXT,
  artist_profile_id UUID,
  cover_art_path TEXT,
  genre TEXT,
  mood TEXT,
  play_count INTEGER,
  similarity_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_genre TEXT;
  source_mood TEXT;
  source_artist_id UUID;
  source_tags TEXT[];
BEGIN
  -- Get source track details
  SELECT t.genre, t.mood, t.artist_profile_id, t.tags
  INTO source_genre, source_mood, source_artist_id, source_tags
  FROM tracks t
  WHERE t.id = p_track_id;

  RETURN QUERY
  SELECT 
    t.id as track_id,
    t.title,
    t.artist,
    t.artist_profile_id,
    t.cover_art_path,
    t.genre,
    t.mood,
    t.play_count,
    (
      -- Genre match (40%)
      CASE WHEN t.genre = source_genre THEN 40 ELSE 0 END +
      -- Mood match (30%)
      CASE WHEN t.mood = source_mood THEN 30 ELSE 0 END +
      -- Same artist (20%)
      CASE WHEN t.artist_profile_id = source_artist_id THEN 20 ELSE 0 END +
      -- Tag overlap (10%)
      CASE 
        WHEN source_tags IS NOT NULL AND t.tags IS NOT NULL 
        THEN LEAST(array_length(ARRAY(SELECT unnest(t.tags) INTERSECT SELECT unnest(source_tags)), 1) * 5, 10)
        ELSE 0 
      END
    )::numeric as similarity_score
  FROM tracks t
  WHERE t.id != p_track_id
    AND t.published = true
  ORDER BY similarity_score DESC, t.play_count DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Function to get mood-based recommendations
CREATE OR REPLACE FUNCTION public.get_mood_recommendations(
  p_mood TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  track_id UUID,
  title TEXT,
  artist TEXT,
  artist_profile_id UUID,
  cover_art_path TEXT,
  genre TEXT,
  mood TEXT,
  play_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as track_id,
    t.title,
    t.artist,
    t.artist_profile_id,
    t.cover_art_path,
    t.genre,
    t.mood,
    t.play_count
  FROM tracks t
  WHERE t.mood = p_mood
    AND t.published = true
  ORDER BY t.play_count DESC NULLS LAST, t.uploaded_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to get genre-based recommendations
CREATE OR REPLACE FUNCTION public.get_genre_recommendations(
  p_genre TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  track_id UUID,
  title TEXT,
  artist TEXT,
  artist_profile_id UUID,
  cover_art_path TEXT,
  genre TEXT,
  mood TEXT,
  play_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as track_id,
    t.title,
    t.artist,
    t.artist_profile_id,
    t.cover_art_path,
    t.genre,
    t.mood,
    t.play_count
  FROM tracks t
  WHERE t.genre = p_genre
    AND t.published = true
  ORDER BY t.play_count DESC NULLS LAST, t.uploaded_at DESC
  LIMIT p_limit;
END;
$$;