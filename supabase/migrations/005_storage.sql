-- ============================================================
-- Albert — Storage Buckets
-- Migration 005
-- ============================================================

-- Public bucket: book content JSON files + cover art
-- Path format: books/{book-id}/{chapter-id}.json
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'books',
  'books',
  true,   -- publicly readable (content is non-secret; auth gates happen at subscription check)
  52428800,  -- 50 MB per file (chapter JSON won't exceed ~2MB, this is headroom)
  array['application/json', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Private bucket: audio explainer mp3 files
-- Path format: audio/{book-id}/{clip-id}.mp3
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,  -- publicly readable after auth check at manifest level
  104857600, -- 100MB per file
  array['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
)
on conflict (id) do nothing;

-- ── Storage RLS ───────────────────────────────────────────────────────────────
-- Anyone can read book content (subscription gating in app, not at storage level)
create policy "books: public read"
  on storage.objects for select
  using (bucket_id = 'books');

-- Only service role (upload tool) can insert/update/delete book content
create policy "books: service write"
  on storage.objects for insert
  with check (bucket_id = 'books' and auth.role() = 'service_role');

create policy "books: service update"
  on storage.objects for update
  using (bucket_id = 'books' and auth.role() = 'service_role');

create policy "books: service delete"
  on storage.objects for delete
  using (bucket_id = 'books' and auth.role() = 'service_role');

-- Audio: same pattern
create policy "audio: public read"   on storage.objects for select using (bucket_id = 'audio');
create policy "audio: service write" on storage.objects for insert with check (bucket_id = 'audio' and auth.role() = 'service_role');
create policy "audio: service update" on storage.objects for update using (bucket_id = 'audio' and auth.role() = 'service_role');
create policy "audio: service delete" on storage.objects for delete using (bucket_id = 'audio' and auth.role() = 'service_role');
