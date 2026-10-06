
CREATE OR REPLACE FUNCTION public.get_artist_dashboard_stats(_artist_profile_id uuid, _days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb; d int := LEAST(GREATEST(COALESCE(_days,30),7),365);
BEGIN
  IF NOT (public.is_artist_manager(_artist_profile_id, auth.uid()) OR public.is_admin()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  WITH t AS (SELECT id, title, play_count, like_count, uploaded_at FROM tracks WHERE artist_profile_id = _artist_profile_id),
  s AS (SELECT sl.* FROM stream_logs sl JOIN t ON t.id = sl.track_id WHERE sl.created_at >= now() - make_interval(days => d))
  SELECT jsonb_build_object(
    'tracks', (SELECT count(*) FROM t),
    'plays', (SELECT COALESCE(sum(play_count),0) FROM t),
    'likes', (SELECT COALESCE(sum(like_count),0) FROM t),
    'followers', (SELECT count(*) FROM followers WHERE artist_id = _artist_profile_id),
    'followers_7d', (SELECT count(*) FROM followers WHERE artist_id = _artist_profile_id AND followed_at >= now() - interval '7 days'),
    'streams_7d', (SELECT count(*) FROM stream_logs sl JOIN t ON t.id=sl.track_id WHERE sl.created_at >= now()-interval '7 days'),
    'streams_prev_7d', (SELECT count(*) FROM stream_logs sl JOIN t ON t.id=sl.track_id WHERE sl.created_at >= now()-interval '14 days' AND sl.created_at < now()-interval '7 days'),
    'listeners', (SELECT count(DISTINCT COALESCE(user_id::text, ip_address)) FROM s),
    'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', to_char(g::date,'Mon DD'), 'streams', COALESCE(c.n,0)) ORDER BY g)
        FROM generate_series((now() - make_interval(days => d-1))::date, now()::date, interval '1 day') g
        LEFT JOIN (SELECT created_at::date dd, count(*) n FROM s GROUP BY 1) c ON c.dd = g::date), '[]'),
    'follower_daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', to_char(g::date,'Mon DD'), 'followers',
        (SELECT count(*) FROM followers f WHERE f.artist_id=_artist_profile_id AND f.followed_at < g::date + 1)) ORDER BY g)
        FROM generate_series((now() - make_interval(days => d-1))::date, now()::date, interval '1 day') g), '[]'),
    'countries', COALESCE((SELECT jsonb_agg(x) FROM (SELECT region_country AS name, count(*) AS streams FROM s GROUP BY 1 ORDER BY 2 DESC LIMIT 8) x), '[]'),
    'cities', COALESCE((SELECT jsonb_agg(x) FROM (SELECT region_city AS name, region_country AS country, count(*) AS streams FROM s WHERE region_city IS NOT NULL AND region_city <> '' GROUP BY 1,2 ORDER BY 3 DESC LIMIT 8) x), '[]'),
    'devices', COALESCE((SELECT jsonb_agg(x) FROM (SELECT COALESCE(NULLIF(device_type,''),'unknown') AS name, count(*) AS streams FROM s GROUP BY 1 ORDER BY 2 DESC) x), '[]'),
    'top_tracks', COALESCE((SELECT jsonb_agg(x) FROM (SELECT t.id, t.title, count(s.id) AS streams FROM t JOIN s ON s.track_id=t.id GROUP BY 1,2 ORDER BY 3 DESC LIMIT 5) x), '[]'),
    'placements', COALESCE((SELECT jsonb_agg(x) FROM (SELECT DISTINCT p.id, p.title, p.is_editorial FROM playlist_tracks pt JOIN playlists p ON p.id=pt.playlist_id JOIN t ON t.id=pt.track_id LIMIT 20) x), '[]')
  ) INTO r;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.get_artist_dashboard_stats(uuid, integer) TO authenticated;

CREATE TABLE public.release_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL DEFAULT auth.uid(),
  target_genre text,
  duration_days integer NOT NULL DEFAULT 7 CHECK (duration_days BETWEEN 1 AND 30),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','ended')),
  starts_at timestamptz, ends_at timestamptz,
  admin_notes text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX release_boosts_one_open ON public.release_boosts(track_id) WHERE status IN ('pending','active');
