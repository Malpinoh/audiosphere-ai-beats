import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Track } from "@/types/track-types";
import { logStreamPlay } from "@/services/track-service";

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
  const [playbackStarted, setPlaybackStarted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', onMetadataLoaded);
      audioRef.current.addEventListener('ended', handleTrackEnd);
      audioRef.current.addEventListener('error', handleAudioError);
      audioRef.current.addEventListener('playing', handlePlayStart);
      audioRef.current.addEventListener('canplay', handleCanPlay);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', onMetadataLoaded);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.removeEventListener('error', handleAudioError);
        audioRef.current.removeEventListener('playing', handlePlayStart);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Update audio src when currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    setIsLoading(true);
    setPlaybackStarted(false);
    
    // Use the formatted audioUrl if available, otherwise fallback to audio_file_path
    const audioSrc = currentTrack.audioUrl || currentTrack.audio_file_path;
    
    // Debug information
    console.log("Setting audio source:", audioSrc);
    
    // Only set src if we have a valid audio source
    if (audioSrc) {
      audioRef.current.src = audioSrc;
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
    } else {
      console.error('No audio source available for:', currentTrack.title);
      toast.error('Audio source not available for this track');
      setIsLoading(false);
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
  };
  
  const handlePlayStart = () => {
    if (!playbackStarted && currentTrack) {
      setPlaybackStarted(true);
      // Log play count
      logStreamPlay(currentTrack.id).catch(err => {
        console.error('Failed to log stream play:', err);
      });
    }
  };
  
  const handleCanPlay = () => {
    setIsLoading(false);
  };
  
  const handleTrackEnd = () => {
    playNext();
  };
  
  const handleAudioError = (e: any) => {
    console.error('Audio error:', e);
    setIsLoading(false);
    
    // Check if currentTrack exists and if it has valid audio URL
    if (currentTrack) {
      // Try to provide a more specific error message
      if (!currentTrack.audioUrl && !currentTrack.audio_file_path) {
        toast.error(`Track "${currentTrack.title}" has no audio file attached.`);
      } else {
        toast.error('Error playing this track. Please try again later.');
      }
    } else {
      toast.error('Error playing audio. No track selected.');
    }
  };
  
  const playTrack = (track: Track) => {
    // If the track is not in the queue, add it
    if (!queue.some(t => t.id === track.id)) {
      setQueue(prevQueue => [...prevQueue, track]);
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
  };
  
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play was prevented:', error);
          setIsPlaying(false);
          
          if (error.name === 'NotSupportedError') {
            toast.error('Audio format not supported or file not found.');
          } else if (error.name === 'NotAllowedError') {
            toast.error('Playback was prevented by your browser. Please enable autoplay.');
          } else {
            toast.error('Unable to play track. Please try again.');
          }
        });
      }
      
      setIsPlaying(true);
    }
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
    } else {
      toast.info(`"${track.title}" is already in your queue`);
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
