-- Add parent_id to comments table for nested replies
ALTER TABLE public.comments 
ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for better performance on nested comments
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_track_parent ON public.comments(track_id, parent_id);

-- Create reports table for comment reporting
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  UNIQUE(reporter_id, comment_id)
);

-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports
CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" 
ON public.reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can update reports" 
ON public.reports 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create function to automatically flag comments when reported multiple times
CREATE OR REPLACE FUNCTION public.auto_flag_reported_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count total reports for this comment
  SELECT COUNT(*) INTO report_count
  FROM public.reports
  WHERE comment_id = NEW.comment_id AND status = 'pending';
  
  -- Auto-flag if 3 or more reports
  IF report_count >= 3 THEN
    UPDATE public.comments
    SET flagged = true
    WHERE id = NEW.comment_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-flagging
CREATE TRIGGER auto_flag_trigger
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_flag_reported_comments();