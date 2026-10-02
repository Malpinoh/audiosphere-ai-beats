CREATE OR REPLACE FUNCTION public.update_playlist_follower_count()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.playlists SET follower_count = COALESCE(follower_count,0) + 1 WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.playlists SET follower_count = GREATEST(0, COALESCE(follower_count,0) - 1) WHERE id = OLD.playlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;
GRANT SELECT ON public.playlist_followers TO anon;
GRANT SELECT, INSERT, DELETE ON public.playlist_followers TO authenticated;
GRANT ALL ON public.playlist_followers TO service_role;