-- Update stream_logs to capture more location details and browser info
ALTER TABLE stream_logs 
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS browser_name text,
ADD COLUMN IF NOT EXISTS browser_version text,
ADD COLUMN IF NOT EXISTS device_type text;

-- Add follower count to playlists
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;

-- Create function to update playlist follower count
CREATE OR REPLACE FUNCTION update_playlist_follower_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists 
        SET follower_count = GREATEST(0, follower_count - 1) 
        WHERE id = OLD.playlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for playlist follower count
DROP TRIGGER IF EXISTS update_playlist_follower_count_trigger ON playlist_followers;
CREATE TRIGGER update_playlist_follower_count_trigger
    AFTER INSERT OR DELETE ON playlist_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_follower_count();

-- Update RLS policies for playlist_followers to allow deleting
DROP POLICY IF EXISTS "Users can delete their own followers" ON playlist_followers;
CREATE POLICY "Users can delete their own followers" 
ON playlist_followers 
FOR DELETE 
USING (auth.uid() = profile_id);

-- Create function to check if user is following a playlist
CREATE OR REPLACE FUNCTION is_following_playlist(p_playlist_id uuid, p_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
    following_count integer;
BEGIN
    SELECT COUNT(*) INTO following_count
    FROM playlist_followers
    WHERE playlist_id = p_playlist_id AND profile_id = p_user_id;
    
    RETURN following_count > 0;
END;
$$;

-- Filter regional charts to African countries only
CREATE OR REPLACE VIEW african_regional_charts AS
SELECT * FROM regional_charts
WHERE region_country IN (
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 
    'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 
    'Congo', 'Democratic Republic of the Congo', 'Djibouti', 'Egypt', 
    'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 
    'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 
    'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 
    'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 
    'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 
    'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 
    'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
);

-- Add RLS policy for the view
ALTER TABLE regional_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view regional charts" 
ON regional_charts 
FOR SELECT 
USING (true);