
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

      // Get browser/device info
      const userAgent = navigator.userAgent;
      const getBrowserInfo = () => {
        const ua = userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        let deviceType = 'desktop';

        // Device type detection
        if (/Mobile|Android|iPhone|iPad/.test(ua)) {
          deviceType = 'mobile';
        } else if (/Tablet|iPad/.test(ua)) {
          deviceType = 'tablet';
        }

        // Browser detection
        if (ua.includes('Chrome')) {
          browserName = 'Chrome';
          browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Firefox')) {
          browserName = 'Firefox';
          browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
          browserName = 'Safari';
          browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Edge')) {
          browserName = 'Edge';
          browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
        }

        return { browserName, browserVersion, deviceType };
      };

      const { browserName, browserVersion, deviceType } = getBrowserInfo();

      // Log the stream
      const { error: logError } = await supabase
        .from('stream_logs')
        .insert({
          track_id: trackId,
          user_id: user?.id,
          region_country: geoData.country || 'Unknown',
          region_city: geoData.city,
          ip_address: ip,
          user_agent: userAgent,
          browser_name: browserName,
          browser_version: browserVersion,
          device_type: deviceType
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
