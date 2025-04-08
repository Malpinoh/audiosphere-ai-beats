
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover_art_path: string;
  audio_file_path: string;
  genre: string;
  mood: string;
  play_count: number;
  like_count: number;
  tags: string[];
  published: boolean;
  description?: string;
  // Add additional fields needed across the application
  cover?: string; // For formatted cover art URL
  audioUrl?: string; // For formatted audio URL
}

export interface TracksFilter {
  published?: boolean;
  genre?: string;
  mood?: string;
  artist?: string;
  searchTerm?: string;
  tags?: string[];
  limit?: number;
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  region?: string; // Added for region-based filtering
  chartType?: 'global' | 'regional'; // Added for chart type
}

export function useTracks(filter: TracksFilter = { published: true, limit: 10 }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      try {
        setLoading(true);
        
        // Check if we need to fetch from charts
        if (filter.chartType) {
          await fetchFromCharts();
        } else {
          await fetchRegularTracks();
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching tracks'));
        toast.error('Failed to load tracks');
      } finally {
        setLoading(false);
      }
    }

    async function fetchRegularTracks() {
      let query = supabase
        .from('tracks')
        .select('*');
      
      // Apply filters
      if (filter.published !== undefined) {
        query = query.eq('published', filter.published);
      }
      
      if (filter.genre) {
        query = query.eq('genre', filter.genre);
      }
      
      if (filter.mood) {
        query = query.eq('mood', filter.mood);
      }
      
      if (filter.artist) {
        query = query.eq('artist', filter.artist);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        // Filter by any matching tag
        query = query.contains('tags', filter.tags);
      }
      
      if (filter.searchTerm) {
        query = query.or(`title.ilike.%${filter.searchTerm}%,artist.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`);
      }
      
      // Apply ordering
      const orderColumn = filter.orderBy?.column || 'uploaded_at';
      const orderDirection = filter.orderBy?.ascending ? 'asc' : 'desc';
      query = query.order(orderColumn, { ascending: filter.orderBy?.ascending ?? false });
      
      // Apply limit
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Format the tracks
      const formattedTracks = formatTracks(data);
      setTracks(formattedTracks);
    }

    async function fetchFromCharts() {
      try {
        const viewName = filter.chartType === 'global' ? 'global_charts' : 'regional_charts';
        let query = supabase.from(viewName).select('*');
        
        // For regional charts, filter by region if provided
        if (filter.chartType === 'regional' && filter.region) {
          query = query.eq('region_country', filter.region);
        }
        
        // Apply limit
        if (filter.limit) {
          query = query.limit(filter.limit);
        }

        const { data: chartData, error: chartError } = await query;
        
        if (chartError) {
          throw chartError;
        }

        if (!chartData || chartData.length === 0) {
          setTracks([]);
          return;
        }

        // Get the track IDs from the chart data
        const trackIds = chartData.map(item => item.track_id);
        
        // Fetch the actual track data
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('*')
          .in('id', trackIds);
        
        if (tracksError) {
          throw tracksError;
        }

        // Map the play count from chart data to the track data
        const tracksWithCounts = tracksData.map(track => {
          const chartItem = chartData.find(item => item.track_id === track.id);
          return {
            ...track,
            play_count: chartItem ? chartItem.play_count : track.play_count
          };
        });

        // Sort by play count descending (chart ranking)
        tracksWithCounts.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
        
        // Format the tracks
        const formattedTracks = formatTracks(tracksWithCounts);
        setTracks(formattedTracks);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        throw err;
      }
    }

    // Helper function to format tracks
    function formatTracks(data: any[]) {
      return data.map((track) => ({
        ...track,
        cover: track.cover_art_path.startsWith('http') 
          ? track.cover_art_path 
          : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`,
        audioUrl: track.audio_file_path.startsWith('http')
          ? track.audio_file_path
          : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${track.audio_file_path}`,
      }));
    }

    fetchTracks();
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

// Function to log a stream with region detection
export async function logStreamPlay(trackId: string) {
  try {
    // First, get the user's IP
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();
    
    // Use our edge function to get location data
    const geoResponse = await supabase.functions.invoke('geo-location', {
      body: { ip }
    });
    
    if (geoResponse.error) {
      console.error('Error getting geolocation:', geoResponse.error);
      // Fallback to direct logging with limited info
      const { error } = await supabase
        .from('stream_logs')
        .insert({
          track_id: trackId,
          region_country: 'Unknown',
          ip_address: ip,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
        
      if (error) {
        console.error('Error logging stream:', error);
        return false;
      }
      
      return true;
    }
    
    const geoData = geoResponse.data;
    
    // Log the stream with region information
    const { error } = await supabase
      .from('stream_logs')
      .insert({
        track_id: trackId,
        region_country: geoData.country || 'Unknown',
        region_city: geoData.city || null,
        ip_address: ip,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error('Error logging stream:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in stream logging:', err);
    return false;
  }
}

export function useTrack(id: string | undefined) {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchTrack() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setTrack(null);
          return;
        }
        
        // Format the track data
        const formattedTrack = {
          ...data,
          cover: data.cover_art_path.startsWith('http') 
            ? data.cover_art_path 
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${data.cover_art_path}`,
          audioUrl: data.audio_file_path.startsWith('http')
            ? data.audio_file_path
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${data.audio_file_path}`,
        };
        
        setTrack(formattedTrack);
      } catch (err) {
        console.error('Error fetching track:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching track'));
        toast.error('Failed to load track');
      } finally {
        setLoading(false);
      }
    }

    fetchTrack();
  }, [id]);

  return { track, loading, error };
}

// Get available regions for charts
export function useAvailableRegions() {
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRegions() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('regional_charts')
          .select('region_country')
          .distinct();
        
        if (error) {
          throw error;
        }
        
        const availableRegions = data.map(item => item.region_country).filter(Boolean);
        setRegions(availableRegions);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching regions'));
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
  }, []);

  return { regions, loading, error };
}
