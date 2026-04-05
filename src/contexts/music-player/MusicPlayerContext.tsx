
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { MusicPlayerContextType } from './types';
import { useMusicPlayerState } from './useMusicPlayerState';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { toast } from 'sonner';

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

  // ---- Crossfade: fade-out current track then trigger next ----
  const crossfadeTriggeredRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedVolumeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!crossfadeEnabled || !audioRef.current) return;

    const audio = audioRef.current;
    const handleTimeUpdate = () => {
      const remaining = audio.duration - audio.currentTime;
      if (
        remaining <= crossfadeDuration &&
        remaining > 0.5 &&
        audio.duration > crossfadeDuration + 2 &&
        !crossfadeTriggeredRef.current &&
        !audio.paused
      ) {
        crossfadeTriggeredRef.current = true;
        // Save the volume so we can restore it
        savedVolumeRef.current = audio.volume;

        const steps = 20;
        const stepTime = (crossfadeDuration * 1000) / steps;
        const volumeStep = audio.volume / steps;

        fadeIntervalRef.current = setInterval(() => {
          if (audio.volume > volumeStep) {
            audio.volume = Math.max(0, audio.volume - volumeStep);
          } else {
            audio.volume = 0;
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            // Trigger next track
            musicPlayerState.playNext();
          }
        }, stepTime);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, [crossfadeEnabled, crossfadeDuration, musicPlayerState.playNext]);

  // Reset crossfade trigger and restore volume when track changes
  useEffect(() => {
    crossfadeTriggeredRef.current = false;
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (audioRef.current) {
      // Restore volume to user's setting
      const targetVol = savedVolumeRef.current ?? musicPlayerState.volume / 100;
      audioRef.current.volume = targetVol;
      savedVolumeRef.current = null;
    }
  }, [musicPlayerState.currentTrack?.id]);

  // Persist crossfade settings to localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('audio_preferences');
      const prefs = stored ? JSON.parse(stored) : {};
      prefs.crossfadeEnabled = crossfadeEnabled;
      prefs.crossfadeDuration = crossfadeDuration;
      localStorage.setItem('audio_preferences', JSON.stringify(prefs));
    } catch {}
  }, [crossfadeEnabled, crossfadeDuration]);

  const contextValue: MusicPlayerContextType = {
    ...musicPlayerState,
    audioEngine,
    crossfadeEnabled,
    crossfadeDuration,
    setCrossfadeEnabled: useCallback((enabled: boolean) => {
      setCrossfadeEnabled(enabled);
      if (enabled) {
        toast.success('Crossfade enabled', { duration: 2500 });
      }
    }, []),
    setCrossfadeDuration: useCallback((duration: number) => {
      setCrossfadeDuration(duration);
    }, []),
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" style={{ display: 'none' }} />
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
