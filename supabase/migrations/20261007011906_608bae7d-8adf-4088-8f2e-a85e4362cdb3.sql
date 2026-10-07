REVOKE EXECUTE ON FUNCTION public.get_artist_dashboard_stats(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.review_editorial_submission(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.review_release_boost(uuid, boolean, text) FROM PUBLIC, anon;