GRANT SELECT ON public.release_boosts TO anon;
GRANT SELECT, INSERT, UPDATE ON public.release_boosts TO authenticated;
GRANT ALL ON public.release_boosts TO service_role;
ALTER TABLE public.release_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active boosts are public" ON public.release_boosts FOR SELECT USING (status='active' AND now() BETWEEN starts_at AND ends_at);
CREATE POLICY "Managers see own boosts" ON public.release_boosts FOR SELECT TO authenticated USING (public.is_artist_manager(artist_profile_id, auth.uid()) OR public.is_admin());
CREATE POLICY "Managers request boosts" ON public.release_boosts FOR INSERT TO authenticated WITH CHECK (
  requested_by = auth.uid() AND status='pending' AND public.is_artist_manager(artist_profile_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.tracks WHERE id=track_id AND artist_profile_id=release_boosts.artist_profile_id));
CREATE POLICY "Admins review boosts" ON public.release_boosts FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER release_boosts_touch BEFORE UPDATE ON public.release_boosts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.editorial_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL DEFAULT auth.uid(),
  pitch text NOT NULL CHECK (char_length(pitch) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX editorial_submissions_one_open ON public.editorial_submissions(track_id, playlist_id) WHERE status='pending';
GRANT SELECT, INSERT ON public.editorial_submissions TO authenticated;
GRANT ALL ON public.editorial_submissions TO service_role;
ALTER TABLE public.editorial_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers and admins view pitches" ON public.editorial_submissions FOR SELECT TO authenticated USING (public.is_artist_manager(artist_profile_id, auth.uid()) OR public.is_admin());
CREATE POLICY "Managers pitch own tracks" ON public.editorial_submissions FOR INSERT TO authenticated WITH CHECK (
  submitted_by = auth.uid() AND status='pending' AND public.is_artist_manager(artist_profile_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.tracks WHERE id=track_id AND artist_profile_id=editorial_submissions.artist_profile_id)
  AND EXISTS (SELECT 1 FROM public.playlists WHERE id=playlist_id AND is_editorial));
CREATE TRIGGER editorial_submissions_touch BEFORE UPDATE ON public.editorial_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.review_editorial_submission(_id uuid, _approve boolean, _notes text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sub record; pos int;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO sub FROM editorial_submissions WHERE id=_id AND status='pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission not pending'; END IF;
  IF _approve AND NOT EXISTS (SELECT 1 FROM playlist_tracks WHERE playlist_id=sub.playlist_id AND track_id=sub.track_id) THEN
    SELECT COALESCE(max(position),0)+1 INTO pos FROM playlist_tracks WHERE playlist_id=sub.playlist_id;
    INSERT INTO playlist_tracks(playlist_id, track_id, position) VALUES (sub.playlist_id, sub.track_id, pos);
  END IF;
  UPDATE editorial_submissions SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    admin_notes = left(_notes,1000), reviewed_by = auth.uid(), reviewed_at = now() WHERE id=_id;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.review_editorial_submission(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_release_boost(_id uuid, _approve boolean, _notes text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE release_boosts SET status = CASE WHEN _approve THEN 'active' ELSE 'rejected' END,
    starts_at = CASE WHEN _approve THEN now() END,
    ends_at = CASE WHEN _approve THEN now() + make_interval(days => duration_days) END,
    admin_notes = left(_notes,1000), reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id=_id AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'boost not pending'; END IF;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.review_release_boost(uuid, boolean, text) TO authenticated;

CREATE TABLE public.listener_profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  favorite_genres text[] NOT NULL DEFAULT '{}',
  country text, city text,
  prompt_dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.listener_profiles TO authenticated;
GRANT ALL ON public.listener_profiles TO service_role;
ALTER TABLE public.listener_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own listener profile read" ON public.listener_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own listener profile insert" ON public.listener_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own listener profile update" ON public.listener_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER listener_profiles_touch BEFORE UPDATE ON public.listener_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
