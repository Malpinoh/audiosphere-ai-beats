
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { MusicPlayerContextType } from './types';
import { useMusicPlayerState } from './useMusicPlayerState';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const crossfadeActiveRef = useRef(false);
  const musicPlayerState = useMusicPlayerState(audioRef, crossfadeActiveRef);
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
  // Stable ref for playNext so the effect doesn't re-run and kill the fade
  const playNextRef = useRef(musicPlayerState.playNext);
  playNextRef.current = musicPlayerState.playNext;

  // Debug: log crossfade state on mount
  useEffect(() => {
    console.log(`[Crossfade] State: enabled=${crossfadeEnabled}, duration=${crossfadeDuration}s`);
  }, [crossfadeEnabled, crossfadeDuration]);

  useEffect(() => {
    if (!crossfadeEnabled) {
      console.log('[Crossfade] Disabled, skipping listener setup');
      return;
    }
    
    const audio = audioRef.current;
    if (!audio) {
      console.log('[Crossfade] No audio element available');
      return;
    }

    console.log('[Crossfade] Setting up timeupdate listener');
    let debugCounter = 0;
    
    const handleTimeUpdate = () => {
      const remaining = audio.duration - audio.currentTime;
      
      // Debug log every ~5 seconds
      debugCounter++;
      if (debugCounter % 20 === 0) {
        console.log(`[Crossfade] Monitoring: remaining=${remaining.toFixed(1)}s, duration=${audio.duration.toFixed(1)}s, paused=${audio.paused}, triggered=${crossfadeTriggeredRef.current}`);
      }
      
      // Skip if duration unknown
      if (!isFinite(remaining) || isNaN(audio.duration) || audio.duration <= 0) return;
      
      if (
        remaining <= crossfadeDuration &&
        remaining > 0.3 &&
        audio.duration > crossfadeDuration + 2 &&
        !crossfadeTriggeredRef.current &&
        !audio.paused
      ) {
        crossfadeTriggeredRef.current = true;
        crossfadeActiveRef.current = true;
        savedVolumeRef.current = audio.volume;
        console.log(`[Crossfade] 🎵 Starting fade-out! Remaining: ${remaining.toFixed(1)}s, Volume: ${audio.volume}`);
        toast.info('Crossfade: fading to next track…', { duration: 2000 });

        const steps = 30;
        const fadeTime = Math.min(crossfadeDuration, remaining - 0.2);
        const stepTime = (fadeTime * 1000) / steps;
        const startVolume = audio.volume;

        let step = 0;
        fadeIntervalRef.current = setInterval(() => {
          step++;
          if (step < steps) {
            const progress = step / steps;
            const eased = 1 - progress * progress;
            audio.volume = Math.max(0, startVolume * eased);
          } else {
            audio.volume = 0;
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            console.log('[Crossfade] ✅ Fade complete, triggering next track');
            playNextRef.current();
          }
        }, stepTime);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      if (fadeIntervalRef.current && !crossfadeTriggeredRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, [crossfadeEnabled, crossfadeDuration]);

  // Reset crossfade trigger and restore volume when track changes
  useEffect(() => {
    crossfadeTriggeredRef.current = false;
    crossfadeActiveRef.current = false;
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

  // ---- Auto-detect and persist actual track duration ----
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleDurationDetected = () => {
      const realDuration = Math.round(audio.duration);
      const track = musicPlayerState.currentTrack;
      if (!track || !realDuration || realDuration <= 0) return;
      // Update DB if stored duration is missing/wrong
      if (!track.duration || Math.abs(track.duration - realDuration) > 2) {
        supabase.from('tracks').update({ duration: realDuration }).eq('id', track.id).then(() => {});
      }
    };
    audio.addEventListener('loadedmetadata', handleDurationDetected);
    return () => audio.removeEventListener('loadedmetadata', handleDurationDetected);
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
