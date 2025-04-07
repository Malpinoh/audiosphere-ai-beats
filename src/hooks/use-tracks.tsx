
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

export function useTracks({ limit = 10, filter = "published = true" }: { limit?: number; filter?: string } = {}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('tracks')
          .select('*')
          .eq('published', true)
          .order('uploaded_at', { ascending: false })
          .limit(limit);
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Format the data for our app
        const formattedTracks = data.map((track) => ({
          ...track,
          cover: track.cover_art_path.startsWith('http') 
            ? track.cover_art_path 
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`,
          audioUrl: track.audio_file_path.startsWith('http')
            ? track.audio_file_path
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${track.audio_file_path}`,
        }));
        
        setTracks(formattedTracks);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching tracks'));
        toast.error('Failed to load tracks');
      } finally {
        setLoading(false);
      }
    }

    fetchTracks();
  }, [limit, filter]);

  return { tracks, loading, error };
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
