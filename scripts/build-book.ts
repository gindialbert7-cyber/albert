#!/usr/bin/env node
/**
 * scripts/build-book.ts
 *
 * Converts source material into a validated Albert .book.json file.
 * Supports three input modes:
 *
 *   --sefaria <ref>      Pull from the Sefaria public API (e.g. "Pirkei Avot")
 *   --epub    <file>     Parse a local .epub file
 *   --markdown <file>    Parse a local .md file (chapter breaks = ## headings)
 *
 * Output: {book-id}.book.json  (ready for upload-book.ts)
 *
 * Usage:
 *   npx ts-node scripts/build-book.ts --sefaria "Pirkei Avot" --id pirkei-avos --out ./books/
 *   npx ts-node scripts/build-book.ts --epub ./manuscript.epub --id my-book --out ./books/
 *   npx ts-node scripts/build-book.ts --markdown ./manuscript.md --id my-book --out ./books/
 *
 * Required flags:
 *   --id    <book-id>     kebab-case ID (must be unique in the catalog)
 *   --out   <dir>         output directory (created if absent)
 *
 * Optional:
 *   --title <string>      book title (overrides auto-detected)
 *   --author <string>     author name (overrides auto-detected)
 *   --dry-run             validate + preview; don't write file
 */

import fs   from 'fs';
import path from 'path';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag  = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const has   = (f: string) => args.includes(f);

const sefariaRef = flag('--sefaria');
const epubPath   = flag('--epub');
const mdPath     = flag('--markdown');
const bookId     = flag('--id');
const outDir     = flag('--out') ?? './books';
const titleArg   = flag('--title');
const authorArg  = flag('--author');
const dryRun     = has('--dry-run');

if (!bookId) { console.error('Error: --id is required'); process.exit(1); }
if (!sefariaRef && !epubPath && !mdPath) {
  console.error('Error: provide one of --sefaria, --epub, or --markdown');
  process.exit(1);
}

// ─── Types (minimal subset matching BookDocument in BookSchema.ts) ────────────

interface BookSection {
  type: string;
  content: string;
  heContent?: string;
  speaker?: string;
  level?: number;
}

interface BookChapter {
  id: string;
  title: string;
  hebrewTitle?: string;
  order: number;
  sections: BookSection[];
}

interface BookDocument {
  id: string;
  schemaVersion: number;
  title: string;
  hebrewTitle?: string;
  authors: Array<{ name: string; hebrew?: string; years?: string }>;
  category: string;
  language: 'hebrew' | 'english' | 'bilingual';
  description: string;
  tags: string[];
  requiresSub: boolean;
  chapters: BookChapter[];
}

// ─── Sefaria mode ─────────────────────────────────────────────────────────────

