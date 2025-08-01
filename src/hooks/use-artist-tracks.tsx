
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
        
        // First try to get profile ID if artistId is not a UUID
        let profileId = artistId;
        
        // Check if artistId is a UUID pattern
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(artistId)) {
          // Try to find the profile by name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .or(`username.ilike.${artistId},full_name.ilike.${artistId}`)
            .limit(1)
            .maybeSingle();
            
          if (profileData) {
            profileId = profileData.id;
          }
        }

        // Fetch tracks where either the user_id matches, artist_profile_id matches, or artist name matches
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .or(`user_id.eq.${profileId},artist_profile_id.eq.${profileId},artist.ilike.${artistId}`)
          .order('play_count', { ascending: false });
          
        if (error) throw error;
        
        // Format track URLs properly
        const formattedTracks = (data || []).map(track => ({
          ...track,
          cover: track.cover_art_path?.startsWith('http') 
            ? track.cover_art_path 
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`,
          audioUrl: track.audio_file_path?.startsWith('http')
            ? track.audio_file_path
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${track.audio_file_path}`
        }));
        
        setTracks(formattedTracks as Track[]);
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
          filter: `or(user_id.eq.${artistId},artist_profile_id.eq.${artistId})`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTracks(prev => prev.map(track => 
              track.id === payload.new.id ? { 
                ...payload.new as Track,
                cover: (payload.new as any).cover_art_path?.startsWith('http') 
                  ? (payload.new as any).cover_art_path 
                  : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${(payload.new as any).cover_art_path}`,
                audioUrl: (payload.new as any).audio_file_path?.startsWith('http')
                  ? (payload.new as any).audio_file_path
                  : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${(payload.new as any).audio_file_path}`
              } : track
            ));
          } else if (payload.eventType === 'INSERT') {
            const newTrack = {
              ...payload.new as Track,
              cover: (payload.new as any).cover_art_path?.startsWith('http') 
                ? (payload.new as any).cover_art_path 
                : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${(payload.new as any).cover_art_path}`,
              audioUrl: (payload.new as any).audio_file_path?.startsWith('http')
                ? (payload.new as any).audio_file_path
                : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${(payload.new as any).audio_file_path}`
            };
            setTracks(prev => [newTrack, ...prev]);
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
