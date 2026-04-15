-- =============================================================================
-- Migration 007: Admin management tables
-- app_settings (key-value feature flags + config)
-- push_notifications (history of sent notifications)
-- push_tokens (device tokens for server-side push)
-- audio_clips (per-book audio manifest rows)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- app_settings — global key/value config editable from admin UI
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('hero_book_id',         '"siddur"'::jsonb),
  ('feature_premium',      'true'::jsonb),
  ('feature_audio',        'true'::jsonb),
  ('feature_highlights',   'true'::jsonb),
  ('feature_word_notes',   'true'::jsonb),
  ('feature_promo_codes',  'true'::jsonb),
  ('motd',                 'null'::jsonb),
  ('motd_title',           'null'::jsonb),
  ('min_app_version',      '"1.0.0"'::jsonb),
  ('maintenance_mode',     'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings: public read"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "app_settings: admin write"
  ON public.app_settings FOR ALL
  USING (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- push_tokens — one row per (user, device) pair
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens: own read/write"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "push_tokens: admin read"
  ON public.push_tokens FOR SELECT
  USING (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- push_notifications — history of every broadcast sent from admin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  data         JSONB,
  audience     TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'free', 'premium', 'trialing')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_count INT NOT NULL DEFAULT 0,
  success_count   INT NOT NULL DEFAULT 0,
  error_count     INT NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'done', 'error'))
);

CREATE INDEX IF NOT EXISTS push_notifications_sent_at_idx ON public.push_notifications(sent_at DESC);

ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_notifications: admin all"
  ON public.push_notifications FOR ALL
  USING (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- audio_clips — per-book audio manifest (replaces static CDN JSON files)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audio_clips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  clip_id     TEXT NOT NULL,          -- matches chapter/section identifier
  title       TEXT NOT NULL,
  duration_s  INT,                    -- seconds (optional)
  storage_path TEXT NOT NULL,         -- path inside 'audio' bucket: {bookId}/{clipId}.mp3
  sort_order  INT NOT NULL DEFAULT 0,
  is_premium  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, clip_id)
);

CREATE INDEX IF NOT EXISTS audio_clips_book_id_idx ON public.audio_clips(book_id, sort_order);

ALTER TABLE public.audio_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audio_clips: public read published"
  ON public.audio_clips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.books WHERE id = book_id AND is_published = true
    )
  );

CREATE POLICY "audio_clips: admin all"
  ON public.audio_clips FOR ALL
  USING (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket: audio
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "audio: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

CREATE POLICY "audio: admin write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio' AND public.is_current_user_admin());

CREATE POLICY "audio: admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'audio' AND public.is_current_user_admin());

CREATE POLICY "audio: admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio' AND public.is_current_user_admin());