async function buildFromSefaria(ref: string): Promise<BookDocument> {
  console.log(`Fetching from Sefaria: ${ref}`);

  // Fetch the index to get structure
  const indexUrl = `https://www.sefaria.org/api/v2/index/${encodeURIComponent(ref)}`;
  const indexRes = await fetch(indexUrl);
  if (!indexRes.ok) throw new Error(`Sefaria index fetch failed: ${indexRes.status}`);
  const index = await indexRes.json() as any;

  const title     = (titleArg  ?? index.title)       || ref;
  const heTitle   = index.heTitle;
  const author    = authorArg ?? (index.authors?.[0] ?? '');

  // Fetch all sections
  const textUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}?version=english&version=he`;
  const textRes = await fetch(textUrl);
  if (!textRes.ok) throw new Error(`Sefaria text fetch failed: ${textRes.status}`);
  const textData = await textRes.json() as any;

  const heTexts = textData.versions?.find((v: any) => v.language === 'he')?.text ?? [];
  const enTexts = textData.versions?.find((v: any) => v.language === 'en')?.text ?? [];

  const chapters: BookChapter[] = [];

  const addChapter = (chIdx: number, heSections: string[], enSections: string[]) => {
    const sections: BookSection[] = [];
    const maxLen = Math.max(heSections.length, enSections.length);
    for (let i = 0; i < maxLen; i++) {
      const heText = heSections[i] ?? '';
      const enText = enSections[i] ?? '';
      if (heText) sections.push({ type: 'hebrew',  content: heText });
      if (enText) sections.push({ type: 'english', content: enText });
    }
    chapters.push({
      id:    `ch-${chIdx + 1}`,
      title: `Chapter ${chIdx + 1}`,
      order: chIdx,
      sections,
    });
  };

  // Handle flat (single chapter) vs nested (multi-chapter) structures
  if (Array.isArray(heTexts[0])) {
    heTexts.forEach((heCh: string[], i: number) => addChapter(i, heCh, enTexts[i] ?? []));
  } else {
    addChapter(0, heTexts as string[], enTexts as string[]);
  }

  return {
    id: bookId!,
    schemaVersion: 2,
    title,
    hebrewTitle: heTitle,
    authors: author ? [{ name: author }] : [],
    category: 'mussar',
    language: 'bilingual',
    description: index.enDesc ?? index.heDesc ?? '',
    tags: [title],
    requiresSub: false,
    chapters,
  };
}

// ─── Markdown mode ────────────────────────────────────────────────────────────

function buildFromMarkdown(filePath: string): BookDocument {
  console.log(`Parsing markdown: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  const title  = titleArg  ?? (lines.find(l => l.startsWith('# '))?.slice(2).trim() ?? bookId!);
  const author = authorArg ?? '';

  const chapters: BookChapter[] = [];
  let currentChapter: BookChapter | null = null;
  let order = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const chTitle = line.slice(3).trim();
      currentChapter = {
        id:    `ch-${++order}`,
        title: chTitle,
        order: order - 1,
        sections: [],
      };
      chapters.push(currentChapter);
    } else if (line.startsWith('# ')) {
      // top-level heading — skip, used as title
    } else if (line.trim() && currentChapter) {
      const section: BookSection = /[֐-׿]/.test(line)
        ? { type: 'hebrew',  content: line.trim() }
        : { type: 'english', content: line.trim() };
      currentChapter.sections.push(section);
    }
  }

  if (chapters.length === 0) {
    // No ## headings — treat whole file as one chapter
    chapters.push({
      id: 'ch-1', title: 'Main Text', order: 0,
      sections: lines
        .filter(l => l.trim() && !l.startsWith('#'))
        .map(l => ({ type: 'english', content: l.trim() })),
    });
  }

  return {
    id: bookId!,
    schemaVersion: 2,
    title,
    authors: author ? [{ name: author }] : [],
    category: 'mussar',
    language: 'english',
    description: '',
    tags: [title],
    requiresSub: false,
    chapters,
  };
}

// ─── EPUB mode ────────────────────────────────────────────────────────────────

function buildFromEpub(_filePath: string): BookDocument {
  console.error('EPUB parsing requires the "epub" npm package.');
  console.error('Install: npm install epub');
  console.error('Then re-run this script.');
  console.error('Alternatively, export as Markdown from Calibre/Sigil and use --markdown.');
  process.exit(1);
}

// ─── Validate ─────────────────────────────────────────────────────────────────

function validate(doc: BookDocument): string[] {
  const errors: string[] = [];
  if (!doc.id)    errors.push('Missing id');
  if (!doc.title) errors.push('Missing title');
  if (doc.chapters.length === 0) errors.push('No chapters');
  doc.chapters.forEach((ch, i) => {
    if (!ch.id)    errors.push(`Chapter ${i}: missing id`);
    if (!ch.title) errors.push(`Chapter ${i}: missing title`);
    if (ch.sections.length === 0) errors.push(`Chapter ${i} (${ch.title}): no sections`);
  });
  return errors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let doc: BookDocument;

  if (sefariaRef) {
    doc = await buildFromSefaria(sefariaRef);
  } else if (mdPath) {
    doc = buildFromMarkdown(mdPath);
  } else {
    doc = buildFromEpub(epubPath!);
  }

  const errors = validate(doc);
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(e => console.error(' •', e));
    process.exit(1);
  }

  console.log(`\nBook: ${doc.title}`);
  console.log(`Chapters: ${doc.chapters.length}`);
  const totalSections = doc.chapters.reduce((n, ch) => n + ch.sections.length, 0);
  console.log(`Sections: ${totalSections}`);

  if (dryRun) {
    console.log('\nDry run — file not written.');
    return;
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${bookId}.book.json`);
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf-8');
  console.log(`\nWritten to: ${outPath}`);
  console.log('Next: npx ts-node scripts/upload-book.ts', outPath, '--publish');
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
