-- Create enum for audio quality tiers
CREATE TYPE audio_quality_tier AS ENUM ('normal', 'high', 'hifi', 'hires');

-- Create enum for audio format
CREATE TYPE audio_format AS ENUM ('mp3', 'flac', 'aac', 'wav');

-- Create track quality variants table
CREATE TABLE public.track_quality_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  quality_tier audio_quality_tier NOT NULL,
  format audio_format NOT NULL,
  bitrate INTEGER, -- in kbps (null for lossless)
  sample_rate INTEGER NOT NULL DEFAULT 44100, -- in Hz
  bit_depth INTEGER DEFAULT 16, -- 16-bit or 24-bit
  file_path TEXT NOT NULL,
  file_size BIGINT, -- in bytes
  duration INTEGER, -- in seconds
  hls_playlist_path TEXT, -- .m3u8 file path
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(track_id, quality_tier)
);

-- Create user audio preferences table
CREATE TABLE public.user_audio_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_quality audio_quality_tier NOT NULL DEFAULT 'high',
  auto_quality BOOLEAN NOT NULL DEFAULT true,
  enable_eq BOOLEAN NOT NULL DEFAULT false,
  eq_preset JSONB DEFAULT '{}',
  volume_normalization BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HLS segments table for tracking generated segments
CREATE TABLE public.hls_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.track_quality_variants(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  segment_path TEXT NOT NULL,
  segment_duration DECIMAL(10, 3), -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(variant_id, segment_index)
);

-- Enable RLS
ALTER TABLE public.track_quality_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audio_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hls_segments ENABLE ROW LEVEL SECURITY;

-- RLS policies for track_quality_variants (public read)
CREATE POLICY "Anyone can view track quality variants"
ON public.track_quality_variants FOR SELECT USING (true);

CREATE POLICY "Track owners can manage variants"
ON public.track_quality_variants FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.tracks WHERE id = track_id AND user_id = auth.uid())
);

-- RLS policies for user_audio_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_audio_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_audio_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_audio_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for hls_segments (public read)
CREATE POLICY "Anyone can view HLS segments"
ON public.hls_segments FOR SELECT USING (true);

CREATE POLICY "Track owners can manage segments"
ON public.hls_segments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tracks t
    JOIN public.track_quality_variants v ON v.track_id = t.id
    WHERE v.id = variant_id AND t.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_track_quality_variants_track_id ON public.track_quality_variants(track_id);
CREATE INDEX idx_track_quality_variants_quality ON public.track_quality_variants(quality_tier);
CREATE INDEX idx_hls_segments_variant_id ON public.hls_segments(variant_id);
CREATE INDEX idx_hls_segments_track_id ON public.hls_segments(track_id);

-- Function to get best quality variant for a track based on user preference or bandwidth
CREATE OR REPLACE FUNCTION public.get_track_stream_url(
  p_track_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_max_bitrate INTEGER DEFAULT NULL
)
RETURNS TABLE (
  variant_id UUID,
  quality_tier audio_quality_tier,
  format audio_format,
  bitrate INTEGER,
  file_path TEXT,
  hls_playlist_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_quality audio_quality_tier;
  auto_mode BOOLEAN;
BEGIN
  -- Get user preferences if logged in
  IF p_user_id IS NOT NULL THEN
    SELECT preferred_quality, auto_quality INTO user_quality, auto_mode
    FROM user_audio_preferences
    WHERE user_id = p_user_id;
  END IF;

  -- Default to high quality and auto mode
  user_quality := COALESCE(user_quality, 'high');
  auto_mode := COALESCE(auto_mode, true);

  -- If auto mode and max bitrate specified, find best matching quality
  IF auto_mode AND p_max_bitrate IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      v.id, v.quality_tier, v.format, v.bitrate, v.file_path, v.hls_playlist_path
    FROM track_quality_variants v
    WHERE v.track_id = p_track_id
      AND (v.bitrate IS NULL OR v.bitrate <= p_max_bitrate)
    ORDER BY 
      CASE 
        WHEN v.bitrate IS NULL THEN 9999 -- Lossless gets highest priority if bandwidth allows
        ELSE v.bitrate 
      END DESC
    LIMIT 1;
  ELSE
    -- Return user preferred quality or closest available
    RETURN QUERY
    SELECT 
      v.id, v.quality_tier, v.format, v.bitrate, v.file_path, v.hls_playlist_path
    FROM track_quality_variants v
    WHERE v.track_id = p_track_id
      AND v.quality_tier = user_quality
    LIMIT 1;
    
    -- If preferred quality not available, return highest available
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT 
        v.id, v.quality_tier, v.format, v.bitrate, v.file_path, v.hls_playlist_path
      FROM track_quality_variants v
      WHERE v.track_id = p_track_id
      ORDER BY 
        CASE v.quality_tier
          WHEN 'hires' THEN 4
          WHEN 'hifi' THEN 3
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 1
        END DESC
      LIMIT 1;
    END IF;
  END IF;
END;
$$;

-- Function to get all available qualities for a track
CREATE OR REPLACE FUNCTION public.get_track_qualities(p_track_id UUID)
RETURNS TABLE (
  quality_tier audio_quality_tier,
  format audio_format,
  bitrate INTEGER,
  sample_rate INTEGER,
  bit_depth INTEGER,
  file_path TEXT,
  hls_playlist_path TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.quality_tier,
    v.format,
    v.bitrate,
    v.sample_rate,
    v.bit_depth,
    v.file_path,
    v.hls_playlist_path,
    CASE v.quality_tier
      WHEN 'normal' THEN 'Normal (128kbps)'
      WHEN 'high' THEN 'High (320kbps)'
      WHEN 'hifi' THEN 'Hi-Fi (Lossless)'
      WHEN 'hires' THEN 'Hi-Res (24-bit)'
    END as display_name
  FROM track_quality_variants v
  WHERE v.track_id = p_track_id
  ORDER BY 
    CASE v.quality_tier
      WHEN 'normal' THEN 1
      WHEN 'high' THEN 2
      WHEN 'hifi' THEN 3
      WHEN 'hires' THEN 4
    END;
END;
$$;

-- Add max_quality column to tracks for quick reference
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS max_quality audio_quality_tier DEFAULT 'normal';
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_hires BOOLEAN DEFAULT false;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_lossless BOOLEAN DEFAULT false;