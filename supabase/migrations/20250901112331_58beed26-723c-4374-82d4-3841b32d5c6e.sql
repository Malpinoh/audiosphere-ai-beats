-- Improve the artist claim approval function to handle profile transfer more robustly
CREATE OR REPLACE FUNCTION public.approve_artist_claim(claim_id uuid, admin_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  claim_record artist_claims%ROWTYPE;
  profile_record profiles%ROWTYPE;
  new_profile_id uuid;
BEGIN
  -- Get the claim
  SELECT * INTO claim_record FROM artist_claims WHERE id = claim_id;
  
  IF NOT FOUND OR claim_record.claim_status != 'pending' THEN
    RETURN false;
  END IF;
  
  -- Get the artist profile
  SELECT * INTO profile_record FROM profiles WHERE id = claim_record.artist_profile_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Generate new ID for the claimed profile
  new_profile_id := claim_record.claimant_user_id;
  
  -- Update the claim
  UPDATE artist_claims 
  SET 
    claim_status = 'approved',
    reviewed_at = now(),
    reviewed_by = admin_id
  WHERE id = claim_id;
  
  -- Transfer the auto-generated profile data to the user's profile
  INSERT INTO profiles (
    id,
    username,
    full_name,
    role,
    bio,
    avatar_url,
    website,
    slug,
    is_verified,
    follower_count,
    monthly_listeners,
    claimable,
    auto_created,
    created_at
  ) VALUES (
    new_profile_id,
    profile_record.username,
    profile_record.full_name,
    'artist'::app_role,
    profile_record.bio,
    profile_record.avatar_url,
    profile_record.website,
    profile_record.slug,
    profile_record.is_verified,
    profile_record.follower_count,
    profile_record.monthly_listeners,
    false, -- no longer claimable
    false, -- no longer auto-created
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = 'artist'::app_role,
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    website = COALESCE(EXCLUDED.website, profiles.website),
    slug = EXCLUDED.slug,
    is_verified = EXCLUDED.is_verified,
    follower_count = EXCLUDED.follower_count,
    monthly_listeners = EXCLUDED.monthly_listeners,
    claimable = false,
    auto_created = false;
  
  -- Update all tracks to point to the new user profile
  UPDATE tracks 
  SET 
    user_id = new_profile_id,
    artist_profile_id = new_profile_id
  WHERE artist_profile_id = claim_record.artist_profile_id;
  
  -- Transfer followers from old profile to new profile
  UPDATE followers 
  SET artist_id = new_profile_id
  WHERE artist_id = claim_record.artist_profile_id;
  
  -- Delete the old auto-generated profile if it's different from the user's profile
  IF claim_record.artist_profile_id != new_profile_id THEN
    DELETE FROM profiles WHERE id = claim_record.artist_profile_id;
  END IF;
  
  RETURN true;
END;
$function$;