-- Fix security definer view issue by recreating the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.artist_earnings_summary;

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

-- Create trigger to automatically calculate earnings when streams are logged
DROP TRIGGER IF EXISTS calculate_earnings_on_stream ON public.stream_logs;
CREATE TRIGGER calculate_earnings_on_stream
  AFTER INSERT ON public.stream_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_stream_earnings();