REVOKE EXECUTE ON FUNCTION public.protect_profile_system_fields() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_artist_claim() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.my_artist_claim_status(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_artist_claim_status(uuid) TO authenticated;