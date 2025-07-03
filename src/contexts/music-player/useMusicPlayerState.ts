import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '@/types/track-types';
import { supabase } from '@/integrations/supabase/client';
import { useStreamLogger } from '@/hooks/use-stream-logger';
import { toast } from 'sonner';

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
  isRepeat: boolean;
  isShuffle: boolean;
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
  isRepeat: false,
  isShuffle: false,
  likedTracks: new Set(),
  savedTracks: new Set(),
};

// Enhanced audio URL resolution with better error handling and validation
const getValidAudioUrl = async (audioFilePath: string): Promise<string> => {
  if (!audioFilePath) {
    throw new Error('No audio file path provided');
  }

  console.log('Getting audio URL for path:', audioFilePath);

  // If it's already a full URL, validate and return it
  if (audioFilePath.startsWith('http')) {
    console.log('Using existing full URL:', audioFilePath);
    return audioFilePath;
  }

  // Build the public URL
  const baseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files';
  const audioUrl = `${baseUrl}/${audioFilePath}`;
  
  console.log('Generated audio URL:', audioUrl);
  
  // Test if the URL is accessible
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    if (!response.ok) {
      console.error('Audio URL not accessible:', response.status, response.statusText);
      throw new Error(`Audio file not accessible: ${response.status}`);
    }
    console.log('Audio URL validated successfully');
    return audioUrl;
  } catch (error) {
    console.error('Error validating audio URL:', error);
    // Still return the URL, as the HEAD request might fail due to CORS but audio might still work
    return audioUrl;
  }
};

