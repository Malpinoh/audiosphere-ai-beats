import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '@/types/track-types';
import { RepeatMode, PlaybackError } from '@/contexts/music-player/types';
import { supabase } from '@/integrations/supabase/client';
import { useStreamLogger } from '@/hooks/use-stream-logger';
import { toast } from 'sonner';

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
  playbackError: PlaybackError | null;
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
  volume: 50,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  playbackError: null,
  queue: [],
  isMuted: false,
  repeatMode: 'off' as RepeatMode,
  isShuffle: false,
  likedTracks: new Set(),
  savedTracks: new Set(),
};

const getValidAudioUrl = (audioFilePath: string): string => {
  if (!audioFilePath) {
    throw new Error('No audio file path provided');
  }
  if (audioFilePath.startsWith('http')) {
    return audioFilePath;
  }
  const cleanPath = audioFilePath.trim().replace(/^\/+/, '');
  const baseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files';
  return `${baseUrl}/${cleanPath}`;
};

const categorizeError = (error: any, audioUrl?: string): PlaybackError => {
  // Check network status first
  if (!navigator.onLine) {
    return {
      type: 'network',
      message: 'You are offline. Check your internet connection.',
      canRetry: true,
      audioUrl,
    };
  }

  // MediaError from audio element
  if (error?.target?.error || error?.code) {
    const mediaError = error?.target?.error || error;
    const code = mediaError.code || mediaError;
    switch (code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return { type: 'unknown', message: 'Playback was aborted.', canRetry: true, audioUrl };
      case MediaError.MEDIA_ERR_NETWORK:
        return { type: 'network', message: 'Network error — check your connection and retry.', canRetry: true, audioUrl, errorCode: code };
      case MediaError.MEDIA_ERR_DECODE:
        return { type: 'decode', message: 'Audio file could not be decoded.', canRetry: false, audioUrl, errorCode: code };
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return { type: 'source', message: 'Audio format is not supported by your browser.', canRetry: false, audioUrl, errorCode: code };
    }
  }

  const msg = error?.message || String(error);
  if (msg.includes('timeout') || msg.includes('Timeout')) {
    return { type: 'timeout', message: 'Audio took too long to load. Try again.', canRetry: true, audioUrl };
  }
  if (msg.includes('network') || msg.includes('Network') || msg.includes('fetch')) {
    return { type: 'network', message: 'Network error while loading audio.', canRetry: true, audioUrl };
  }

  return { type: 'unknown', message: msg || 'Failed to play audio.', canRetry: true, audioUrl };
};

