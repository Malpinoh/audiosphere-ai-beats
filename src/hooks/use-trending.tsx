import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Track } from '@/types/track-types';
import { formatTracks } from '@/services/track-service';

interface TrendingScore {
  track_id: string;
  trending_score: number;
  velocity_score: number;
  engagement_score: number;
  recency_score: number;
  regional_boost: number;
}

export function useTrending(limit = 50) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTrendingTracks() {
      try {
        setLoading(true);
        setError(null);
        
        // Get trending scores from database function
        const { data: trendingData, error: trendingError } = await supabase.rpc('get_trending_tracks', {
          limit_count: limit
        });
        
        if (trendingError) {
          console.error('Error fetching trending data:', trendingError);
          throw trendingError;
        }
        
        if (!trendingData || trendingData.length === 0) {
          setTracks([]);
          return;
        }
        
        // Get track IDs from trending data
        const trackIds = trendingData.map((item: TrendingScore) => item.track_id);
        
        // Fetch actual track data
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('*')
          .in('id', trackIds)
          .eq('published', true);
        
        if (tracksError) {
          throw tracksError;
        }
        
        if (!tracksData) {
          setTracks([]);
          return;
        }
        
        // Merge trending scores with track data and sort by trending score
        const tracksWithScores = tracksData.map(track => {
          const scoreData = trendingData.find((score: TrendingScore) => score.track_id === track.id);
          return {
            ...track,
            trending_score: scoreData?.trending_score || 0,
            velocity_score: scoreData?.velocity_score || 0,
            engagement_score: scoreData?.engagement_score || 0,
            recency_score: scoreData?.recency_score || 0,
            regional_boost: scoreData?.regional_boost || 0
          };
        });
        
        // Sort by trending score descending
        tracksWithScores.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));
        
        // Format tracks with proper URLs
        const formattedTracks = formatTracks(tracksWithScores);
        setTracks(formattedTracks);
        
      } catch (err) {
        console.error('Error loading trending tracks:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading trending tracks'));
        toast.error('Failed to load trending tracks');
      } finally {
        setLoading(false);
      }
    }

    loadTrendingTracks();
  }, [limit]);

  return { tracks, loading, error };
}

// Hook to manually trigger trending score calculation (for admin use)
export function useCalculateTrending() {
  const [calculating, setCalculating] = useState(false);
  
  const calculateTrending = async () => {
    try {
      setCalculating(true);
      
      const { error } = await supabase.rpc('calculate_trending_scores');
      
      if (error) {
        throw error;
      }
      
      toast.success('Trending scores calculated successfully');
      return true;
    } catch (err) {
      console.error('Error calculating trending scores:', err);
      toast.error('Failed to calculate trending scores');
      return false;
    } finally {
      setCalculating(false);
    }
  };
  
  return { calculateTrending, calculating };
}