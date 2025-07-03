-- Add slug column to profiles table for SEO-friendly artist URLs
ALTER TABLE public.profiles 
ADD COLUMN slug text UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_profiles_slug ON public.profiles(slug);

-- Create function to generate unique slugs from names
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase, replace spaces/special chars with hyphens
  base_slug := lower(trim(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Ensure it's not empty
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'artist';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Generate slugs for existing artist profiles
UPDATE public.profiles 
SET slug = public.generate_slug(COALESCE(username, full_name, 'artist-' || id::text))
WHERE role = 'artist' AND slug IS NULL;

-- Create trigger to auto-generate slugs for new artist profiles
CREATE OR REPLACE FUNCTION public.auto_generate_artist_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate slug for artists if not already provided
  IF NEW.role = 'artist' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := public.generate_slug(COALESCE(NEW.username, NEW.full_name, 'artist-' || NEW.id::text));
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_artist_slug ON public.profiles;
CREATE TRIGGER trigger_auto_generate_artist_slug
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_artist_slug();