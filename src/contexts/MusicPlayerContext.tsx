
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Track } from "@/hooks/use-tracks";

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setQueue: (tracks: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', onMetadataLoaded);
      audioRef.current.addEventListener('ended', handleTrackEnd);
      audioRef.current.addEventListener('error', handleAudioError);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', onMetadataLoaded);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.removeEventListener('error', handleAudioError);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Update audio src when currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    setIsLoading(true);
    audioRef.current.src = currentTrack.audioUrl || currentTrack.audio_file_path;
    audioRef.current.load();
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Auto-play was prevented:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack]);
  
  // Update volume when it changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);
  
  const updateProgress = () => {
    if (!audioRef.current) return;
    
    setCurrentTime(audioRef.current.currentTime);
  };
  
  const onMetadataLoaded = () => {
    if (!audioRef.current) return;
    
    setDuration(audioRef.current.duration);
    setIsLoading(false);
  };
  
  const handleTrackEnd = () => {
    playNext();
  };
  
  const handleAudioError = (e: any) => {
    console.error('Audio error:', e);
    setIsLoading(false);
    toast.error('Error playing this track');
  };
  
  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };
  
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play was prevented:', error);
        });
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const playNext = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    
    if (currentIndex === -1 || currentIndex === queue.length - 1) {
      // If current track is not in queue or is the last track, play the first track
      playTrack(queue[0]);
    } else {
      // Play the next track in queue
      playTrack(queue[currentIndex + 1]);
    }
  };
  
  const playPrevious = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    
    if (currentIndex === -1 || currentIndex === 0) {
      // If current track is not in queue or is the first track, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      // Play the previous track in queue
      playTrack(queue[currentIndex - 1]);
    }
  };
  
  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const addToQueue = (track: Track) => {
    // Check if track is already in queue
    if (!queue.some(t => t.id === track.id)) {
      setQueue([...queue, track]);
      toast.success(`Added "${track.title}" to queue`);
    }
  };
  
  const removeFromQueue = (trackId: string) => {
    setQueue(queue.filter(track => track.id !== trackId));
  };
  
  const value = {
    currentTrack,
    isPlaying,
    queue,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
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
  };
  
  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  
  return context;
}
