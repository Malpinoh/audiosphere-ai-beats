import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLocation {
  ip: string;
  country: string;
  city: string;
  region: string;
  loc?: string;
  timezone?: string;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's IP address first
      let userIP = '';
      
      try {
        // Try to get IP from a public service
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          userIP = ipData.ip;
        }
      } catch (ipError) {
        console.warn('Could not get IP from external service, using fallback');
        userIP = '127.0.0.1'; // Fallback for development
      }

      console.log('Detected IP:', userIP);

      // Call our geo-location edge function
      const { data, error: geoError } = await supabase.functions.invoke('geo-location', {
        body: { ip: userIP }
      });

      if (geoError) {
        throw geoError;
      }

      if (data) {
        setLocation(data);
        // Store location in sessionStorage for this session
        sessionStorage.setItem('user_location', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error detecting user location:', err);
      setError('Failed to detect location');
      
      // Try to get cached location from sessionStorage
      const cachedLocation = sessionStorage.getItem('user_location');
      if (cachedLocation) {
        try {
          setLocation(JSON.parse(cachedLocation));
        } catch (parseError) {
          console.error('Error parsing cached location:', parseError);
        }
      } else {
        // Fallback to Nigeria
        setLocation({
          ip: 'unknown',
          country: 'NG',
          city: 'Lagos',
          region: 'Lagos'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = () => {
    sessionStorage.removeItem('user_location');
    detectUserLocation();
  };

  return {
    location,
    loading,
    error,
    refreshLocation
  };
}