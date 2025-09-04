-- Create trending algorithm with comprehensive scoring system
-- This algorithm considers: recency, velocity, engagement, and regional performance

-- First create trending_scores table to cache trending calculations
CREATE TABLE IF NOT EXISTS public.trending_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  trending_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  velocity_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  engagement_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  recency_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  regional_boost DECIMAL(6,2) NOT NULL DEFAULT 0,
  last_calculated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trending_scores_track_id ON public.trending_scores(track_id);
CREATE INDEX IF NOT EXISTS idx_trending_scores_trending_score ON public.trending_scores(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_scores_last_calculated ON public.trending_scores(last_calculated);

-- Enable RLS
ALTER TABLE public.trending_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view trending scores
CREATE POLICY "Anyone can view trending scores" 
ON public.trending_scores 
FOR SELECT 
USING (true);

-- Create comprehensive trending calculation function
CREATE OR REPLACE FUNCTION public.calculate_trending_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  track_record RECORD;
  velocity_score DECIMAL;
  engagement_score DECIMAL;
  recency_score DECIMAL;
  regional_boost DECIMAL;
  final_score DECIMAL;
BEGIN
  -- Clear old scores (older than 1 hour)
  DELETE FROM public.trending_scores WHERE last_calculated < NOW() - INTERVAL '1 hour';
  
  -- Calculate trending scores for all published tracks
  FOR track_record IN
    SELECT t.id, t.uploaded_at, t.play_count, t.like_count
    FROM public.tracks t
    WHERE t.published = true
    AND t.uploaded_at > NOW() - INTERVAL '30 days' -- Only consider tracks from last 30 days for trending
  LOOP
    -- 1. Velocity Score (plays in last 24h vs total plays)
    SELECT COALESCE(
      (COUNT(*) * 100.0 / GREATEST(track_record.play_count, 1)),
      0
    ) INTO velocity_score
    FROM public.stream_logs sl
    WHERE sl.track_id = track_record.id
    AND sl.created_at >= NOW() - INTERVAL '24 hours';
    
    -- Cap velocity score at 100
    velocity_score := LEAST(velocity_score, 100);
    
    -- 2. Engagement Score (likes + comments ratio)
    SELECT COALESCE(
      ((track_record.like_count + COUNT(c.id)) * 10.0 / GREATEST(track_record.play_count, 1)),
      0
    ) INTO engagement_score
    FROM public.comments c
    WHERE c.track_id = track_record.id
    AND c.status = 'active';
    
    -- Cap engagement score at 50
    engagement_score := LEAST(engagement_score, 50);
    
    -- 3. Recency Score (newer tracks get higher scores)
    SELECT 
      CASE 
        WHEN track_record.uploaded_at >= NOW() - INTERVAL '1 day' THEN 30
        WHEN track_record.uploaded_at >= NOW() - INTERVAL '3 days' THEN 25
        WHEN track_record.uploaded_at >= NOW() - INTERVAL '7 days' THEN 20
        WHEN track_record.uploaded_at >= NOW() - INTERVAL '14 days' THEN 15
        WHEN track_record.uploaded_at >= NOW() - INTERVAL '21 days' THEN 10
        ELSE 5
      END INTO recency_score;
    
    -- 4. Regional Boost (if trending in multiple regions)
    SELECT COALESCE(
      COUNT(DISTINCT region_country) * 2.0,
      0
    ) INTO regional_boost
    FROM public.stream_logs sl
    WHERE sl.track_id = track_record.id
    AND sl.created_at >= NOW() - INTERVAL '24 hours'
    AND sl.region_country IS NOT NULL;
    
    -- Cap regional boost at 20
    regional_boost := LEAST(regional_boost, 20);
    
    -- Calculate final trending score
    final_score := velocity_score + engagement_score + recency_score + regional_boost;
    
    -- Insert or update trending score
    INSERT INTO public.trending_scores (
      track_id, 
      trending_score, 
      velocity_score, 
      engagement_score, 
      recency_score, 
      regional_boost,
      last_calculated
    ) VALUES (
      track_record.id,
      final_score,
      velocity_score,
      engagement_score,
      recency_score,
      regional_boost,
      NOW()
    )
    ON CONFLICT (track_id) 
    DO UPDATE SET
      trending_score = EXCLUDED.trending_score,
      velocity_score = EXCLUDED.velocity_score,
      engagement_score = EXCLUDED.engagement_score,
      recency_score = EXCLUDED.recency_score,
      regional_boost = EXCLUDED.regional_boost,
      last_calculated = NOW();
  END LOOP;
  
  -- Log the calculation
  INSERT INTO public.system_logs (message)
  VALUES ('Trending scores calculated for ' || (SELECT COUNT(*) FROM public.trending_scores) || ' tracks');
END;
$function$;

-- Create function to get trending tracks
CREATE OR REPLACE FUNCTION public.get_trending_tracks(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  track_id UUID,
  trending_score DECIMAL,
  velocity_score DECIMAL,
  engagement_score DECIMAL,
  recency_score DECIMAL,
  regional_boost DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Ensure scores are fresh (recalculate if older than 30 minutes)
  IF NOT EXISTS (
    SELECT 1 FROM public.trending_scores 
    WHERE last_calculated >= NOW() - INTERVAL '30 minutes'
  ) THEN
    PERFORM public.calculate_trending_scores();
  END IF;
  
  RETURN QUERY
  SELECT 
    ts.track_id,
    ts.trending_score,
    ts.velocity_score,
    ts.engagement_score,
    ts.recency_score,
    ts.regional_boost
  FROM public.trending_scores ts
  JOIN public.tracks t ON t.id = ts.track_id
  WHERE t.published = true
  ORDER BY ts.trending_score DESC
  LIMIT limit_count;
END;
$function$;

-- Update the regional charts function to ensure Top 50
CREATE OR REPLACE FUNCTION public.create_regional_chart_playlists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  region_record RECORD;
  playlist_id UUID;
  track_record RECORD;
  position_counter INTEGER;
  region_name TEXT;
  target_tracks INTEGER := 50; -- Always target 50 tracks
BEGIN
  -- Get all regions that have streaming data
  FOR region_record IN
    SELECT DISTINCT region_country
    FROM public.regional_charts
    WHERE region_country IS NOT NULL
    ORDER BY region_country
  LOOP
    region_name := public.get_region_display_name(region_record.region_country);
    
    -- Check if playlist already exists for this region
    SELECT id INTO playlist_id
    FROM public.playlists
    WHERE title = 'Top 50 ' || region_name || ' Songs'
    AND is_editorial = true;
    
    -- Create playlist if it doesn't exist
    IF playlist_id IS NULL THEN
      INSERT INTO public.playlists (
        title,
        description,
        is_editorial,
        created_by,
        cover_image_path
      ) VALUES (
        'Top 50 ' || region_name || ' Songs',
        'The top 50 most streamed songs in ' || region_name || ' - Updated every 24 hours based on streams',
        true,
        (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
        null
      ) RETURNING id INTO playlist_id;
    ELSE
      -- Clear existing tracks from playlist
      DELETE FROM public.playlist_tracks WHERE playlist_id = playlist_id;
      
      -- Update playlist description and timestamp
      UPDATE public.playlists 
      SET description = 'The top 50 most streamed songs in ' || region_name || ' - Updated every 24 hours based on streams',
          updated_at = now()
      WHERE id = playlist_id;
    END IF;
    
    -- Add top tracks to playlist (always target 50)
    position_counter := 1;
    FOR track_record IN
      SELECT rc.track_id
      FROM public.regional_charts rc
      JOIN public.tracks t ON t.id = rc.track_id
      WHERE rc.region_country = region_record.region_country
      AND t.published = true
      ORDER BY rc.play_count DESC
      LIMIT target_tracks
    LOOP
      INSERT INTO public.playlist_tracks (
        playlist_id,
        track_id,
        position
      ) VALUES (
        playlist_id,
        track_record.track_id,
        position_counter
      );
      
      position_counter := position_counter + 1;
    END LOOP;
    
    -- Log the playlist creation/update
    INSERT INTO public.system_logs (message)
    VALUES ('Updated regional playlist: Top 50 ' || region_name || ' Songs (' || (position_counter - 1) || ' tracks)');
  END LOOP;
  
  -- Create Global Top 50 playlist
  SELECT id INTO playlist_id
  FROM public.playlists
  WHERE title = 'Global Top 50'
  AND is_editorial = true;
  
  IF playlist_id IS NULL THEN
    INSERT INTO public.playlists (
      title,
      description,
      is_editorial,
      created_by,
      cover_image_path
    ) VALUES (
      'Global Top 50',
      'The top 50 most streamed songs worldwide - Updated every 24 hours based on global streams',
      true,
      (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
      null
    ) RETURNING id INTO playlist_id;
  ELSE
    DELETE FROM public.playlist_tracks WHERE playlist_id = playlist_id;
    UPDATE public.playlists 
    SET updated_at = now()
    WHERE id = playlist_id;
  END IF;
  
  -- Add global top tracks (ensure 50 tracks)
  position_counter := 1;
  FOR track_record IN
    SELECT gc.track_id
    FROM public.global_charts gc
    JOIN public.tracks t ON t.id = gc.track_id
    WHERE t.published = true
    ORDER BY gc.play_count DESC
    LIMIT target_tracks
  LOOP
    INSERT INTO public.playlist_tracks (
      playlist_id,
      track_id,
      position
    ) VALUES (
      playlist_id,
      track_record.track_id,
      position_counter
    );
    
    position_counter := position_counter + 1;
  END LOOP;
  
  INSERT INTO public.system_logs (message)
  VALUES ('Updated Global Top 50 playlist (' || (position_counter - 1) || ' tracks)');
END;
$function$;