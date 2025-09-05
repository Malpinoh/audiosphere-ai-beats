-- Create royalty rates table for different streaming tiers
CREATE TABLE public.royalty_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  rate_per_stream DECIMAL(10,8) NOT NULL, -- Rate per stream in USD (e.g., 0.003 = $0.003 per stream)
  minimum_payout DECIMAL(10,2) NOT NULL DEFAULT 10.00, -- Minimum amount for payout
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create earnings table to track revenue per stream
CREATE TABLE public.earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  stream_log_id UUID NOT NULL REFERENCES public.stream_logs(id) ON DELETE CASCADE,
  rate_per_stream DECIMAL(10,8) NOT NULL,
  earnings_amount DECIMAL(10,6) NOT NULL, -- Actual earnings for this stream
  region_country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payout requests table for withdrawal management
CREATE TABLE public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe')),
  payment_details JSONB, -- Store payment method details
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  transaction_id TEXT -- External payment processor transaction ID
);

-- Create artist earnings summary view
CREATE VIEW public.artist_earnings_summary AS
SELECT 
  p.id as artist_id,
  p.username as artist_name,
  COUNT(DISTINCT e.track_id) as total_tracks,
  COUNT(e.id) as total_streams,
  COALESCE(SUM(e.earnings_amount), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN pr.status = 'completed' THEN pr.amount ELSE 0 END), 0) as total_paid_out,
  COALESCE(SUM(e.earnings_amount), 0) - COALESCE(SUM(CASE WHEN pr.status = 'completed' THEN pr.amount ELSE 0 END), 0) as available_balance,
  COUNT(pr.id) FILTER (WHERE pr.status = 'pending') as pending_payouts
FROM public.profiles p
LEFT JOIN public.earnings e ON p.id = e.artist_id
LEFT JOIN public.payout_requests pr ON p.id = pr.artist_id
WHERE p.role = 'artist'
GROUP BY p.id, p.username;

-- Enable RLS on new tables
ALTER TABLE public.royalty_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for royalty_rates (admins only)
CREATE POLICY "Admins can manage royalty rates" ON public.royalty_rates
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view royalty rates" ON public.royalty_rates
FOR SELECT USING (true);

-- RLS Policies for earnings
CREATE POLICY "Artists can view their own earnings" ON public.earnings
FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Admins can view all earnings" ON public.earnings
FOR SELECT USING (is_admin());

CREATE POLICY "System can insert earnings" ON public.earnings
FOR INSERT WITH CHECK (true);

-- RLS Policies for payout_requests
CREATE POLICY "Artists can view their own payout requests" ON public.payout_requests
FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Artists can create payout requests" ON public.payout_requests
FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their pending requests" ON public.payout_requests
FOR UPDATE USING (auth.uid() = artist_id AND status = 'pending');

CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests
FOR ALL USING (is_admin());

-- Insert default royalty rates
INSERT INTO public.royalty_rates (tier_name, rate_per_stream, minimum_payout) VALUES
('Basic', 0.002, 10.00),
('Premium', 0.003, 5.00),
('Pro', 0.004, 5.00);

-- Create function to calculate and record earnings
CREATE OR REPLACE FUNCTION public.calculate_stream_earnings()
RETURNS TRIGGER AS $$
DECLARE
  track_artist_id UUID;
  current_rate DECIMAL(10,8);
  earnings DECIMAL(10,6);
BEGIN
  -- Get the artist ID for the track
  SELECT user_id INTO track_artist_id
  FROM public.tracks 
  WHERE id = NEW.track_id;
  
  -- Get current rate (use Basic rate as default)
  SELECT rate_per_stream INTO current_rate
  FROM public.royalty_rates 
  WHERE tier_name = 'Basic'
  LIMIT 1;
  
  -- Calculate earnings
  earnings := current_rate;
  
  -- Insert earnings record
  INSERT INTO public.earnings (
    artist_id,
    track_id,
    stream_log_id,
    rate_per_stream,
    earnings_amount,
    region_country
  ) VALUES (
    track_artist_id,
    NEW.track_id,
    NEW.id,
    current_rate,
    earnings,
    NEW.region_country
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;