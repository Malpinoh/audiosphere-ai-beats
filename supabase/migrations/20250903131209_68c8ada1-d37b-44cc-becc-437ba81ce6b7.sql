-- Create a function to update existing tracks with calculated durations
-- This is a temporary fix for tracks that don't have duration set

-- Since we can't calculate duration in SQL, we'll set a default duration
-- based on typical track lengths. In practice, these would be updated
-- when tracks are re-uploaded or through a separate process

UPDATE tracks 
SET duration = CASE 
  WHEN track_type = 'single' THEN 180  -- 3 minutes default for singles
  WHEN track_type = 'ep' THEN 240      -- 4 minutes default for EP tracks  
  WHEN track_type = 'album' THEN 210   -- 3.5 minutes default for album tracks
  ELSE 180                             -- 3 minutes default fallback
END
WHERE duration IS NULL OR duration = 0;