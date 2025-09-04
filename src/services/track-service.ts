import { supabase } from "@/integrations/supabase/client";
import type { Track, TracksFilter } from "@/types/track-types";

// Helper function to format tracks with proper URLs
export function formatTracks(data: any[]): Track[] {
  return data.map((track) => {
    // First ensure we have the track object with all properties
    const formattedTrack = { ...track };
    
    // Handle cover art URL formatting
    if (track.cover_art_path) {
      formattedTrack.cover = track.cover_art_path.startsWith('http') 
        ? track.cover_art_path 
        : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`;
    }
    
    // Handle audio file URL formatting
    if (track.audio_file_path) {
      formattedTrack.audioUrl = track.audio_file_path.startsWith('http')
        ? track.audio_file_path
        : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${track.audio_file_path}`;
    }
    
    // Ensure track_type is properly typed - this fixes the TypeScript error
    if (track.track_type && ['single', 'ep', 'album'].includes(track.track_type)) {
      formattedTrack.track_type = track.track_type as 'single' | 'ep' | 'album';
    } else {
      formattedTrack.track_type = 'single' as const;
    }
    
    return formattedTrack;
  });
}

// Fetch tracks based on filters
export async function fetchTracks(filter: TracksFilter) {
  if (filter.chartType === 'trending') {
    return await fetchTrendingTracks(filter);
  } else if (filter.chartType) {
    return await fetchFromCharts(filter);
  } else {
    return await fetchRegularTracks(filter);
  }
}

async function fetchRegularTracks(filter: TracksFilter) {
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
  
  if (filter.trackType) {
    query = query.eq('track_type', filter.trackType);
  }
  
  if (filter.albumName) {
    query = query.eq('album_name', filter.albumName);
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
  return formatTracks(data || []);
}

async function fetchFromCharts(filter: TracksFilter) {
  try {
    let chartData: any[] = [];
    let chartError: any = null;

    if (filter.chartType === 'global') {
      // Use global charts
      const { data, error } = await supabase.rpc('get_chart_data', {
        view_name: 'global_charts'
      });
      chartData = data;
      chartError = error;
    } else {
      // Use African regional charts only
      const { data, error } = await supabase.rpc('get_african_regional_charts');
      chartData = data;
      chartError = error;
    }
    
    if (chartError) {
      console.error('RPC error:', chartError);
      
      // Fallback: Use a basic query for tracks with the highest play count
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tracks')
        .select('*')
        .order('play_count', { ascending: false })
        .limit(filter.limit || 100);
        
      if (fallbackError) {
        throw fallbackError;
      }
      
      return formatTracks(fallbackData || []);
    }

    if (!chartData || chartData.length === 0) {
      return [];
    }

    // Get the track IDs from the chart data
    const trackIds = Array.isArray(chartData) 
      ? chartData.map((item: any) => item.track_id) 
      : [];
    
    // Fetch the actual track data
    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select('*')
      .in('id', trackIds);
    
    if (tracksError) {
      throw tracksError;
    }

    // Map the play count from chart data to the track data
    const tracksWithCounts = (tracksData || []).map(track => {
      const chartItem = Array.isArray(chartData) 
        ? chartData.find((item: any) => item.track_id === track.id)
        : null;
      return {
        ...track,
        play_count: chartItem ? chartItem.play_count : track.play_count
      };
    });

    // Sort by play count descending (chart ranking)
    tracksWithCounts.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
    
    // Format the tracks
    return formatTracks(tracksWithCounts);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    throw err;
  }
}

// Fetch trending tracks
async function fetchTrendingTracks(filter: TracksFilter) {
  try {
    // Get trending scores from database function
    const { data: trendingData, error: trendingError } = await supabase.rpc('get_trending_tracks', {
      limit_count: filter.limit || 50
    });
    
    if (trendingError) {
      console.error('Error fetching trending data:', trendingError);
      throw trendingError;
    }
    
    if (!trendingData || trendingData.length === 0) {
      return [];
    }
    
    // Get track IDs from trending data
    const trackIds = trendingData.map((item: any) => item.track_id);
    
    // Build query with additional filters
    let query = supabase
      .from('tracks')
      .select('*')
      .in('id', trackIds)
      .eq('published', true);
    
    // Apply additional filters if specified
    if (filter.genre) {
      query = query.eq('genre', filter.genre);
    }
    
    if (filter.mood) {
      query = query.eq('mood', filter.mood);
    }
    
    if (filter.artist) {
      query = query.eq('artist', filter.artist);
    }
    
    if (filter.searchTerm) {
      query = query.or(`title.ilike.%${filter.searchTerm}%,artist.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`);
    }
    
    const { data: tracksData, error: tracksError } = await query;
    
    if (tracksError) {
      throw tracksError;
    }
    
    if (!tracksData) {
      return [];
    }
    
    // Merge trending scores with track data and sort by trending score
    const tracksWithScores = tracksData.map(track => {
      const scoreData = trendingData.find((score: any) => score.track_id === track.id);
      return {
        ...track,
        trending_score: scoreData?.trending_score || 0
      };
    });
    
    // Sort by trending score descending
    tracksWithScores.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));
    
    // Apply limit after sorting
    const limitedTracks = filter.limit ? tracksWithScores.slice(0, filter.limit) : tracksWithScores;
    
    // Format tracks with proper URLs
    return formatTracks(limitedTracks);
    
  } catch (err) {
    console.error('Error fetching trending tracks:', err);
    throw err;
  }
}

