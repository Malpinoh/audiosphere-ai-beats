-- Create likes table to track user likes for tracks
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Users can view all likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update like count on tracks
CREATE OR REPLACE FUNCTION public.update_track_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment like count
    UPDATE public.tracks 
    SET like_count = COALESCE(like_count, 0) + 1 
    WHERE id = NEW.track_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement like count
    UPDATE public.tracks 
    SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
    WHERE id = OLD.track_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update like count
CREATE TRIGGER update_like_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_track_like_count();

-- Create saved_tracks table for user saved tracks
CREATE TABLE public.saved_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS on saved_tracks table
ALTER TABLE public.saved_tracks ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_tracks
CREATE POLICY "Users can view their own saved tracks" 
ON public.saved_tracks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved tracks" 
ON public.saved_tracks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved tracks" 
ON public.saved_tracks 
FOR DELETE 
USING (auth.uid() = user_id);