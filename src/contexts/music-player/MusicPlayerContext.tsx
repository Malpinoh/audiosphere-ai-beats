
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { MusicPlayerContextType } from './types';
import { useMusicPlayerState } from './useMusicPlayerState';
import { useAudioEngine } from '@/hooks/use-audio-engine';

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicPlayerState = useMusicPlayerState(audioRef);
  const audioEngine = useAudioEngine(audioRef);

  // Crossfade state
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('audio_preferences');
      if (stored) return JSON.parse(stored).crossfadeEnabled ?? false;
    } catch {}
    return false;
  });
  const [crossfadeDuration, setCrossfadeDuration] = useState(() => {
    try {
      const stored = localStorage.getItem('audio_preferences');
      if (stored) return JSON.parse(stored).crossfadeDuration ?? 6;
    } catch {}
    return 6;
  });

  // Crossfade: detect when track is near end and trigger next
  const crossfadeTriggeredRef = useRef(false);

  useEffect(() => {
    if (!crossfadeEnabled || !audioRef.current) return;
    
    const audio = audioRef.current;
    const handleTimeUpdate = () => {
      const remaining = audio.duration - audio.currentTime;
      if (remaining <= crossfadeDuration && remaining > 0 && audio.duration > crossfadeDuration + 2 && !crossfadeTriggeredRef.current) {
        crossfadeTriggeredRef.current = true;
        // Fade out current track volume
        const fadeInterval = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume = Math.max(0, audio.volume - 0.05);
          } else {
            clearInterval(fadeInterval);
          }
        }, (crossfadeDuration * 1000) / 20);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [crossfadeEnabled, crossfadeDuration]);

  // Reset crossfade trigger and restore volume when track changes
  useEffect(() => {
    crossfadeTriggeredRef.current = false;
    // Always restore volume when a new track is set
    if (audioRef.current) {
      audioRef.current.volume = musicPlayerState.volume / 100;
    }
  }, [musicPlayerState.currentTrack?.id, musicPlayerState.volume]);

  const contextValue: MusicPlayerContextType = {
    ...musicPlayerState,
    audioEngine,
    crossfadeEnabled,
    crossfadeDuration,
    setCrossfadeEnabled: useCallback((enabled: boolean) => {
      setCrossfadeEnabled(enabled);
    }, []),
    setCrossfadeDuration: useCallback((duration: number) => {
      setCrossfadeDuration(duration);
    }, []),
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
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
