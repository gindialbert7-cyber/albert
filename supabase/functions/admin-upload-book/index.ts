/**
 * supabase/functions/admin-upload-book/index.ts
 *
 * Admin-authenticated book upload via the web admin panel.
 * Accepts a validated BookDocument JSON, uploads chapter files to Storage,
 * and upserts books + chapters rows.
 *
 * Deployment:
 *   supabase functions deploy admin-upload-book
 *
 * Security: requires valid Supabase JWT + is_admin = true on the profile.
 *
 * Request body:
 *   { book: BookDocument, publish?: boolean }
 *
 * Response:
 *   { bookId, chaptersUploaded, storageBase } | { error: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inline minimal BookDocument type (no shared imports in Edge Functions)
interface BookSection {
  type: string;
  content?: string;
  heContent?: string;
  level?: number;
  verseRef?: string;
  audioId?: string;
}

interface BookChapter {
  id: string;
  title: string;
  hebrewTitle?: string;
  sefariaRef?: string;
  pageCount?: number;
  sections: BookSection[];
}

interface BookDocument {
  id: string;
  title: string;
  hebrewTitle?: string;
  subtitle?: string;
  description?: string;
  category: string;
  layoutMode: string;
  language: string;
  ageGroup: string;
  requiresSub: boolean;
  authors: object[];
  coverGradient?: string[];
  coverAccent?: string;
  tags: string[];
  chapters: BookChapter[];
}

function validateBook(doc: unknown): string | null {
  if (typeof doc !== 'object' || doc === null) return 'Root must be an object';
  const b = doc as Record<string, unknown>;
  for (const field of ['id', 'title', 'category', 'layoutMode', 'language']) {
    if (typeof b[field] !== 'string' || !(b[field] as string).trim()) {
      return `Missing required field: "${field}"`;
    }
  }
  if (!Array.isArray(b['chapters']) || (b['chapters'] as unknown[]).length === 0) {
    return 'chapters must be a non-empty array';
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return cors(null, 204);
  }
  if (req.method !== 'POST') {
    return cors(json({ error: 'Method not allowed' }, 405));
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return cors(json({ error: 'Unauthorized' }, 401));

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    },
  );

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return cors(json({ error: 'Unauthorized' }, 401));

  // ── Check admin ─────────────────────────────────────────────────────────────
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return cors(json({ error: 'Forbidden: admin only' }, 403));

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { book?: unknown; publish?: boolean };
  try {
    body = await req.json();
  } catch {
    return cors(json({ error: 'Invalid JSON body' }, 400));
  }

  const validErr = validateBook(body.book);
  if (validErr) return cors(json({ error: `Validation error: ${validErr}` }, 400));

  const book = body.book as BookDocument;
  const publish = body.publish === true;

  // ── Upload chapters to Storage ──────────────────────────────────────────────
  let chaptersUploaded = 0;

  for (let i = 0; i < book.chapters.length; i++) {
    const ch = book.chapters[i];
    const storagePath = `books/${book.id}/${ch.id}.json`;
    const chapterPayload = JSON.stringify({
      id: ch.id,
      title: ch.title,
      hebrewTitle: ch.hebrewTitle,
      sefariaRef: ch.sefariaRef,
      sections: ch.sections,
    });

    const { error: uploadErr } = await admin.storage
      .from('books')
      .upload(storagePath, new TextEncoder().encode(chapterPayload), {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadErr) {
      return cors(json({ error: `Storage upload failed for chapter "${ch.id}": ${uploadErr.message}` }, 500));
    }

    // Upsert chapter row
    const { error: chErr } = await admin.from('chapters').upsert({
      id:            `${book.id}-${ch.id}`,
      book_id:       book.id,
      chapter_index: i,
      chapter_id:    ch.id,
      title:         ch.title,
      hebrew_title:  ch.hebrewTitle ?? null,
      page_count:    ch.pageCount   ?? 0,
      storage_path:  storagePath,
      sefaria_ref:   ch.sefariaRef  ?? null,
    });

    if (chErr) {
      return cors(json({ error: `Chapter DB upsert failed for "${ch.id}": ${chErr.message}` }, 500));
    }

    chaptersUploaded++;
  }

  // ── Upsert book row ─────────────────────────────────────────────────────────
  const { error: bookErr } = await admin.from('books').upsert({
    id:             book.id,
    title:          book.title,
    hebrew_title:   book.hebrewTitle  ?? null,
    subtitle:       book.subtitle     ?? null,
    description:    book.description  ?? null,
    category:       book.category,
    layout_mode:    book.layoutMode,
    language:       book.language,
    age_group:      book.ageGroup,
    requires_sub:   book.requiresSub,
    cover_gradient: book.coverGradient ?? null,
    cover_accent:   book.coverAccent   ?? null,
    authors:        book.authors,
    total_chapters: book.chapters.length,
    total_pages:    book.chapters.reduce((s, c) => s + (c.pageCount ?? 0), 0),
    tags:           book.tags ?? [],
    is_published:   publish,
    storage_path:   `books/${book.id}`,
  });

  if (bookErr) return cors(json({ error: `Book DB upsert failed: ${bookErr.message}` }, 500));

  console.log(`[admin-upload-book] ${user.id} uploaded "${book.title}" (${chaptersUploaded} chapters, publish=${publish})`);

  return cors(json({
    bookId:           book.id,
    chaptersUploaded,
    storageBase:      `books/${book.id}`,
    published:        publish,
  }));
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cors(res: Response | null, status = 200): Response {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (res === null) return new Response(null, { status, headers });
  const newHeaders = new Headers(res.headers);
  Object.entries(headers).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(res.body, { status: res.status, headers: newHeaders });
}
