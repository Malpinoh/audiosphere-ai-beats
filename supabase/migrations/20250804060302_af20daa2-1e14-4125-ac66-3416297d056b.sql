-- Create artist claims functionality
-- This allows users to claim existing artist profiles and attach them to their accounts

-- Function to generate cover art URL with fallback
CREATE OR REPLACE FUNCTION get_cover_art_url(cover_path text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN cover_path IS NULL OR cover_path = '' THEN 'https://picsum.photos/300/300'
    WHEN cover_path LIKE 'http%' THEN cover_path
    ELSE 'https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/' || cover_path
  END;
$$;

-- Function to generate avatar URL with fallback
CREATE OR REPLACE FUNCTION get_avatar_url(avatar_path text, fallback_name text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN avatar_path IS NULL OR avatar_path = '' THEN 
      'https://ui-avatars.com/api/?name=' || COALESCE(fallback_name, 'User') || '&background=random'
    WHEN avatar_path LIKE 'http%' THEN avatar_path
    ELSE 'https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/avatars/' || avatar_path
  END;
$$;

-- Update artist_claims table to include claim_type for better management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_claims' AND column_name = 'claim_type') THEN
    ALTER TABLE artist_claims ADD COLUMN claim_type text DEFAULT 'profile_attach' CHECK (claim_type IN ('profile_attach', 'new_profile', 'merge_profile'));
  END IF;
END $$;

-- Add notes column for admin feedback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artist_claims' AND column_name = 'admin_notes') THEN
    ALTER TABLE artist_claims ADD COLUMN admin_notes text;
  END IF;
END $$;

-- Function to check if user can claim a profile
CREATE OR REPLACE FUNCTION can_claim_profile(profile_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  existing_claim_count integer;
BEGIN
  -- Get the profile
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  -- Check if profile exists and is claimable
  IF NOT FOUND OR NOT profile_record.claimable THEN
    RETURN false;
  END IF;
  
  -- Check if user already has a pending or approved claim for this profile
  SELECT COUNT(*) INTO existing_claim_count
  FROM artist_claims 
  WHERE artist_profile_id = profile_id 
    AND claimant_user_id = user_id 
    AND claim_status IN ('pending', 'approved');
    
  IF existing_claim_count > 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to process claim approval
CREATE OR REPLACE FUNCTION approve_artist_claim(claim_id uuid, admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claim_record artist_claims%ROWTYPE;
  profile_record profiles%ROWTYPE;
BEGIN
  -- Get the claim
  SELECT * INTO claim_record FROM artist_claims WHERE id = claim_id;
  
  IF NOT FOUND OR claim_record.claim_status != 'pending' THEN
    RETURN false;
  END IF;
  
  -- Get the profile
  SELECT * INTO profile_record FROM profiles WHERE id = claim_record.artist_profile_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the claim
  UPDATE artist_claims 
  SET 
    claim_status = 'approved',
    reviewed_at = now(),
    reviewed_by = admin_id
  WHERE id = claim_id;
  
  -- Update the profile to link it to the user
  UPDATE profiles 
  SET 
    id = claim_record.claimant_user_id,
    auto_created = false,
    claimable = false,
    role = 'artist'::app_role
  WHERE id = claim_record.artist_profile_id;
  
  -- Update all tracks to point to the new user
  UPDATE tracks 
  SET 
    user_id = claim_record.claimant_user_id,
    artist_profile_id = claim_record.claimant_user_id
  WHERE artist_profile_id = claim_record.artist_profile_id;
  
  RETURN true;
END;
$$;