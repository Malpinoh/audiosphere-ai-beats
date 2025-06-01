
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Track } from "@/types/track-types";

export function useArtistTracks(artistId: string) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistTracks = async () => {
      if (!artistId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .eq('user_id', artistId)
          .eq('published', true)
          .order('play_count', { ascending: false });
          
        if (error) throw error;
        
        setTracks(data as Track[]);
      } catch (error) {
        console.error('Error fetching artist tracks:', error);
        toast.error('Failed to load artist tracks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistTracks();
    
    // Set up real-time listener for track updates
    const channel = supabase
      .channel('artist-tracks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${artistId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTracks(prev => prev.map(track => 
              track.id === payload.new.id ? payload.new as Track : track
            ));
          } else if (payload.eventType === 'INSERT') {
            setTracks(prev => [payload.new as Track, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTracks(prev => prev.filter(track => track.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId]);

  return { tracks, loading };
}
