import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AudioQualityTier = 'normal' | 'high' | 'hifi' | 'hires';

interface AudioPreferences {
  preferredQuality: AudioQualityTier;
  autoQuality: boolean;
  enableEq: boolean;
  eqPreset: Record<string, number>;
  volumeNormalization: boolean;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
}

const DEFAULT_PREFERENCES: AudioPreferences = {
  preferredQuality: 'high',
  autoQuality: true,
  enableEq: false,
  eqPreset: {},
  volumeNormalization: true,
  crossfadeEnabled: false,
  crossfadeDuration: 6,
};

export function useAudioPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AudioPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_audio_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading audio preferences:', error);
        }

        if (data) {
          setPreferences({
            preferredQuality: data.preferred_quality as AudioQualityTier,
            autoQuality: data.auto_quality,
            enableEq: data.enable_eq,
            eqPreset: (data.eq_preset as Record<string, number>) || {},
            volumeNormalization: data.volume_normalization,
            crossfadeEnabled: (data as any).crossfade_enabled ?? false,
            crossfadeDuration: (data as any).crossfade_duration ?? 6,
          });
        } else {
          await savePreferences(DEFAULT_PREFERENCES);
          setPreferences(DEFAULT_PREFERENCES);
        }
      } else {
        const stored = localStorage.getItem('audio_preferences');
        if (stored) {
          try { setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }); }
          catch { setPreferences(DEFAULT_PREFERENCES); }
        }
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const savePreferences = useCallback(async (newPreferences: Partial<AudioPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    try {
      if (user) {
        const { error } = await supabase
          .from('user_audio_preferences')
          .upsert({
            user_id: user.id,
            preferred_quality: updated.preferredQuality,
            auto_quality: updated.autoQuality,
            enable_eq: updated.enableEq,
            eq_preset: updated.eqPreset,
            volume_normalization: updated.volumeNormalization,
            crossfade_enabled: updated.crossfadeEnabled,
            crossfade_duration: updated.crossfadeDuration,
            updated_at: new Date().toISOString(),
          } as any, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error saving audio preferences:', error);
          toast.error('Failed to save preferences', { duration: 2500 });
        }
      } else {
        localStorage.setItem('audio_preferences', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error in savePreferences:', error);
    }
  }, [user, preferences]);

  const updatePreference = useCallback(<K extends keyof AudioPreferences>(
    key: K,
    value: AudioPreferences[K]
  ) => {
    savePreferences({ [key]: value });
  }, [savePreferences]);

  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
    toast.success('Audio preferences reset to defaults', { duration: 2500 });
  }, [savePreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    updatePreference,
    savePreferences,
    resetPreferences,
  };
}
