-- Check and fix the profiles table foreign key constraint issue
-- The error suggests profiles.id has a foreign key constraint to auth.users
-- But we're trying to create profiles for API key users that may not exist in auth.users

-- First, let's see what constraints exist on profiles
SELECT 
    constraint_name, 
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' AND tc.table_schema = 'public';

-- Drop the foreign key constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Instead of requiring profiles.id to reference auth.users,
-- we'll allow profiles to exist independently since we have API key users
-- who don't have entries in auth.users but still need profiles

-- Update the handle_new_user function to handle the case where the profile might already exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT DO NOTHING to avoid errors if profile already exists
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'::app_role)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;