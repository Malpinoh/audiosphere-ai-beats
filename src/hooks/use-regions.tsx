
import { useState, useEffect } from 'react';
import { fetchAvailableRegions } from '@/services/track-service';

export function useAvailableRegions() {
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadRegions() {
      try {
        setLoading(true);
        const data = await fetchAvailableRegions();
        setRegions(data);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching regions'));
      } finally {
        setLoading(false);
      }
    }

    loadRegions();
  }, []);

  return { regions, loading, error };
}
