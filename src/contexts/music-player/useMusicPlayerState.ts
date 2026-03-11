import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '@/types/track-types';
import { RepeatMode } from '@/contexts/music-player/types';
import { supabase } from '@/integrations/supabase/client';
import { useStreamLogger } from '@/hooks/use-stream-logger';
import { toast } from 'sonner';

// Track listening for recommendation engine
const trackListeningHistory = async (userId: string, trackId: string, listenTime: number) => {
  try {
    await supabase.rpc('update_listening_history', {
      p_user_id: userId,
      p_track_id: trackId,
      p_listen_time: listenTime
    });
    
    if (listenTime >= 30) {
      setTimeout(async () => {
        await supabase.rpc('update_user_preferences', { p_user_id: userId });
      }, 2000);
    }
  } catch (err) {
    console.error('Error tracking listening history:', err);
  }
};

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
  repeatMode: RepeatMode;
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
  repeatMode: 'off' as RepeatMode,
  isShuffle: false,
  likedTracks: new Set(),
  savedTracks: new Set(),
};

const getValidAudioUrl = async (audioFilePath: string): Promise<string> => {
  if (!audioFilePath) {
    throw new Error('No audio file path provided');
  }

  if (audioFilePath.startsWith('http')) {
    return audioFilePath;
  }

  const cleanPath = audioFilePath.trim().replace(/^\/+/, '');
  const baseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files';
  const audioUrl = `${baseUrl}/${encodeURIComponent(cleanPath)}`;
  
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    if (!response.ok) {
      console.warn('Audio file may not be accessible:', response.status);
    }
  } catch (fetchError) {
    console.warn('Could not verify audio file accessibility:', fetchError);
  }
  
  return audioUrl;
};

export const useMusicPlayerState = (externalAudioRef?: React.RefObject<HTMLAudioElement>) => {
  const [state, setState] = useState<MusicPlayerState>(initialState);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalAudioRef;
  const { logStream } = useStreamLogger();
  const streamLoggedRef = useRef<Set<string>>(new Set());

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
      isPlaying: false
    }));
    
    if (context !== 'audio element' && !errorMessage.includes('aborted')) {
      toast.error(errorMessage);
    }
  }, []);

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
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        currentTrack: track
      }));

      const audioUrl = await getValidAudioUrl(track.audio_file_path);

      if (!audioRef.current) {
        throw new Error('Audio element not available');
      }

      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.src = audioUrl;
      
      await new Promise((resolve, reject) => {
        let resolved = false;
        
        const handleCanPlay = () => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve(true);
        };
        
        const handleError = (e: Event) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`));
        };

        const cleanup = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Audio loading timeout - file may be too large or network is slow'));
          }
        }, 15000);
        
        audio.load();
      });

      setState(prev => ({
        ...prev,
        currentTrack: track,
        isLoading: false,
        error: null
      }));

      updateMediaSession(track);
    } catch (error) {
      console.error('Error loading audio:', error);
      handleAudioError(error, 'loadAudio');
    }
  }, [updateMediaSession, handleAudioError]);

  const playTrack = useCallback(async (track: Track) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      queue: prev.queue.some(t => t.id === track.id) ? prev.queue : [track, ...prev.queue]
    }));
    
    try {
      await loadAudio(track);
      
      if (audioRef.current) {
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        
        if (!streamLoggedRef.current.has(track.id)) {
          streamLoggedRef.current.add(track.id);
          logStream(track.id);
        }
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
    setState(prev => ({ ...prev, queue: [...prev.queue, track] }));
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setState(prev => ({ ...prev, queue: prev.queue.filter(track => track.id !== trackId) }));
  }, []);

  const clearQueue = useCallback(() => {
    setState(prev => ({ ...prev, queue: [] }));
  }, []);

  const playNext = useCallback(() => {
    let nextTrack: Track | null = null;
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    
    if (state.repeatMode === 'one' && state.currentTrack) {
      playTrack(state.currentTrack);
      return;
    }
    
    if (state.isShuffle) {
      const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        nextTrack = availableTracks[randomIndex];
      }
    } else if (currentIndex < state.queue.length - 1) {
      nextTrack = state.queue[currentIndex + 1];
    } else if (state.repeatMode === 'all' && state.queue.length > 0) {
      nextTrack = state.queue[0];
    }
    
    if (nextTrack) {
      playTrack(nextTrack);
    }
  }, [state.queue, state.currentTrack, state.isShuffle, state.repeatMode, playTrack]);

  const playPrevious = useCallback(() => {
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    
    if (state.isShuffle) {
      const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        playTrack(availableTracks[randomIndex]);
      }
    } else if (currentIndex > 0) {
      playTrack(state.queue[currentIndex - 1]);
    } else if (state.repeatMode === 'all' && state.queue.length > 0) {
      playTrack(state.queue[state.queue.length - 1]);
    }
  }, [state.queue, state.currentTrack, state.isShuffle, state.repeatMode, playTrack]);

  const likeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.from('likes').insert({ user_id: user.id, track_id: trackId });
      if (error) { console.error('Error liking track:', error); return false; }

      setState(prev => ({ ...prev, likedTracks: new Set([...prev.likedTracks, trackId]) }));
      return true;
    } catch (error) {
      console.error('Error liking track:', error);
      return false;
    }
  }, []);

  const unlikeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('track_id', trackId);
      if (error) { console.error('Error unliking track:', error); return false; }

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
      if (!user) return false;

      const { error } = await supabase.from('saved_tracks').insert({ user_id: user.id, track_id: trackId });
      if (error) { console.error('Error saving track:', error); return false; }

      setState(prev => ({ ...prev, savedTracks: new Set([...prev.savedTracks, trackId]) }));
      return true;
    } catch (error) {
      console.error('Error saving track:', error);
      return false;
    }
  }, []);

  const unsaveTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.from('saved_tracks').delete().eq('user_id', user.id).eq('track_id', trackId);
      if (error) { console.error('Error unsaving track:', error); return false; }

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

  const toggleRepeat = useCallback(() => {
    setState(prev => {
      const nextMode = prev.repeatMode === 'off' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'off';
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, [state.isShuffle]);

  const shareTrack = useCallback((_trackId: string) => {
    // TODO: implement share
  }, []);

  // Load user's existing likes and saved tracks
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: likes } = await supabase.from('likes').select('track_id').eq('user_id', user.id);
        const { data: savedTracks } = await supabase.from('saved_tracks').select('track_id').eq('user_id', user.id);

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
      };

      const handleEnded = async () => {
        if (state.currentTrack) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const listenTime = Math.floor(audio.duration || 30);
              await trackListeningHistory(user.id, state.currentTrack.id, listenTime);
            }
          } catch (err) {
            console.error('Error tracking listen:', err);
          }
          
          streamLoggedRef.current.delete(state.currentTrack.id);
        }
        
        setState(prev => ({ ...prev, isPlaying: false }));
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
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => seekTo(Math.max(0, state.currentTime - 10)));
      navigator.mediaSession.setActionHandler('seekforward', () => seekTo(Math.min(state.duration, state.currentTime + 10)));
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    }
  }, [play, pause, seekTo, state.currentTime, state.duration, playNext, playPrevious]);

  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    queue: state.queue,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    isMuted: state.isMuted,
    isLoading: state.isLoading,
    repeatMode: state.repeatMode,
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