export const useMusicPlayerState = (externalAudioRef?: React.RefObject<HTMLAudioElement>) => {
  const [state, setState] = useState<MusicPlayerState>(initialState);
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalAudioRef;
  const { logStream } = useStreamLogger();
  const streamLoggedRef = useRef<Set<string>>(new Set());
  const playbackLockRef = useRef<number>(0);
  const lastAudioUrlRef = useRef<string>('');

  const handleAudioError = useCallback((error: any, context: string = '', audioUrl?: string) => {
    if (error?.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) return;
    if (error?.message?.includes('interrupted') || error?.message?.includes('aborted')) return;

    console.error(`Audio error in ${context}:`, error);
    
    const playbackError = categorizeError(error, audioUrl || lastAudioUrlRef.current);
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      isPlaying: false,
      playbackError,
    }));
    
    toast.error(playbackError.message, { duration: 2500 });
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
          artwork: [{ src: coverUrl, sizes: '512x512', type: 'image/jpeg' }]
        });
      } catch (error) {
        console.error('Error updating media session:', error);
      }
    }
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    if (!track?.audio_file_path) {
      console.error('No audio file path provided for track:', track);
      handleAudioError(new Error('No audio file path'), 'playTrack');
      return;
    }

    const lockId = ++playbackLockRef.current;

    setState(prev => ({
      ...prev,
      isLoading: true,
      playbackError: null,
      currentTrack: track,
      queue: prev.queue.some(t => t.id === track.id) ? prev.queue : [track, ...prev.queue]
    }));

    try {
      const audioUrl = getValidAudioUrl(track.audio_file_path);
      lastAudioUrlRef.current = audioUrl;

      if (!audioRef.current) {
        throw new Error('Audio element not available');
      }

      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.crossOrigin = 'anonymous';
      audio.src = audioUrl;
      
      // Unlock audio on mobile by calling play() synchronously in user gesture context
      audio.play().catch(() => {});

      const waitForCanPlay = (retryCount: number = 0): Promise<void> => {
        return new Promise((resolve, reject) => {
          let resolved = false;
          const handleCanPlay = () => { if (resolved) return; resolved = true; cleanup(); resolve(); };
          const handleError = () => { if (resolved) return; resolved = true; cleanup(); reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`)); };
          const cleanup = () => { audio.removeEventListener('canplay', handleCanPlay); audio.removeEventListener('error', handleError); };
          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              cleanup();
              if (retryCount < 1) {
                audio.load();
                waitForCanPlay(retryCount + 1).then(resolve).catch(reject);
              } else {
                reject(new Error('Audio loading timeout - file may be too large or network is slow'));
              }
            }
          }, 45000);
          // If audio is already ready (e.g. cached), resolve immediately
          if (audio.readyState >= 3) {
            handleCanPlay();
          }
        });
      };

      await waitForCanPlay();
      if (playbackLockRef.current !== lockId) return;

      await audio.play();
      if (playbackLockRef.current !== lockId) return;

      setState(prev => ({ ...prev, isPlaying: true, isLoading: false, playbackError: null }));
      updateMediaSession(track);

      if (!streamLoggedRef.current.has(track.id)) {
        streamLoggedRef.current.add(track.id);
        logStream(track.id);
      }
    } catch (error: any) {
      if (playbackLockRef.current !== lockId) return;
      if (error?.name === 'AbortError' || error?.message?.includes('interrupted')) return;
      console.error("Playback failed:", error);
      handleAudioError(error, 'playTrack', lastAudioUrlRef.current);
    }
  }, [handleAudioError, logStream, updateMediaSession]);

  const retryPlayback = useCallback(() => {
    if (state.currentTrack) {
      playTrack(state.currentTrack);
    }
  }, [state.currentTrack, playTrack]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true, playbackError: null }));
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('interrupted')) return;
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
    if (state.isPlaying) { pause(); } else { play(); }
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
    if (state.repeatMode === 'one' && state.currentTrack) { playTrack(state.currentTrack); return; }
    if (state.isShuffle) {
      const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
      if (availableTracks.length > 0) { nextTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)]; }
    } else if (currentIndex < state.queue.length - 1) {
      nextTrack = state.queue[currentIndex + 1];
    } else if (state.repeatMode === 'all' && state.queue.length > 0) {
      nextTrack = state.queue[0];
    }
    if (nextTrack) { playTrack(nextTrack); }
  }, [state.queue, state.currentTrack, state.isShuffle, state.repeatMode, playTrack]);

  const playPrevious = useCallback(() => {
    const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
    if (state.isShuffle) {
      const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
      if (availableTracks.length > 0) { playTrack(availableTracks[Math.floor(Math.random() * availableTracks.length)]); }
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
    } catch (error) { console.error('Error liking track:', error); return false; }
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
    } catch (error) { console.error('Error unliking track:', error); return false; }
  }, []);

  const saveTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { error } = await supabase.from('saved_tracks').insert({ user_id: user.id, track_id: trackId });
      if (error) { console.error('Error saving track:', error); return false; }
      setState(prev => ({ ...prev, savedTracks: new Set([...prev.savedTracks, trackId]) }));
      return true;
    } catch (error) { console.error('Error saving track:', error); return false; }
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
    } catch (error) { console.error('Error unsaving track:', error); return false; }
  }, []);

  const isTrackLiked = useCallback((trackId: string): boolean => state.likedTracks.has(trackId), [state.likedTracks]);
  const isTrackSaved = useCallback((trackId: string): boolean => state.savedTracks.has(trackId), [state.savedTracks]);

  const toggleRepeat = useCallback(() => {
    setState(prev => {
      const nextMode = prev.repeatMode === 'off' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'off';
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const shareTrack = useCallback((_trackId: string) => {}, []);

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
      } catch (error) { console.error('Error loading user preferences:', error); }
    };
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const updateCurrentTime = () => { setState(prev => ({ ...prev, currentTime: audio.currentTime || 0 })); };
      const updateDuration = () => { setState(prev => ({ ...prev, duration: audio.duration || 0 })); };
      const handleEnded = async () => {
        if (state.currentTrack) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const listenTime = Math.floor(audio.duration || 30);
              await trackListeningHistory(user.id, state.currentTrack.id, listenTime);
            }
          } catch (err) { console.error('Error tracking listen:', err); }
          streamLoggedRef.current.delete(state.currentTrack.id);
        }
        setState(prev => ({ ...prev, isPlaying: false }));
        playNext();
      };
      const handleAudioElementError = (e: Event) => { handleAudioError(e, 'audio element'); };

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
    playbackError: state.playbackError,
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
    retryPlayback,
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
