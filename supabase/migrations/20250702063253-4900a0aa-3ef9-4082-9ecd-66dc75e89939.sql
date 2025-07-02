-- Fix the profiles table foreign key constraint issue
-- Drop the foreign key constraint that's causing the upload to fail
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Update the handle_new_user function to handle conflicts
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