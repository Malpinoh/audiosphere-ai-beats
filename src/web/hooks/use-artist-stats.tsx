import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/integrations/supabase/client";

export interface NameCount { name: string; streams: number; country?: string }
export interface ArtistStats {
  tracks: number; plays: number; likes: number; followers: number; followers_7d: number;
  streams_7d: number; streams_prev_7d: number; listeners: number;
  daily: { date: string; streams: number }[];
  follower_daily: { date: string; followers: number }[];
  countries: NameCount[]; cities: NameCount[]; devices: NameCount[];
  top_tracks: { id: string; title: string; streams: number }[];
  placements: { id: string; title: string; is_editorial: boolean }[];
}

/** Real aggregated stats for a managed artist profile (server-side, manager/admin only). */
export function useArtistStats(artistId?: string, days = 30) {
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!artistId) return;
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("get_artist_dashboard_stats", {
      _artist_profile_id: artistId, _days: days,
    });
    if (error) { setError(error.message); setStats(null); }
    else { setError(null); setStats(data as ArtistStats); }
    setLoading(false);
  }, [artistId, days]);

  useEffect(() => { load(); }, [load]);
  return { stats, loading, error, reload: load };
}
