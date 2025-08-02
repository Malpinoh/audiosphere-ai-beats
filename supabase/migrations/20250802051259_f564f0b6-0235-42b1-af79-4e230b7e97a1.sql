-- Add functionality for playlist track management
-- Create a function to reorder playlist tracks
CREATE OR REPLACE FUNCTION reorder_playlist_tracks(
  p_playlist_id UUID,
  p_track_positions JSONB
) RETURNS VOID
SECURITY DEFINER SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  track_update RECORD;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user has permission to edit playlists
  IF user_role IS NULL OR user_role NOT IN ('admin', 'editorial') THEN
    RAISE EXCEPTION 'Insufficient permissions to reorder playlist tracks';
  END IF;

  -- Update positions for each track
  FOR track_update IN 
    SELECT 
      (value->>'track_id')::UUID as track_id,
      (value->>'position')::INTEGER as new_position
    FROM jsonb_array_elements(p_track_positions) 
  LOOP
    UPDATE public.playlist_tracks 
    SET position = track_update.new_position
    WHERE playlist_id = p_playlist_id 
      AND track_id = track_update.track_id;
  END LOOP;
END;
$$;

-- Create a function to add track to playlist
CREATE OR REPLACE FUNCTION add_track_to_playlist(
  p_playlist_id UUID,
  p_track_id UUID,
  p_position INTEGER DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  new_id UUID;
  max_position INTEGER;
  user_role app_role;
BEGIN
  -- Get current user role
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user has permission to edit playlists
  IF user_role IS NULL OR user_role NOT IN ('admin', 'editorial') THEN
    RAISE EXCEPTION 'Insufficient permissions to add tracks to playlist';
  END IF;

  -- If no position specified, add to end
  IF p_position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO max_position
    FROM public.playlist_tracks 
    WHERE playlist_id = p_playlist_id;
    
    p_position := max_position;
  END IF;

  -- Insert the playlist track
  INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
  VALUES (p_playlist_id, p_track_id, p_position)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;