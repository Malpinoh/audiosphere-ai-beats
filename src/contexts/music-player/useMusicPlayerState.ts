import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '@/types/track-types';
import { supabase } from '@/integrations/supabase/client';

interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  queue: Track[];
  isMuted: boolean;
  likedTracks: Set<string>;
  savedTracks: Set<string>;
}

const initialState: MusicPlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.5,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  error: null,
  queue: [],
  isMuted: false,
  likedTracks: new Set(),
  savedTracks: new Set(),
};

// Simplified audio URL resolution with better fallback handling
const getValidAudioUrl = (audioFilePath: string): string => {
  if (!audioFilePath) {
    throw new Error('No audio file path provided');
  }

  console.log('Getting audio URL for path:', audioFilePath);

  // If it's already a full URL, return it
  if (audioFilePath.startsWith('http')) {
    return audioFilePath;
  }

  // Build the public URL directly
  const baseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files';
  const audioUrl = `${baseUrl}/${audioFilePath}`;
  
  console.log('Generated audio URL:', audioUrl);
  return audioUrl;
};

export const useMusicPlayerState = () => {
  const [state, setState] = useState<MusicPlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Error handling function
  const handleAudioError = useCallback((error: any) => {
    console.error('Audio error:', error);
    setState(prev => ({
      ...prev,
      isLoading: false,
      isPlaying: false,
      error: 'Failed to load or play audio.'
    }));
  }, []);

  // Update media session metadata
  const updateMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator) {
      const coverUrl = track.cover_art_path?.startsWith('http') 
        ? track.cover_art_path 
        : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album_name || track.genre || 'Unknown Album',
        artwork: [
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    }
  }, []);

  const loadAudio = useCallback(async (track: Track) => {
    if (!track?.audio_file_path) {
      console.error('No audio file path provided for track:', track);
      handleAudioError(new Error('No audio file path'));
      return;
    }

    try {
      console.log('Loading audio for track:', track.title, 'Path:', track.audio_file_path);
      
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      const audioUrl = getValidAudioUrl(track.audio_file_path);
      console.log('Using audio URL:', audioUrl);

      if (audioRef.current) {
        // Reset audio element
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Set new source
        audioRef.current.src = audioUrl;
        
        // Wait for audio to load with better error handling
        await new Promise((resolve, reject) => {
          if (!audioRef.current) return reject(new Error('Audio element not available'));
          
          const audio = audioRef.current;
          
          const handleCanPlay = () => {
            console.log('Audio can play');
            cleanup();
            resolve(true);
          };
          
          const handleError = (e: Event) => {
            console.error('Audio load error:', e);
            console.error('Audio element error:', audio.error);
            cleanup();
            reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`));
          };

          const handleLoadStart = () => {
            console.log('Audio load started');
          };

          const cleanup = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadstart', handleLoadStart);
          };
          
          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
          audio.addEventListener('loadstart', handleLoadStart);
          
          // Set a timeout to reject if loading takes too long
          setTimeout(() => {
            cleanup();
            reject(new Error('Audio loading timeout'));
          }, 10000);
          
          // Trigger load
          audio.load();
        });

        setState(prev => ({
          ...prev,
          currentTrack: track,
          isLoading: false,
          error: null
        }));

        // Update media session
        updateMediaSession(track);
        
        console.log('Audio loaded successfully');
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      handleAudioError(error);
    }
  }, [updateMediaSession, handleAudioError]);

  const playTrack = useCallback(async (track: Track) => {
    setState(prev => ({ ...prev, isLoading: true }));
    await loadAudio(track);
    if (audioRef.current && !state.error) {
      try {
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      } catch (error) {
        console.error("Playback failed:", error);
        handleAudioError(error);
      }
    }
  }, [loadAudio, handleAudioError, state.error]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setState(prev => ({ ...prev, isPlaying: true })))
        .catch(error => {
          console.error("Playback failed:", error);
          handleAudioError(error);
        });
    }
  }, [handleAudioError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !state.isMuted;
      audioRef.current.volume = newMuted ? 0 : state.volume / 100;
      setState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [state.isMuted, state.volume]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setQueue = useCallback((tracks: Track[]) => {
    setState(prev => ({ ...prev, queue: tracks }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setState(prev => ({ 
      ...prev, 
      queue: [...prev.queue, track] 
    }));
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setState(prev => ({ 
      ...prev, 
      queue: prev.queue.filter(track => track.id !== trackId) 
    }));
  }, []);

  const playNext = useCallback(() => {
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    if (currentIndex < state.queue.length - 1) {
      playTrack(state.queue[currentIndex + 1]);
    }
  }, [state.queue, state.currentTrack, playTrack]);

  const playPrevious = useCallback(() => {
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(state.queue[currentIndex - 1]);
    }
  }, [state.queue, state.currentTrack, playTrack]);

  const likeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      setState(prev => ({ 
        ...prev, 
        likedTracks: new Set([...prev.likedTracks, trackId]) 
      }));
      return true;
    } catch (error) {
      console.error('Error liking track:', error);
      return false;
    }
  }, []);

  const unlikeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      setState(prev => {
        const newLikedTracks = new Set(prev.likedTracks);
        newLikedTracks.delete(trackId);
        return { ...prev, likedTracks: newLikedTracks };
      });
      return true;
    } catch (error) {
      console.error('Error unliking track:', error);
      return false;
    }
  }, []);

  const saveTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      setState(prev => ({ 
        ...prev, 
        savedTracks: new Set([...prev.savedTracks, trackId]) 
      }));
      return true;
    } catch (error) {
      console.error('Error saving track:', error);
      return false;
    }
  }, []);

  const unsaveTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      setState(prev => {
        const newSavedTracks = new Set(prev.savedTracks);
        newSavedTracks.delete(trackId);
        return { ...prev, savedTracks: newSavedTracks };
      });
      return true;
    } catch (error) {
      console.error('Error unsaving track:', error);
      return false;
    }
  }, []);

  const isTrackLiked = useCallback((trackId: string): boolean => {
    return state.likedTracks.has(trackId);
  }, [state.likedTracks]);

  const isTrackSaved = useCallback((trackId: string): boolean => {
    return state.savedTracks.has(trackId);
  }, [state.savedTracks]);

  const shareTrack = useCallback((trackId: string) => {
    console.log('Sharing track:', trackId);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateCurrentTime = () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime || 0 }));
      };

      const updateDuration = () => {
        setState(prev => ({ ...prev, duration: audio.duration || 0 }));
      };

      const handleEnded = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        playNext();
      };

      audio.addEventListener('timeupdate', updateCurrentTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateCurrentTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [playNext]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        seekTo(Math.max(0, state.currentTime - 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        seekTo(Math.min(state.duration, state.currentTime + 10));
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });
    }
  }, [play, pause, seekTo, state.currentTime, state.duration, playNext, playPrevious]);

  // Return individual properties to match MusicPlayerContextType
  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    queue: state.queue,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    isMuted: state.isMuted,
    isLoading: state.isLoading,
    playTrack,
    togglePlay,
    setQueue,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    addToQueue,
    removeFromQueue,
    likedTracks: state.likedTracks,
    savedTracks: state.savedTracks,
    likeTrack,
    unlikeTrack,
    saveTrack,
    unsaveTrack,
    isTrackLiked,
    isTrackSaved,
    shareTrack,
    audioRef,
  };
};