export const useMusicPlayerState = (externalAudioRef?: React.RefObject<HTMLAudioElement>) => {
  const [state, setState] = useState<MusicPlayerState>(initialState);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalAudioRef;
  const { logStream } = useStreamLogger();
  const streamLoggedRef = useRef<Set<string>>(new Set());

  // Enhanced error handling function
  const handleAudioError = useCallback((error: any, context: string = '') => {
    console.error(`Audio error in ${context}:`, error);
    
    let errorMessage = 'Failed to load or play audio.';
    
    if (error?.target?.error) {
      const mediaError = error.target.error;
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio playback was aborted.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading audio.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Audio file format is not supported.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio file format or source is not supported.';
          break;
        default:
          errorMessage = 'Unknown audio error occurred.';
      }
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      isPlaying: false,
      error: errorMessage
    }));
    
    toast.error(errorMessage);
  }, []);

  // Update media session metadata
  const updateMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator) {
      try {
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
        
        console.log('Media session metadata updated');
      } catch (error) {
        console.error('Error updating media session:', error);
      }
    }
  }, []);

  const loadAudio = useCallback(async (track: Track) => {
    if (!track?.audio_file_path) {
      console.error('No audio file path provided for track:', track);
      handleAudioError(new Error('No audio file path'), 'loadAudio');
      return;
    }

    try {
      console.log('Loading audio for track:', track.title, 'Path:', track.audio_file_path);
      
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        currentTrack: track
      }));

      const audioUrl = await getValidAudioUrl(track.audio_file_path);
      console.log('Using audio URL:', audioUrl);

      if (!audioRef.current) {
        throw new Error('Audio element not available');
      }

      const audio = audioRef.current;
      
      // Reset audio element
      audio.pause();
      audio.currentTime = 0;
      
      // Set new source
      audio.src = audioUrl;
      
      // Wait for audio to load with comprehensive error handling
      await new Promise((resolve, reject) => {
        let resolved = false;
        
        const handleCanPlay = () => {
          if (resolved) return;
          resolved = true;
          console.log('Audio can play');
          cleanup();
          resolve(true);
        };
        
        const handleError = (e: Event) => {
          if (resolved) return;
          resolved = true;
          console.error('Audio load error:', e);
          console.error('Audio element error:', audio.error);
          cleanup();
          reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`));
        };

        const handleLoadStart = () => {
          console.log('Audio load started');
        };

        const handleProgress = () => {
          console.log('Audio loading progress...');
        };

        const cleanup = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('progress', handleProgress);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('progress', handleProgress);
        
        // Set a timeout to reject if loading takes too long
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Audio loading timeout - file may be too large or network is slow'));
          }
        }, 15000); // Increased timeout to 15 seconds
        
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
    } catch (error) {
      console.error('Error loading audio:', error);
      handleAudioError(error, 'loadAudio');
    }
  }, [updateMediaSession, handleAudioError]);

  const playTrack = useCallback(async (track: Track) => {
    console.log('Attempting to play track:', track.title);
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      queue: prev.queue.some(t => t.id === track.id) ? prev.queue : [track, ...prev.queue]
    }));
    
    try {
      await loadAudio(track);
      
      if (audioRef.current) {
        console.log('Starting playback...');
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        
        // Log stream play after successful playback start
        if (!streamLoggedRef.current.has(track.id)) {
          streamLoggedRef.current.add(track.id);
          logStream(track.id);
        }
        
        console.log('Playback started successfully');
      }
    } catch (error) {
      console.error("Playback failed:", error);
      handleAudioError(error, 'playTrack');
    }
  }, [loadAudio, handleAudioError, logStream]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
        console.log('Resumed playback');
      } catch (error) {
        console.error("Play failed:", error);
        handleAudioError(error, 'play');
      }
    }
  }, [handleAudioError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      console.log('Playback paused');
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
      const normalizedVolume = volume / 100;
      audioRef.current.volume = normalizedVolume;
      setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
      console.log('Volume set to:', volume);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !state.isMuted;
      audioRef.current.volume = newMuted ? 0 : state.volume / 100;
      setState(prev => ({ ...prev, isMuted: newMuted }));
      console.log('Mute toggled:', newMuted);
    }
  }, [state.isMuted, state.volume]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
      console.log('Seeked to:', time);
    }
  }, []);

  const setQueue = useCallback((tracks: Track[]) => {
    setState(prev => ({ ...prev, queue: tracks }));
    console.log('Queue updated with', tracks.length, 'tracks');
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setState(prev => ({ 
      ...prev, 
      queue: [...prev.queue, track] 
    }));
    console.log('Added track to queue:', track.title);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setState(prev => ({ 
      ...prev, 
      queue: prev.queue.filter(track => track.id !== trackId) 
    }));
    console.log('Removed track from queue:', trackId);
  }, []);

  const playNext = useCallback(() => {
    let nextTrack: Track | null = null;
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    
    if (state.isShuffle) {
      // Random track from queue
      const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        nextTrack = availableTracks[randomIndex];
      }
    } else if (currentIndex < state.queue.length - 1) {
      nextTrack = state.queue[currentIndex + 1];
    } else if (state.isRepeat && state.queue.length > 0) {
      // If repeat is on and we're at the end, go to first track
      nextTrack = state.queue[0];
    }
    
    if (nextTrack) {
      console.log('Playing next track:', nextTrack.title);
      playTrack(nextTrack);
    } else {
      console.log('No next track available');
      if (state.isRepeat && state.currentTrack) {
        // Repeat current track
        playTrack(state.currentTrack);
      }
    }
  }, [state.queue, state.currentTrack, state.isShuffle, state.isRepeat, playTrack]);

  const playPrevious = useCallback(() => {
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    
    if (state.isShuffle) {
      // Random track from queue
      const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        const previousTrack = availableTracks[randomIndex];
        console.log('Playing random previous track:', previousTrack.title);
        playTrack(previousTrack);
      }
    } else if (currentIndex > 0) {
      const previousTrack = state.queue[currentIndex - 1];
      console.log('Playing previous track:', previousTrack.title);
      playTrack(previousTrack);
    } else if (state.isRepeat && state.queue.length > 0) {
      // If repeat is on and we're at the beginning, go to last track
      const lastTrack = state.queue[state.queue.length - 1];
      console.log('Playing last track (repeat mode):', lastTrack.title);
      playTrack(lastTrack);
    } else {
      console.log('No previous track available');
    }
  }, [state.queue, state.currentTrack, state.isShuffle, state.isRepeat, playTrack]);

  const likeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          track_id: trackId
        });

      if (error) {
        console.error('Error liking track:', error);
        return false;
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      if (error) {
        console.error('Error unliking track:', error);
        return false;
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('saved_tracks')
        .insert({
          user_id: user.id,
          track_id: trackId
        });

      if (error) {
        console.error('Error saving track:', error);
        return false;
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('saved_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      if (error) {
        console.error('Error unsaving track:', error);
        return false;
      }

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

  const clearQueue = useCallback(() => {
    setState(prev => ({ ...prev, queue: [] }));
    console.log('Queue cleared');
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(prev => ({ ...prev, isRepeat: !prev.isRepeat }));
    console.log('Repeat toggled:', !state.isRepeat);
  }, [state.isRepeat]);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
    console.log('Shuffle toggled:', !state.isShuffle);
  }, [state.isShuffle]);

  const shareTrack = useCallback((trackId: string) => {
    console.log('Sharing track:', trackId);
  }, []);

  // Load user's existing likes and saved tracks on initialization
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load liked tracks
        const { data: likes } = await supabase
          .from('likes')
          .select('track_id')
          .eq('user_id', user.id);

        // Load saved tracks
        const { data: savedTracks } = await supabase
          .from('saved_tracks')
          .select('track_id')
          .eq('user_id', user.id);

        setState(prev => ({
          ...prev,
          likedTracks: new Set(likes?.map(like => like.track_id) || []),
          savedTracks: new Set(savedTracks?.map(saved => saved.track_id) || [])
        }));
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateCurrentTime = () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime || 0 }));
      };

      const updateDuration = () => {
        setState(prev => ({ ...prev, duration: audio.duration || 0 }));
        console.log('Audio duration:', audio.duration);
      };

      const handleEnded = () => {
        console.log('Track ended, playing next...');
        setState(prev => ({ ...prev, isPlaying: false }));
        
        // Clear stream log for ended track
        if (state.currentTrack) {
          streamLoggedRef.current.delete(state.currentTrack.id);
        }
        
        playNext();
      };

      const handleAudioElementError = (e: Event) => {
        console.error('Audio element error:', e);
        handleAudioError(e, 'audio element');
      };

      audio.addEventListener('timeupdate', updateCurrentTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleAudioElementError);

      return () => {
        audio.removeEventListener('timeupdate', updateCurrentTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleAudioElementError);
      };
    }
  }, [playNext, handleAudioError, state.currentTrack]);

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
    isRepeat: state.isRepeat,
    isShuffle: state.isShuffle,
    playTrack,
    togglePlay,
    setQueue,
    clearQueue,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
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
