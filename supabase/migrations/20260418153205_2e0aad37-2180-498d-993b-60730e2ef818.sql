-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Featured banners table
CREATE TABLE public.featured_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_featured_banners_order ON public.featured_banners(display_order);
CREATE INDEX idx_featured_banners_active ON public.featured_banners(is_active);

ALTER TABLE public.featured_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.featured_banners FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert banners"
  ON public.featured_banners FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update banners"
  ON public.featured_banners FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete banners"
  ON public.featured_banners FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_featured_banners_updated_at
  BEFORE UPDATE ON public.featured_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('featured_banners', 'featured_banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Banner images publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'featured_banners');

CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'featured_banners' AND public.is_admin());

CREATE POLICY "Admins can update banner images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'featured_banners' AND public.is_admin());

CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'featured_banners' AND public.is_admin());