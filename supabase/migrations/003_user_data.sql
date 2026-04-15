-- ============================================================
-- Albert — User Reading Data
-- Migration 003: positions, bookmarks, highlights, word_notes
-- ============================================================

-- ── Reading positions ──────────────────────────────────────────────────────────
create table if not exists public.reading_positions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         text not null,
  chapter_id      text not null,
  chapter_index   int not null default 0,
  scroll_y        real not null default 0,
  progress        real not null default 0 check (progress between 0 and 1),
  updated_at      timestamptz not null default now(),
  unique(user_id, book_id)             -- one position per book per user
);

-- ── Bookmarks ─────────────────────────────────────────────────────────────────
create table if not exists public.bookmarks (
  id              uuid primary key,    -- app-generated; matches local store id
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         text not null,
  book_title      text,
  chapter_id      text not null,
  chapter_title   text,
  page            int not null default 1,
  excerpt         text,
  note            text,
  created_at      timestamptz not null default now()
);

-- ── Highlights ────────────────────────────────────────────────────────────────
create table if not exists public.highlights (
  id              uuid primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         text not null,
  book_title      text,
  chapter_id      text not null,
  chapter_title   text,
  section_index   int not null,
  text            text not null,
  color           text not null,
  note            text,
  created_at      timestamptz not null default now()
);

-- ── Word notes ────────────────────────────────────────────────────────────────
create table if not exists public.word_notes (
  id              uuid primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         text not null,
  book_title      text,
  chapter_id      text not null,
  chapter_title   text,
  section_index   int not null,
  word_start      int not null default -1,
  word_end        int not null default -1,
  selected_text   text not null,
  note_text       text not null default '',
  color           text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes for efficient per-user lookups
create index idx_positions_user  on public.reading_positions(user_id);
create index idx_bookmarks_user  on public.bookmarks(user_id);
create index idx_highlights_user on public.highlights(user_id);
create index idx_word_notes_user on public.word_notes(user_id);
create index idx_highlights_book on public.highlights(user_id, book_id);
create index idx_word_notes_book on public.word_notes(user_id, book_id);

-- Updated_at trigger for word_notes
create trigger set_word_notes_updated_at before update on public.word_notes
  for each row execute function public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.reading_positions enable row level security;
alter table public.bookmarks         enable row level security;
alter table public.highlights        enable row level security;
alter table public.word_notes        enable row level security;

-- Reading positions
create policy "positions: own"  on public.reading_positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Bookmarks
create policy "bookmarks: own"  on public.bookmarks         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Highlights
create policy "highlights: own" on public.highlights        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Word notes
create policy "word_notes: own" on public.word_notes        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Service role bypass for all user data tables
create policy "positions: service"  on public.reading_positions for all using (auth.role() = 'service_role');
create policy "bookmarks: service"  on public.bookmarks         for all using (auth.role() = 'service_role');
create policy "highlights: service" on public.highlights        for all using (auth.role() = 'service_role');
create policy "word_notes: service" on public.word_notes        for all using (auth.role() = 'service_role');
