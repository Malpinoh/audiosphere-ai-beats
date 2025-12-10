import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  cover: string;
  genre: string;
  mood: string;
  plays: number;
  score?: number;
  reason?: string;
}

// Get cover art URL helper
const getCoverUrl = (path: string): string => {
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('cover_art').getPublicUrl(path);
  return data?.publicUrl || '/placeholder.svg';
};

// Format track from database response
const formatTrack = (track: any): RecommendedTrack => ({
  id: track.track_id || track.id,
  title: track.title,
  artist: track.artist,
  artistId: track.artist_profile_id || '',
  cover: getCoverUrl(track.cover_art_path),
  genre: track.genre,
  mood: track.mood,
  plays: track.play_count || 0,
  score: track.recommendation_score || track.similarity_score,
  reason: track.recommendation_reason,
});

/**
 * Hook for personalized recommendations using hybrid algorithm
 */
export function usePersonalizedRecommendations(limit: number = 20) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        
        const { data, error: rpcError } = await supabase.rpc(
          'get_personalized_recommendations',
          { p_user_id: user?.id || null, p_limit: limit }
        );

        if (rpcError) throw rpcError;

        setTracks((data || []).map(formatTrack));
      } catch (err) {
        console.error('Error fetching personalized recommendations:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
        
        // Fallback to popular tracks
        const { data: fallbackData } = await supabase
          .from('tracks')
          .select('id, title, artist, artist_profile_id, cover_art_path, genre, mood, play_count')
          .eq('published', true)
          .order('play_count', { ascending: false, nullsFirst: false })
          .limit(limit);
        
        if (fallbackData) {
          setTracks(fallbackData.map(t => formatTrack({ ...t, track_id: t.id })));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [user?.id, limit]);

  return { tracks, loading, error };
}

/**
 * Hook for similar tracks (content-based filtering)
 */
export function useSimilarTracks(trackId: string | null, limit: number = 10) {
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSimilarTracks() {
      if (!trackId) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error: rpcError } = await supabase.rpc(
          'get_similar_tracks',
          { p_track_id: trackId, p_limit: limit }
        );

        if (rpcError) throw rpcError;

        setTracks((data || []).map(formatTrack));
      } catch (err) {
        console.error('Error fetching similar tracks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch similar tracks'));
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarTracks();
  }, [trackId, limit]);

  return { tracks, loading, error };
}

/**
 * Hook for mood-based recommendations
 */
export function useMoodRecommendations(mood: string | null, limit: number = 10) {
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMoodTracks() {
      if (!mood) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error: rpcError } = await supabase.rpc(
          'get_mood_recommendations',
          { p_mood: mood, p_limit: limit }
        );

        if (rpcError) throw rpcError;

        setTracks((data || []).map(formatTrack));
      } catch (err) {
        console.error('Error fetching mood recommendations:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch mood recommendations'));
      } finally {
        setLoading(false);
      }
    }

    fetchMoodTracks();
  }, [mood, limit]);

  return { tracks, loading, error };
}

/**
 * Hook for genre-based recommendations
 */
export function useGenreRecommendations(genre: string | null, limit: number = 10) {
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchGenreTracks() {
      if (!genre) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error: rpcError } = await supabase.rpc(
          'get_genre_recommendations',
          { p_genre: genre, p_limit: limit }
        );

        if (rpcError) throw rpcError;

        setTracks((data || []).map(formatTrack));
      } catch (err) {
        console.error('Error fetching genre recommendations:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch genre recommendations'));
      } finally {
        setLoading(false);
      }
    }

    fetchGenreTracks();
  }, [genre, limit]);

  return { tracks, loading, error };
}

/**
 * Hook to track user listening and update preferences
 */
export function useListeningTracker() {
  const { user } = useAuth();

  const trackListen = useCallback(async (trackId: string, listenTime: number = 30) => {
    if (!user?.id) return;

    try {
      await supabase.rpc('update_listening_history', {
        p_user_id: user.id,
        p_track_id: trackId,
        p_listen_time: listenTime
      });

      // Update user preferences in background (debounced)
      setTimeout(async () => {
        await supabase.rpc('update_user_preferences', { p_user_id: user.id });
      }, 5000);
    } catch (err) {
      console.error('Error tracking listen:', err);
    }
  }, [user?.id]);

  return { trackListen };
}

/**
 * Hook to get user's listening history
 */
export function useListeningHistory(limit: number = 20) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user?.id) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('user_listening_history')
          .select(`
            track_id,
            listen_count,
            last_listened_at,
            tracks (
              id,
              title,
              artist,
              artist_profile_id,
              cover_art_path,
              genre,
              mood,
              play_count
            )
          `)
          .eq('user_id', user.id)
          .order('last_listened_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formattedTracks = (data || [])
          .filter(item => item.tracks)
          .map(item => formatTrack({ ...item.tracks, track_id: item.tracks.id }));
        
        setTracks(formattedTracks);
      } catch (err) {
        console.error('Error fetching listening history:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user?.id, limit]);

  return { tracks, loading };
}
