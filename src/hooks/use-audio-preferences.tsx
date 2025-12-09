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
}

const DEFAULT_PREFERENCES: AudioPreferences = {
  preferredQuality: 'high',
  autoQuality: true,
  enableEq: false,
  eqPreset: {},
  volumeNormalization: true,
};

export function useAudioPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AudioPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from database or localStorage
  const loadPreferences = useCallback(async () => {
    setLoading(true);
    
    try {
      if (user) {
        // Load from database for authenticated users
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
          });
        } else {
          // Create default preferences for new users
          await savePreferences(DEFAULT_PREFERENCES);
          setPreferences(DEFAULT_PREFERENCES);
        }
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem('audio_preferences');
        if (stored) {
          try {
            setPreferences(JSON.parse(stored));
          } catch {
            setPreferences(DEFAULT_PREFERENCES);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save preferences
  const savePreferences = useCallback(async (newPreferences: Partial<AudioPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    try {
      if (user) {
        // Save to database
        const { error } = await supabase
          .from('user_audio_preferences')
          .upsert({
            user_id: user.id,
            preferred_quality: updated.preferredQuality,
            auto_quality: updated.autoQuality,
            enable_eq: updated.enableEq,
            eq_preset: updated.eqPreset,
            volume_normalization: updated.volumeNormalization,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error saving audio preferences:', error);
          toast.error('Failed to save preferences');
        }
      } else {
        // Save to localStorage for anonymous users
        localStorage.setItem('audio_preferences', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error in savePreferences:', error);
    }
  }, [user, preferences]);

  // Update individual preference
  const updatePreference = useCallback(<K extends keyof AudioPreferences>(
    key: K,
    value: AudioPreferences[K]
  ) => {
    savePreferences({ [key]: value });
  }, [savePreferences]);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
    toast.success('Audio preferences reset to defaults');
  }, [savePreferences]);

  // Load on mount and user change
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
