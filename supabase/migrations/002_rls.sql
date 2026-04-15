-- ============================================================
-- Albert — Row Level Security Policies
-- Migration 002
-- ============================================================

-- ── profiles ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can only read/write their own profile
create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role can do anything (needed for webhook + admin operations)
create policy "profiles: service role all"
  on public.profiles for all
  using (auth.role() = 'service_role');

-- ── books ──────────────────────────────────────────────────────────────────────
alter table public.books enable row level security;

-- Anyone (including anon) can read published books
create policy "books: public read published"
  on public.books for select
  using (is_published = true);

-- Service role (admin / upload tool) can do everything
create policy "books: service role all"
  on public.books for all
  using (auth.role() = 'service_role');

-- ── chapters ──────────────────────────────────────────────────────────────────
alter table public.chapters enable row level security;

-- Published book chapters are public
create policy "chapters: public read"
  on public.chapters for select
  using (
    exists (
      select 1 from public.books b
      where b.id = book_id and b.is_published = true
    )
  );

-- Service role can do everything
create policy "chapters: service role all"
  on public.chapters for all
  using (auth.role() = 'service_role');
