ALTER TABLE public.user_audio_preferences
ADD COLUMN IF NOT EXISTS crossfade_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS crossfade_duration integer NOT NULL DEFAULT 6;