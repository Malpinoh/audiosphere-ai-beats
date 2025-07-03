-- Add RLS policy for profiles table to allow public read access and user-specific write access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view profiles (for artist profiles, public listings, etc.)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow users to insert their own profile only
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile only
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to delete their own profile (optional)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Allow tracks to be inserted by authenticated users
CREATE POLICY "Authenticated users can insert tracks" 
ON public.tracks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Populate charts with existing data using a background function
CREATE OR REPLACE FUNCTION public.populate_charts_with_existing_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Populate regional charts based on existing stream logs
  INSERT INTO regional_charts (track_id, play_count, last_played_at, region_country)
  SELECT 
    sl.track_id,
    COUNT(*) as play_count,
    MAX(sl.created_at) as last_played_at,
    sl.region_country
  FROM stream_logs sl
  GROUP BY sl.track_id, sl.region_country
  ON CONFLICT (track_id, region_country) DO UPDATE SET
    play_count = EXCLUDED.play_count,
    last_played_at = EXCLUDED.last_played_at;

  -- Populate global charts
  INSERT INTO global_charts (track_id, play_count, last_played_at)
  SELECT 
    sl.track_id,
    COUNT(*) as play_count,
    MAX(sl.created_at) as last_played_at
  FROM stream_logs sl
  GROUP BY sl.track_id
  ON CONFLICT (track_id) DO UPDATE SET
    play_count = EXCLUDED.play_count,
    last_played_at = EXCLUDED.last_played_at;

  -- Log the operation
  INSERT INTO system_logs (message) VALUES ('Charts populated with existing data');
END;
$$;

-- Run the population function
SELECT public.populate_charts_with_existing_data();