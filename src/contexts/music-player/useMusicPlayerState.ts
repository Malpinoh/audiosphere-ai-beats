import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Track } from "@/types/track-types";
import { logStreamPlay } from "@/services/track-service";
import { supabase } from "@/integrations/supabase/client";

export function useMusicPlayerState() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Load liked and saved tracks from localStorage on init
  useEffect(() => {
    const loadUserPreferences = () => {
      try {
        const likedTracksData = localStorage.getItem('likedTracks');
        if (likedTracksData) {
          const parsedLikedTracks = JSON.parse(likedTracksData);
          setLikedTracks(new Set(parsedLikedTracks));
        }
        
        const savedTracksData = localStorage.getItem('savedTracks');
        if (savedTracksData) {
          const parsedSavedTracks = JSON.parse(savedTracksData);
          setSavedTracks(new Set(parsedSavedTracks));
        }
      } catch (error) {
        console.error('Error loading user track preferences:', error);
      }
    };
    
    loadUserPreferences();
  }, []);

  // Save liked and saved tracks to localStorage when they change
  useEffect(() => {
    localStorage.setItem('likedTracks', JSON.stringify([...likedTracks]));
  }, [likedTracks]);

  useEffect(() => {
    localStorage.setItem('savedTracks', JSON.stringify([...savedTracks]));
  }, [savedTracks]);
  
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Set audio element properties for better compatibility and format support
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
      
      // Add support for multiple audio formats
      audioRef.current.addEventListener('loadstart', () => {
        console.log('Audio load started');
      });
      
      audioRef.current.addEventListener('canplay', () => {
        console.log('Audio can play');
        setIsLoading(false);
      });
      
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
        setIsLoading(false);
      });
      
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', onMetadataLoaded);
      audioRef.current.addEventListener('ended', handleTrackEnd);
      audioRef.current.addEventListener('error', handleAudioError);
      audioRef.current.addEventListener('playing', handlePlayStart);
      
      // Set up media session API for native controls if available
      if ('mediaSession' in navigator) {
        setupMediaSessionHandlers();
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', onMetadataLoaded);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.removeEventListener('error', handleAudioError);
        audioRef.current.removeEventListener('playing', handlePlayStart);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Function to validate and convert audio URL with better format support
  const getValidAudioUrl = async (track: Track): Promise<string | null> => {
    const audioSrc = track.audioUrl || track.audio_file_path;
    
    if (!audioSrc) {
      console.error('No audio source available for:', track.title);
      return null;
    }
    
    console.log('Original audio source:', audioSrc);
    
    // Check if it's a Supabase storage URL and ensure it's properly formatted
    if (audioSrc.includes('supabase.co/storage/v1/object/public/')) {
      return audioSrc;
    } else if (audioSrc.includes('/storage/v1/object/public/')) {
      return `https://qkpjlfcpncvvjyzfolag.supabase.co${audioSrc}`;
    }
    
    // For other URLs, validate they exist and are accessible
    try {
      const response = await fetch(audioSrc, { method: 'HEAD' });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Audio content type:', contentType);
        
        // Check if the audio format is supported by the browser
        if (audioRef.current && contentType) {
          const isSupported = audioRef.current.canPlayType(contentType);
          if (isSupported === '') {
            console.warn('Audio format may not be supported:', contentType);
            // Try to fallback to generic audio type
            return audioSrc;
          }
        }
        
        return audioSrc;
      } else {
        console.error('Audio file not accessible:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error validating audio URL:', error);
      return null;
    }
  };
  
  // Set up media session handlers for native media controls
  const setupMediaSessionHandlers = () => {
    navigator.mediaSession.setActionHandler('play', () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });
    
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
  };
  
  // Update audio src when currentTrack changes with better format handling
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    
    setIsLoading(true);
    setPlaybackStarted(false);
    
    const loadAudio = async () => {
      try {
        const validUrl = await getValidAudioUrl(currentTrack);
        
        if (!validUrl) {
          toast.error(`Cannot play "${currentTrack.title}" - audio file not found or format not supported`);
          setIsLoading(false);
          return;
        }
        
        console.log('Setting validated audio source:', validUrl);
        
        if (audioRef.current) {
          // Reset audio element
          audioRef.current.src = '';
          audioRef.current.load();
          
          // Set new source with format detection
          audioRef.current.src = validUrl;
          
          // Check browser support for the audio format
          audioRef.current.addEventListener('loadstart', () => {
            console.log('Audio loading started for:', currentTrack.title);
          });
          
          audioRef.current.addEventListener('error', (e) => {
            console.error('Audio loading error:', e);
            handleAudioError(e);
          });
          
          audioRef.current.load();
          
          if (isPlaying) {
            try {
              await audioRef.current.play();
            } catch (error) {
              console.error('Auto-play was prevented:', error);
              setIsPlaying(false);
              handleAudioError(error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        toast.error(`Error loading "${currentTrack.title}" - unsupported format`);
        setIsLoading(false);
      }
    };
    
    loadAudio();
    
    // Update media session metadata if available
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [
          { src: currentTrack.cover || currentTrack.cover_art_path, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
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
    console.log('Audio metadata loaded, duration:', audioRef.current.duration);
  };
  
  const handlePlayStart = () => {
    if (!playbackStarted && currentTrack) {
      setPlaybackStarted(true);
      console.log('Playback started for:', currentTrack.title);
      // Log play count
      logStreamPlay(currentTrack.id).catch(err => {
        console.error('Failed to log stream play:', err);
      });
    }
  };
  
  const handleCanPlay = () => {
    console.log('Audio can play');
    setIsLoading(false);
  };
  
  const handleTrackEnd = () => {
    console.log('Track ended, playing next');
    playNext();
  };
  
  const handleAudioError = (e: any) => {
    console.error('Audio error details:', e);
    setIsLoading(false);
    setIsPlaying(false);
    
    if (currentTrack) {
      // Provide more specific error messages based on error type
      if (e?.target?.error) {
        const errorCode = e.target.error.code;
        switch (errorCode) {
          case 1: // MEDIA_ERR_ABORTED
            toast.error('Playback was aborted');
            break;
          case 2: // MEDIA_ERR_NETWORK
            toast.error('Network error - check your connection');
            break;
          case 3: // MEDIA_ERR_DECODE
            toast.error(`Audio format not supported by your browser. Try using a different format for "${currentTrack.title}"`);
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            toast.error(`Audio file format not supported by your browser. "${currentTrack.title}" may need to be re-encoded`);
            break;
          default:
            toast.error(`Error playing "${currentTrack.title}" - format may not be supported`);
        }
      } else if (e?.name === 'NotSupportedError') {
        toast.error(`Audio format not supported by your browser for "${currentTrack.title}"`);
      } else if (e?.name === 'NotAllowedError') {
        toast.error('Playback prevented - please enable autoplay');
      } else {
        toast.error(`Cannot play "${currentTrack.title}" - audio file may be corrupted or format unsupported`);
      }
    } else {
      toast.error('Audio playback error - format may not be supported');
    }
  };
  
  // ... keep existing code (playTrack, togglePlay, playNext, playPrevious, seekTo, setVolume, toggleMute, addToQueue, removeFromQueue functions)
  
  const playTrack = (track: Track) => {
    console.log('Playing track:', track.title, 'Audio URL:', track.audioUrl || track.audio_file_path);
    
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
          handleAudioError(error);
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

  // ... keep existing code (like, save and share functions)
  const isTrackLiked = (trackId: string): boolean => {
    return likedTracks.has(trackId);
  };

  const isTrackSaved = (trackId: string): boolean => {
    return savedTracks.has(trackId);
  };

  const likeTrack = async (trackId: string): Promise<boolean> => {
    try {
      // Try to update like count in Supabase if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First check if the track exists
        const { data: track, error: trackError } = await supabase
          .from('tracks')
          .select('id, like_count')
          .eq('id', trackId)
          .single();
        
        if (trackError || !track) {
          console.error('Error finding track:', trackError);
        } else {
          // Update the like count
          const { error } = await supabase
            .from('tracks')
            .update({ like_count: (track.like_count || 0) + 1 })
            .eq('id', trackId);
          
          if (error) {
            console.error('Error updating like count:', error);
          }
        }
      }

      // Update local state regardless of database update
      setLikedTracks(prev => {
        const newSet = new Set(prev);
        newSet.add(trackId);
        return newSet;
      });
      
      toast.success("Added to your liked tracks");
      return true;
    } catch (error) {
      console.error('Error liking track:', error);
      toast.error("Couldn't add to liked tracks");
      return false;
    }
  };

  const unlikeTrack = async (trackId: string): Promise<boolean> => {
    try {
      // Try to update like count in Supabase if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First check if the track exists
        const { data: track, error: trackError } = await supabase
          .from('tracks')
          .select('id, like_count')
          .eq('id', trackId)
          .single();
        
        if (trackError || !track) {
          console.error('Error finding track:', trackError);
        } else {
          // Update the like count (ensure it doesn't go below 0)
          const { error } = await supabase
            .from('tracks')
            .update({ like_count: Math.max(0, (track.like_count || 0) - 1) })
            .eq('id', trackId);
          
          if (error) {
            console.error('Error updating like count:', error);
          }
        }
      }

      // Update local state regardless of database update
      setLikedTracks(prev => {
        const newSet = new Set(prev);
        newSet.delete(trackId);
        return newSet;
      });
      
      toast.success("Removed from your liked tracks");
      return true;
    } catch (error) {
      console.error('Error unliking track:', error);
      toast.error("Couldn't remove from liked tracks");
      return false;
    }
  };

  const saveTrack = async (trackId: string): Promise<boolean> => {
    try {
      // TODO: Add database interaction for saved tracks when feature is extended
      setSavedTracks(prev => {
        const newSet = new Set(prev);
        newSet.add(trackId);
        return newSet;
      });
      
      toast.success("Added to your library");
      return true;
    } catch (error) {
      console.error('Error saving track:', error);
      toast.error("Couldn't add to library");
      return false;
    }
  };

  const unsaveTrack = async (trackId: string): Promise<boolean> => {
    try {
      // TODO: Add database interaction for saved tracks when feature is extended
      setSavedTracks(prev => {
        const newSet = new Set(prev);
        newSet.delete(trackId);
        return newSet;
      });
      
      toast.success("Removed from your library");
      return true;
    } catch (error) {
      console.error('Error removing saved track:', error);
      toast.error("Couldn't remove from library");
      return false;
    }
  };

  const shareTrack = (trackId: string) => {
    // Create the share URL
    const shareUrl = `${window.location.origin}/track/${trackId}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: currentTrack?.title || 'Check out this track',
        text: `Listen to ${currentTrack?.title} by ${currentTrack?.artist}`,
        url: shareUrl
      }).catch(error => {
        console.error('Error sharing:', error);
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error("Couldn't copy link");
      });
  };

  return {
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
    likedTracks,
    savedTracks,
    likeTrack,
    unlikeTrack,
    saveTrack,
    unsaveTrack,
    isTrackLiked,
    isTrackSaved,
    shareTrack
  };
}
