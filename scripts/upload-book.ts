#!/usr/bin/env node
/**
 * scripts/upload-book.ts
 *
 * Uploads a validated .book.json file to Supabase:
 *   1. Validates the JSON against BookDocument schema
 *   2. Upserts the books row (metadata)
 *   3. Uploads each chapter's content JSON to Storage: books/{book-id}/{chapter-id}.json
 *   4. Upserts the chapters rows (metadata + storage_path)
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 * Never use the anon key here — we need service role to bypass RLS.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx ts-node scripts/upload-book.ts path/to/my-book.book.json [--publish]
 *
 * Flags:
 *   --publish   Mark the book as is_published=true after upload (default: false)
 *   --dry-run   Validate and print what would be uploaded without touching Supabase
 */

import fs   from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { validateBookDocument, BookDocument, BookChapter } from '../constants/BookSchema';

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const filePath  = args.find(a => !a.startsWith('--'));
const publish   = args.includes('--publish');
const dryRun    = args.includes('--dry-run');

if (!filePath) {
  console.error('Usage: upload-book.ts <file.book.json> [--publish] [--dry-run]');
  process.exit(1);
}

// ─── Env ──────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env['SUPABASE_URL'];
const SERVICE_ROLE_KEY  = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!dryRun && (!SUPABASE_URL || !SERVICE_ROLE_KEY)) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('  export SUPABASE_URL=https://yourproject.supabase.co');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

// ─── Supabase (service role) ──────────────────────────────────────────────────

const supabase = dryRun ? null : createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

// ─── Load + validate ──────────────────────────────────────────────────────────

const abs = path.resolve(filePath);
console.log(`\n📖 Loading: ${path.basename(abs)}`);

let doc: BookDocument;
try {
  const raw = fs.readFileSync(abs, 'utf-8');
  const parsed = JSON.parse(raw);
  const result = validateBookDocument(parsed);

  if (!result.valid) {
    console.error(`\n✗ Validation failed:`);
    result.errors.forEach(e => console.error(`   • ${e}`));
    process.exit(1);
  }
  result.warnings.forEach(w => console.warn(`⚠  ${w}`));
  doc = parsed as BookDocument;
} catch (e: any) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}

console.log(`✓ Validated: "${doc.title}" — ${doc.chapters.length} chapter(s)`);
if (dryRun) console.log('\n[DRY RUN] — no changes will be made to Supabase.\n');

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function uploadChapterJson(bookId: string, chapterId: string, chapter: BookChapter): Promise<string> {
  const storagePath = `books/${bookId}/${chapterId}.json`;
  const json = JSON.stringify({
    id:          chapter.id,
    title:       chapter.title,
    hebrewTitle: chapter.hebrewTitle,
    sefariaRef:  chapter.sefariaRef,
    sections:    chapter.sections,
  }, null, 0); // compact JSON saves CDN bandwidth

  const { error } = await supabase!.storage
    .from('books')
    .upload(storagePath, Buffer.from(json, 'utf-8'), {
      contentType:  'application/json',
      upsert:       true,
    });

  if (error) throw new Error(`Storage upload failed for ${chapterId}: ${error.message}`);
  return storagePath;
}

// ─── Main upload flow ─────────────────────────────────────────────────────────

async function run() {
  // ── 1. Upsert books row ──────────────────────────────────────────────────
  const bookRow = {
    id:              doc.id,
    title:           doc.title,
    hebrew_title:    doc.hebrewTitle   ?? null,
    subtitle:        doc.subtitle      ?? null,
    description:     doc.description   ?? null,
    category:        doc.category,
    layout_mode:     doc.layoutMode,
    language:        doc.language,
    age_group:       doc.ageGroup,
    requires_sub:    doc.requiresSub,
    cover_gradient:  doc.coverGradient ?? null,
    cover_accent:    doc.coverAccent   ?? null,
    authors:         doc.authors,
    total_chapters:  doc.chapters.length,
    total_pages:     doc.chapters.reduce((s, c) => s + (c.pageCount ?? 0), 0),
    tags:            doc.tags ?? [],
    is_published:    publish,
    storage_path:    `books/${doc.id}`,
  };

  if (dryRun) {
    console.log('\n── Would upsert books row:');
    console.log(JSON.stringify(bookRow, null, 2));
  } else {
    console.log('\n── Upserting book metadata…');
    const { error } = await supabase!.from('books').upsert(bookRow);
    if (error) { console.error(`✗ books upsert: ${error.message}`); process.exit(1); }
    console.log(`  ✓ books row upserted`);
  }

  // ── 2. Upload chapters ────────────────────────────────────────────────────
  console.log('\n── Uploading chapters…');

  for (let i = 0; i < doc.chapters.length; i++) {
    const ch = doc.chapters[i]!;
    const storagePath = `books/${doc.id}/${ch.id}.json`;

    if (dryRun) {
      console.log(`  [dry] ${storagePath}  (${ch.sections.length} sections)`);
      continue;
    }

    // Upload JSON to storage
    try {
      await uploadChapterJson(doc.id, ch.id, ch);
    } catch (e: any) {
      console.error(`  ✗ ${e.message}`);
      process.exit(1);
    }

    // Upsert chapters row
    const chRow = {
      id:            `${doc.id}-${ch.id}`,
      book_id:       doc.id,
      chapter_index: i,
      chapter_id:    ch.id,
      title:         ch.title,
      hebrew_title:  ch.hebrewTitle ?? null,
      page_count:    ch.pageCount   ?? 0,
      storage_path:  storagePath,
      sefaria_ref:   ch.sefariaRef  ?? null,
    };

    const { error: chErr } = await supabase!.from('chapters').upsert(chRow);
    if (chErr) { console.error(`  ✗ chapters upsert (${ch.id}): ${chErr.message}`); process.exit(1); }

    const sectionCount = ch.sections.length;
    process.stdout.write(`  ✓ [${i + 1}/${doc.chapters.length}] ${ch.id}  (${sectionCount} sections)\n`);
  }

  // ── 3. Done ───────────────────────────────────────────────────────────────
  if (dryRun) {
    console.log('\n[DRY RUN] ✓ Everything looks good. Remove --dry-run to execute.\n');
  } else {
    const published = publish ? '  📢 Book marked as PUBLISHED.' : '  ℹ️  Book saved as DRAFT (use --publish to make it live).';
    console.log(`\n✓ Upload complete!\n${published}`);
    console.log(`  URL: ${SUPABASE_URL}/storage/v1/object/public/books/${doc.id}/\n`);
  }
}

run().catch(e => {
  console.error('\n✗ Unexpected error:', e?.message ?? e);
  process.exit(1);
});
