-- Create auto-generated regional playlists
-- First, create a function to get region name from country code
CREATE OR REPLACE FUNCTION public.get_region_display_name(country_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN CASE country_code
    WHEN 'NG' THEN 'Nigeria'
    WHEN 'GH' THEN 'Ghana'
    WHEN 'GB' THEN 'United Kingdom'
    WHEN 'UK' THEN 'United Kingdom'
    WHEN 'US' THEN 'United States'
    WHEN 'CA' THEN 'Canada'
    WHEN 'ZA' THEN 'South Africa'
    WHEN 'KE' THEN 'Kenya'
    WHEN 'EG' THEN 'Egypt'
    WHEN 'MA' THEN 'Morocco'
    WHEN 'TZ' THEN 'Tanzania'
    WHEN 'UG' THEN 'Uganda'
    WHEN 'ET' THEN 'Ethiopia'
    WHEN 'RW' THEN 'Rwanda'
    WHEN 'SN' THEN 'Senegal'
    WHEN 'CI' THEN 'Ivory Coast'
    WHEN 'BF' THEN 'Burkina Faso'
    WHEN 'ML' THEN 'Mali'
    WHEN 'NE' THEN 'Niger'
    WHEN 'TD' THEN 'Chad'
    WHEN 'CM' THEN 'Cameroon'
    WHEN 'AO' THEN 'Angola'
    WHEN 'MZ' THEN 'Mozambique'
    WHEN 'MG' THEN 'Madagascar'
    WHEN 'ZW' THEN 'Zimbabwe'
    WHEN 'ZM' THEN 'Zambia'
    WHEN 'BW' THEN 'Botswana'
    WHEN 'NA' THEN 'Namibia'
    WHEN 'SZ' THEN 'Eswatini'
    WHEN 'LS' THEN 'Lesotho'
    WHEN 'MW' THEN 'Malawi'
    WHEN 'FR' THEN 'France'
    WHEN 'DE' THEN 'Germany'
    WHEN 'ES' THEN 'Spain'
    WHEN 'IT' THEN 'Italy'
    WHEN 'BR' THEN 'Brazil'
    WHEN 'MX' THEN 'Mexico'
    WHEN 'AR' THEN 'Argentina'
    WHEN 'CO' THEN 'Colombia'
    WHEN 'PE' THEN 'Peru'
    WHEN 'CL' THEN 'Chile'
    WHEN 'IN' THEN 'India'
    WHEN 'JP' THEN 'Japan'
    WHEN 'KR' THEN 'South Korea'
    WHEN 'AU' THEN 'Australia'
    WHEN 'NZ' THEN 'New Zealand'
    ELSE upper(country_code)
  END;
END;
$function$;

-- Create function to auto-create regional playlists
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
  top_tracks_count INTEGER;
BEGIN
  -- Get all regions that have streaming data
  FOR region_record IN
    SELECT DISTINCT region_country
    FROM public.regional_charts
    WHERE region_country IS NOT NULL
    ORDER BY region_country
  LOOP
    region_name := public.get_region_display_name(region_record.region_country);
    
    -- Determine playlist size based on region popularity
    SELECT COUNT(*) INTO top_tracks_count
    FROM public.regional_charts
    WHERE region_country = region_record.region_country;
    
    -- Set playlist size (25 for smaller regions, 50 for larger ones)
    IF top_tracks_count >= 100 THEN
      top_tracks_count := 50;
    ELSE
      top_tracks_count := LEAST(25, top_tracks_count);
    END IF;
    
    -- Check if playlist already exists for this region
    SELECT id INTO playlist_id
    FROM public.playlists
    WHERE title = 'Top ' || top_tracks_count || ' ' || region_name || ' Songs'
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
        'Top ' || top_tracks_count || ' ' || region_name || ' Songs',
        'The most streamed songs in ' || region_name || ' - Updated daily based on streams',
        true,
        (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
        null
      ) RETURNING id INTO playlist_id;
    ELSE
      -- Clear existing tracks from playlist
      DELETE FROM public.playlist_tracks WHERE playlist_id = playlist_id;
      
      -- Update playlist description
      UPDATE public.playlists 
      SET description = 'The most streamed songs in ' || region_name || ' - Updated daily based on streams',
          updated_at = now()
      WHERE id = playlist_id;
    END IF;
    
    -- Add top tracks to playlist
    position_counter := 1;
    FOR track_record IN
      SELECT rc.track_id
      FROM public.regional_charts rc
      JOIN public.tracks t ON t.id = rc.track_id
      WHERE rc.region_country = region_record.region_country
      AND t.published = true
      ORDER BY rc.play_count DESC
      LIMIT top_tracks_count
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
    VALUES ('Updated regional playlist: Top ' || top_tracks_count || ' ' || region_name || ' Songs (' || (position_counter - 1) || ' tracks)');
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
      'The most streamed songs worldwide - Updated daily based on global streams',
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
  
  -- Add global top tracks
  position_counter := 1;
  FOR track_record IN
    SELECT gc.track_id
    FROM public.global_charts gc
    JOIN public.tracks t ON t.id = gc.track_id
    WHERE t.published = true
    ORDER BY gc.play_count DESC
    LIMIT 50
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