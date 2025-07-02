
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useStreamLogger() {
  const { user } = useAuth();

  const logStream = useCallback(async (trackId: string) => {
    try {
      console.log('Logging stream for track:', trackId);

      // Get user's IP and location
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Get location data
      const geoResponse = await supabase.functions.invoke('geo-location', {
        body: { ip }
      });

      const geoData = geoResponse.data || {};

      // Log the stream
      const { error: logError } = await supabase
        .from('stream_logs')
        .insert({
          track_id: trackId,
          user_id: user?.id,
          region_country: geoData.country || 'Unknown',
          region_city: geoData.city,
          ip_address: ip
        });

      if (logError) {
        console.error('Stream log error:', logError);
      }

      // Update track play count
      const { error: updateError } = await supabase.rpc('increment_play_count', {
        track_uuid: trackId
      });

      if (updateError) {
        console.error('Play count update error:', updateError);
      }

      console.log('Stream logged successfully');
    } catch (error) {
      console.error('Error logging stream:', error);
    }
  }, [user]);

  return { logStream };
}
