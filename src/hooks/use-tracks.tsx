
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import type { Track, TracksFilter } from '@/types/track-types';
import { fetchTracks } from '@/services/track-service';

// Fix: Use 'export type' for re-exporting types with isolatedModules enabled
export type { Track, TracksFilter } from '@/types/track-types';
export { logStreamPlay } from '@/services/track-service';

export function useTracks(filter: TracksFilter = { published: true, limit: 10 }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTracks() {
      try {
        setLoading(true);
        const data = await fetchTracks(filter);
        setTracks(data);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching tracks'));
        toast.error('Failed to load tracks');
      } finally {
        setLoading(false);
      }
    }

    loadTracks();
  }, [
    filter.published, 
    filter.genre, 
    filter.mood, 
    filter.artist, 
    filter.searchTerm, 
    filter.limit,
    filter.orderBy?.column,
    filter.orderBy?.ascending,
    filter.tags,
    filter.chartType,
    filter.region
  ]);

  return { tracks, loading, error };
}
