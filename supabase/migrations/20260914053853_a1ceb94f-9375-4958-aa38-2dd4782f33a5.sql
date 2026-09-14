CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(track_id uuid, title text, artist text, artist_profile_id uuid, cover_art_path text, genre text, mood text, play_count integer, recommendation_score numeric, recommendation_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN QUERY
    SELECT t.id, t.title, t.artist, t.artist_profile_id, t.cover_art_path, t.genre, t.mood,
           t.play_count, t.play_count::numeric, 'Popular'::text
    FROM tracks t
    WHERE t.published = true
    ORDER BY t.play_count DESC NULLS LAST
    LIMIT p_limit;
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_prefs AS (
    SELECT up.genre_scores, up.mood_scores, up.artist_scores
    FROM user_preferences up
    WHERE up.user_id = p_user_id
  ),
  prefs AS (
    SELECT COALESCE((SELECT genre_scores FROM user_prefs), '{}'::jsonb) AS genre_scores,
           COALESCE((SELECT mood_scores FROM user_prefs), '{}'::jsonb) AS mood_scores,
           COALESCE((SELECT artist_scores FROM user_prefs), '{}'::jsonb) AS artist_scores
  ),
  listened AS (
    SELECT h.track_id AS tid FROM user_listening_history h WHERE h.user_id = p_user_id
  ),
  followed AS (
    SELECT f.artist_id AS aid FROM followers f WHERE f.follower_id = p_user_id
  ),
  scored AS (
    SELECT
      t.id AS tid, t.title AS ttitle, t.artist AS tartist, t.artist_profile_id AS tapid,
      t.cover_art_path AS tcover, t.genre AS tgenre, t.mood AS tmood, t.play_count AS tplays,
      COALESCE((p.genre_scores->>t.genre)::numeric, 0) * 0.3 +
      COALESCE((p.mood_scores->>t.mood)::numeric, 0) * 0.2 +
      COALESCE((p.artist_scores->>t.artist_profile_id::text)::numeric, 0) * 0.25 +
      CASE WHEN t.artist_profile_id IN (SELECT aid FROM followed) THEN 20 ELSE 0 END +
      LEAST(COALESCE(t.play_count, 0)::numeric / 1000, 10) * 0.15 +
      CASE
        WHEN t.uploaded_at > now() - interval '7 days' THEN 15
        WHEN t.uploaded_at > now() - interval '30 days' THEN 10
        WHEN t.uploaded_at > now() - interval '90 days' THEN 5
        ELSE 0
      END * 0.1 AS total_score,
      CASE
        WHEN t.artist_profile_id IN (SELECT aid FROM followed) THEN 'From artists you follow'
        WHEN COALESCE((p.genre_scores->>t.genre)::numeric, 0) > 10 THEN 'Based on your genre preferences'
        WHEN COALESCE((p.mood_scores->>t.mood)::numeric, 0) > 10 THEN 'Matches your mood'
        WHEN t.uploaded_at > now() - interval '7 days' THEN 'New release'
        ELSE 'Recommended for you'
      END AS reason
    FROM tracks t
    CROSS JOIN prefs p
    WHERE t.published = true
      AND t.id NOT IN (SELECT tid FROM listened)
  )
  SELECT s.tid, s.ttitle, s.tartist, s.tapid, s.tcover, s.tgenre, s.tmood, s.tplays,
         s.total_score, s.reason
  FROM scored s
  ORDER BY s.total_score DESC, RANDOM()
  LIMIT p_limit;
END;
$function$;