// Fetch a single track by ID
export async function fetchTrack(id: string) {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    throw error;
  }
  
  if (!data) {
    return null;
  }
  
  // Format the track data with proper URLs using the formatTracks helper
  const [formattedTrack] = formatTracks([data]);
  
  return formattedTrack;
}

// Log a stream play
export async function logStreamPlay(trackId: string) {
  try {
    // First, get the user's IP
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    
    if (!ipResponse.ok) {
      throw new Error('Failed to fetch IP address');
    }
    
    const { ip } = await ipResponse.json();
    
    // Use our edge function to get location data
    const geoResponse = await supabase.functions.invoke('geo-location', {
      body: { ip }
    });
    
    if (geoResponse.error) {
      console.error('Error getting geolocation:', geoResponse.error);
      // Fall back to direct logging with limited info
      // Use the REST API approach to bypass type checking
      const res = await fetch(
        `https://qkpjlfcpncvvjyzfolag.supabase.co/rest/v1/stream_logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGpsZmNwbmN2dmp5emZvbGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDAxMDAsImV4cCI6MjA1OTU3NjEwMH0.Lnas8tdQ_Wycaa-oWh8lCfRGkRr8IhW5CohA7n37nMg',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGpsZmNwbmN2dmp5emZvbGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDAxMDAsImV4cCI6MjA1OTU3NjEwMH0.Lnas8tdQ_Wycaa-oWh8lCfRGkRr8IhW5CohA7n37nMg`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            track_id: trackId,
            region_country: 'Unknown',
            ip_address: ip,
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
        }
      );
      
      if (!res.ok) {
        throw new Error('Failed to log stream');
      }
      
      return true;
    }
    
    const geoData = geoResponse.data;
    
    // Log the stream with region information using the REST API approach
    const res = await fetch(
      `https://qkpjlfcpncvvjyzfolag.supabase.co/rest/v1/stream_logs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGpsZmNwbmN2dmp5emZvbGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDAxMDAsImV4cCI6MjA1OTU3NjEwMH0.Lnas8tdQ_Wycaa-oWh8lCfRGkRr8IhW5CohA7n37nMg',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGpsZmNwbmN2dmp5emZvbGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDAxMDAsImV4cCI6MjA1OTU3NjEwMH0.Lnas8tdQ_Wycaa-oWh8lCfRGkRr8IhW5CohA7n37nMg`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          track_id: trackId,
          region_country: geoData.country || 'Unknown',
          region_city: geoData.city || null,
          ip_address: ip,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
      }
    );

    if (!res.ok) {
      throw new Error('Failed to log stream');
    }
    
    return true;
  } catch (err) {
    console.error('Error in stream logging:', err);
    return false;
  }
}

// Fetch available regions
export async function fetchAvailableRegions() {
  try {
    // Use a REST API approach to get distinct region countries
    const res = await fetch(
      `https://qkpjlfcpncvvjyzfolag.supabase.co/rest/v1/stream_logs?select=region_country&region_country=not.is.null`,
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGpsZmNwbmN2dmp5emZvbGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDAxMDAsImV4cCI6MjA1OTU3NjEwMH0.Lnas8tdQ_Wycaa-oWh8lCfRGkRr8IhW5CohA7n37nMg'
        }
      }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch regions');
    }
    
    const data = await res.json();
    
    // Extract unique region countries
    const uniqueRegions: string[] = Array.from(
      new Set(data.map((item: any) => item.region_country))
    ).filter(Boolean) as string[];
    
    return uniqueRegions;
  } catch (err) {
    console.error('Error fetching regions:', err);
    throw err;
  }
}
