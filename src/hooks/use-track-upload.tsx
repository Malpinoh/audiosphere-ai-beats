
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UploadTrackData {
  title: string;
  artist: string;
  genre: string;
  mood: string;
  description?: string;
  tags: string[];
  audioFile: File;
  coverArtFile: File;
  trackType?: 'single' | 'ep' | 'album';
  albumName?: string;
}

export function useTrackUpload() {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadTrack = async (data: UploadTrackData) => {
    if (!user) {
      toast.error('You must be logged in to upload tracks');
      return false;
    }

    try {
      setUploading(true);
      console.log('Starting track upload process...');

      // Upload audio file
      const audioFileName = `${Date.now()}-${data.audioFile.name}`;
      const { error: audioError } = await supabase.storage
        .from('audio_files')
        .upload(audioFileName, data.audioFile);

      if (audioError) {
        console.error('Audio upload error:', audioError);
        throw new Error(`Failed to upload audio: ${audioError.message}`);
      }

      // Upload cover art
      const coverFileName = `${Date.now()}-${data.coverArtFile.name}`;
      const { error: coverError } = await supabase.storage
        .from('cover_art')
        .upload(coverFileName, data.coverArtFile);

      if (coverError) {
        console.error('Cover art upload error:', coverError);
        throw new Error(`Failed to upload cover art: ${coverError.message}`);
      }

      // Get or create artist profile
      const { data: artistProfile, error: artistError } = await supabase
        .rpc('create_artist_profile_if_not_exists', { artist_name: data.artist });

      if (artistError) {
        console.error('Artist profile error:', artistError);
        throw new Error(`Failed to create artist profile: ${artistError.message}`);
      }

      // Insert track with proper artist linking
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          title: data.title,
          artist: data.artist,
          genre: data.genre,
          mood: data.mood,
          description: data.description,
          tags: data.tags,
          audio_file_path: audioFileName,
          cover_art_path: coverFileName,
          user_id: user.id,
          artist_profile_id: artistProfile,
          track_type: data.trackType || 'single',
          album_name: data.albumName,
          published: true
        });

      if (trackError) {
        console.error('Track insert error:', trackError);
        throw new Error(`Failed to save track: ${trackError.message}`);
      }

      toast.success('Track uploaded successfully!');
      return true;
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload track');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { uploadTrack, uploading };
}
