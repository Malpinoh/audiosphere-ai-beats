
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import type { Track } from '@/types/track-types';
import { fetchTrack } from '@/services/track-service';

export function useTrack(id: string | undefined) {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function loadTrack() {
      try {
        setLoading(true);
        const data = await fetchTrack(id);
        setTrack(data);
      } catch (err) {
        console.error('Error fetching track:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching track'));
        toast.error('Failed to load track');
      } finally {
        setLoading(false);
      }
    }

    loadTrack();
  }, [id]);

  return { track, loading, error };
}
