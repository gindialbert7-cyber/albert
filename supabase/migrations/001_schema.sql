-- ============================================================
-- Albert — Core Schema
-- Migration 001: users, books, chapters
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for full-text search on books

-- ── User profiles ─────────────────────────────────────────────────────────────
-- Extends Supabase Auth; one row per auth.users entry.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  -- Subscription (synced from RevenueCat)
  subscription_tier  text not null default 'free'
    check (subscription_tier in ('free','monthly','annual','lifetime')),
  subscription_expires_at  timestamptz,
  is_trialing     boolean not null default false,
  -- Metadata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Book catalog ───────────────────────────────────────────────────────────────
create table if not exists public.books (
  id              text primary key,            -- matches Albert's Book.id (e.g. 'chumash-rashi')
  title           text not null,
  hebrew_title    text,
  subtitle        text,
  description     text,
  category        text not null,               -- torah | talmud | halacha | mussar | etc.
  layout_mode     text not null default 'bilingual',
  language        text not null default 'he-en',
  age_group       text not null default 'adult',
  requires_sub    boolean not null default true,
  -- Cover visuals
  cover_gradient  text[],                      -- e.g. ['#1A2744','#0F1A35']
  cover_accent    text,
  -- Authorship
  authors         jsonb not null default '[]', -- [{name, hebrewName, years}]
  -- Stats
  total_chapters  int not null default 0,
  total_pages     int not null default 0,
  -- Content source
  sefaria_ref     text,                        -- e.g. 'Genesis' (null if uploaded)
  storage_path    text,                        -- e.g. 'books/chumash-rashi/' (null if Sefaria-only)
  -- Catalog flags
  is_published    boolean not null default false,
  is_featured     boolean not null default false,
  sort_order      int not null default 0,
  tags            text[] default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Chapters ──────────────────────────────────────────────────────────────────
create table if not exists public.chapters (
  id              uuid primary key default gen_random_uuid(),
  book_id         text not null references public.books(id) on delete cascade,
  chapter_index   int not null,                -- 0-based position in book
  chapter_id      text not null,               -- matches Albert's Chapter.id
  title           text not null,
  hebrew_title    text,
  page_count      int not null default 20,
  -- Storage: either a CDN path (uploaded) or Sefaria ref
  storage_path    text,                        -- 'books/chumash-rashi/ch-0.json'
  sefaria_ref     text,                        -- 'Genesis.1'
  -- Content cache (optional: store the JSON inline for small chapters)
  content_json    jsonb,                       -- TextSection[] — set by upload tool
  content_hash    text,                        -- SHA-256 of content_json for cache busting
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(book_id, chapter_index),
  unique(book_id, chapter_id)
);

create index if not exists idx_chapters_book_id on public.chapters(book_id);
create index if not exists idx_books_category on public.books(category);
create index if not exists idx_books_published on public.books(is_published);
create index if not exists idx_books_search on public.books using gin(to_tsvector('english', title || ' ' || coalesce(description,'')));

-- ── Updated_at triggers ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_books_updated_at before update on public.books
  for each row execute function public.set_updated_at();
create trigger set_chapters_updated_at before update on public.chapters
  for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
