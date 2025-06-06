
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
    
    // Ensure track_type is properly typed
    if (track.track_type && ['single', 'ep', 'album'].includes(track.track_type)) {
      formattedTrack.track_type = track.track_type as 'single' | 'ep' | 'album';
    } else {
      formattedTrack.track_type = 'single';
    }
    
    return formattedTrack;
  });
}

// Fetch tracks based on filters
export async function fetchTracks(filter: TracksFilter) {
  if (filter.chartType) {
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
    // Using a raw query approach to access the views
    const viewName = filter.chartType === 'global' ? 'global_charts' : 'regional_charts';
    
    let rpcQuery: Record<string, any> = {
      view_name: viewName
    };
    
    // For regional charts, filter by region if provided
    if (filter.chartType === 'regional' && filter.region) {
      rpcQuery.region_code = filter.region;
    }
    
    // Get chart data using the updated function with renamed parameter
    const { data: chartData, error: chartError } = await supabase.rpc(
      'get_chart_data' as any, 
      rpcQuery
    );
    
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
  
  // Format the track data with proper URLs
  const formattedTrack: Track = {
    ...data,
  };
  
  // Handle cover art URL formatting
  if (data.cover_art_path) {
    formattedTrack.cover = data.cover_art_path.startsWith('http') 
      ? data.cover_art_path 
      : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${data.cover_art_path}`;
  }
  
  // Handle audio file URL formatting
  if (data.audio_file_path) {
    formattedTrack.audioUrl = data.audio_file_path.startsWith('http')
      ? data.audio_file_path
      : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${data.audio_file_path}`;
  }
  
  // Ensure track_type is properly typed
  if (data.track_type && ['single', 'ep', 'album'].includes(data.track_type)) {
    formattedTrack.track_type = data.track_type as 'single' | 'ep' | 'album';
  } else {
    formattedTrack.track_type = 'single';
  }
  
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
