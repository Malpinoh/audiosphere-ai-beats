
-- This is a helper file only and not directly executed
-- You need to run this SQL in the Supabase SQL editor

-- Create a function to get chart data safely regardless of view
CREATE OR REPLACE FUNCTION get_chart_data(view_name TEXT, region_country TEXT DEFAULT NULL)
RETURNS TABLE (
  track_id UUID,
  play_count BIGINT, 
  last_played_at TIMESTAMPTZ,
  region_country TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  IF view_name = 'global_charts' THEN
    RETURN QUERY 
    SELECT 
      gc.track_id,
      gc.play_count, 
      gc.last_played_at,
      NULL::TEXT as region_country
    FROM global_charts gc
    ORDER BY gc.play_count DESC
    LIMIT 100;
  ELSIF view_name = 'regional_charts' THEN
    IF region_country IS NOT NULL THEN
      RETURN QUERY 
      SELECT 
        rc.track_id, 
        rc.play_count, 
        rc.last_played_at,
        rc.region_country
      FROM regional_charts rc
      WHERE rc.region_country = region_country
      ORDER BY rc.play_count DESC
      LIMIT 100;
    ELSE
      RETURN QUERY 
      SELECT 
        rc.track_id, 
        rc.play_count, 
        rc.last_played_at,
        rc.region_country
      FROM regional_charts rc
      ORDER BY rc.region_country, rc.play_count DESC
      LIMIT 100;
    END IF;
  ELSE
    -- Fallback to tracks table
    RETURN QUERY 
    SELECT 
      t.id as track_id, 
      t.play_count, 
      t.uploaded_at as last_played_at,
      NULL::TEXT as region_country
    FROM tracks t
    ORDER BY t.play_count DESC
    LIMIT 100;
  END IF;
END;
$$;
