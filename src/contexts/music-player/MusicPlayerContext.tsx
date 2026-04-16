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

  // STEP 6: Hydrate EQ on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('audio_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.eqBands || prefs.eqPreset || prefs.eqEnabled) {
          audioEngine.loadSavedState(
            prefs.eqBands || null,
            prefs.eqPreset || null,
            prefs.eqEnabled ?? false
          );
        }
      }
    } catch {}
  }, []);

  // Crossfade state - initialize from localStorage, then hydrate from Supabase
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

  // Hydrate crossfade settings from Supabase when user logs in
  useEffect(() => {
    const hydrate = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('user_audio_preferences')
          .select('crossfade_enabled, crossfade_duration')
          .eq('user_id', userId)
          .single();
        if (data) {
          const enabled = (data as any).crossfade_enabled ?? false;
          const duration = (data as any).crossfade_duration ?? 6;
          console.log(`[Crossfade] Hydrated from DB: enabled=${enabled}, duration=${duration}`);
          setCrossfadeEnabled(enabled);
          setCrossfadeDuration(duration);
          try {
            const stored = localStorage.getItem('audio_preferences');
            const prefs = stored ? JSON.parse(stored) : {};
            prefs.crossfadeEnabled = enabled;
            prefs.crossfadeDuration = duration;
            localStorage.setItem('audio_preferences', JSON.stringify(prefs));
          } catch {}
        }
      } catch (err) {
        console.error('[Crossfade] Error hydrating from DB:', err);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) hydrate(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        hydrate(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- Crossfade: fade-out current track then trigger next ----
  const crossfadeTriggeredRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedVolumeRef = useRef<number | null>(null);
  // Stable ref for playNext so the effect doesn't re-run
  const playNextRef = useRef(musicPlayerState.playNext);
  playNextRef.current = musicPlayerState.playNext;

  useEffect(() => {
    console.log(`[Crossfade] State: enabled=${crossfadeEnabled}, duration=${crossfadeDuration}s`);
  }, [crossfadeEnabled, crossfadeDuration]);

  useEffect(() => {
    if (!crossfadeEnabled) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    console.log('[Crossfade] Setting up timeupdate listener');
    
    const handleTimeUpdate = () => {
      const remaining = audio.duration - audio.currentTime;
      
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
            console.log('[Crossfade] ✅ Fade complete, restoring volume and triggering next track');
            // STEP 1 FIX: Restore volume BEFORE triggering next track
            // so the new track does not start at volume 0
            audio.volume = savedVolumeRef.current ?? startVolume;
            savedVolumeRef.current = null;
            playNextRef.current();
          }
        }, stepTime);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      // Only clear interval if fade was not triggered (unmounting mid-fade keeps it alive)
      if (fadeIntervalRef.current && !crossfadeTriggeredRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, [crossfadeEnabled, crossfadeDuration]);

  // Reset crossfade trigger when track changes
  useEffect(() => {
    crossfadeTriggeredRef.current = false;
    crossfadeActiveRef.current = false;
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    // Ensure volume is correct for the new track
    if (audioRef.current && savedVolumeRef.current !== null) {
      audioRef.current.volume = savedVolumeRef.current;
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
