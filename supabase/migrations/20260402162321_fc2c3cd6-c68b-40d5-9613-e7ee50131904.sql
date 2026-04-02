ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system';

ALTER TABLE public.profiles ADD CONSTRAINT profiles_theme_preference_check CHECK (theme_preference IN ('light', 'system', 'dark'));