/**
 * constants/BookSchema.ts
 *
 * TypeScript interfaces for the canonical Albert Book JSON format.
 *
 * A book is authored as a single JSON file named `{book-id}.book.json`.
 * The upload script (scripts/upload-book.ts) validates against this schema,
 * then splits content per chapter and uploads to Supabase Storage.
 *
 * On-device, each chapter is fetched individually from CDN to keep payloads small.
 */

// ── Section types ─────────────────────────────────────────────────────────────
//
// v1 kinds: original Albert schema.
// v2 kinds: April 2026 Bereshit Press brief — added for richer reader layouts
// (Mishnah with mefarshim, Gemara Vilna / immersive, Tanakh with verse-lock).
//
// The extension is purely additive. Every existing BookDocument keeps
// rendering; when the reader encounters an unknown kind it falls back
// to the v1 renderer (see reader components).

export type SectionType =
  // v1 — unchanged
  | 'heading'         // Section / chapter heading
  | 'hebrew'          // RTL Hebrew text (can contain nikud / teamim)
  | 'english'         // LTR English translation or commentary
  | 'commentary'      // Indented explanation / drash
  | 'divider'         // Visual break between ideas
  // v2 — richer kinds
  | 'mishnah'         // Elevated weight, own rhythm — 28/46 Hebrew body
  | 'gemara'          // Aramaic body — 24/40
  | 'rashi'           // Rendered in Rashi semi-cursive
  | 'tosfos'          // Labeled commentary block (Tosafos)
  | 'mefaresh'        // Generic commentator; REQUIRES `speaker`
  | 'pasuk'           // Tanakh verse; `verseRef` renders as gold gematria
  | 'parsha-marker'   // Inline פ / ס
  | 'aliyah'          // Aliyah bar marker
  | 'perek-open';     // Ceremonial chapter opener

/** v2 verse reference — used for pasuk and mishnah blocks. */
export interface VerseRef {
  chapter: number;
  verse:   number;
  /** Optional pre-rendered gematria e.g. "א׳", "כ״ג" */
  gematria?: string;
}

export interface BookSection {
  /** v1: use `type`. v2: same field; new kinds are additive. */
  type:       SectionType;
  /** Stable ID within a chapter — needed for ambient-mefaresh auto-scroll */
  id?:        string;
  /** Main text (omit for dividers / perek-open / parsha-marker) */
  content?:   string;
  /** Hebrew heading text shown alongside English heading */
  heContent?: string;
  /** Aligned English translation — enables verse-lock dual layout */
  translation?: string;
  /** Heading level — only used when type === 'heading' */
  level?:     1 | 2 | 3;
  /** Sefaria canonical reference e.g. "Bereshit 1:1" */
  verseRef?:  string;
  /** Structured verse reference for v2 pasuk / mishnah blocks */
  verse?:     VerseRef;
  /** Audio clip ID — references a clip in the book-level audio manifest */
  audioId?:   string;
  /** [startSec, endSec] range within the chapter audio for shiur sync */
  audioRange?:[number, number];
  /** Speaker / source attribution — REQUIRED for type==='mefaresh' */
  speaker?:   string;
  /** Short phrases this block comments on (for anchor highlighting) */
  anchors?:   string[];
}

// ── v2 reader layout hint ─────────────────────────────────────────────────────

export type ReaderLayoutMode =
  | 'immersive'    // linear flow with ambient mefaresh
  | 'vilna'        // faithful three-zone Talmud wrap
  | 'translation'  // verse-locked Hebrew + English
  | 'hebrew-only'  // full-page RTL
  | 'sefer';       // generic long-form (mussar, chasidus, modern)

export interface ReaderLayout {
  mode:             ReaderLayoutMode;
  /** Which commentator auto-tracks the current position in ambient mode */
  ambientMefaresh?: string;
  /** Whether Hebrew and English share a baseline grid */
  verseLocked?:     boolean;
}

// ── Chapter ───────────────────────────────────────────────────────────────────

export interface BookChapter {
  /** Slug-style ID — stable, used as storage path segment. e.g. "ch-01" */
  id:           string;
  /** Human-readable title for chapter nav */
  title:        string;
  /** Hebrew title (optional) */
  hebrewTitle?: string;
  /** Sefaria ref for the entire chapter (fallback fetch) e.g. "Bereshit.1" */
  sefariaRef?:  string;
  /** Approximate page count (for progress bar calculation in reader) */
  pageCount:    number;
  sections:     BookSection[];
}

// ── Author ────────────────────────────────────────────────────────────────────

export interface BookAuthor {
  name:          string;
  hebrewName?:   string;
  role?:         string;   // e.g. "Author", "Translator", "Editor"
  period?:       string;   // e.g. "Rishonim", "Acharonim", "Modern"
  bio?:          string;
}

// ── Root book document ────────────────────────────────────────────────────────

export interface BookDocument {
  /** Must match the books.id PK in the database */
  id:             string;
  title:          string;
  hebrewTitle?:   string;
  subtitle?:      string;
  description?:   string;
  /** Maps to books.category — used for library grouping */
  category:       string;
  /**
   * Reader layout hint:
   *   'side-by-side' — dual column Hebrew + English
   *   'interleaved'  — alternating Hebrew / English rows
   *   'translation'  — English only
   *   'hebrew'       — Hebrew only
   */
  layoutMode:     'side-by-side' | 'interleaved' | 'translation' | 'hebrew';
  language:       'he' | 'en' | 'bilingual';
  ageGroup:       'all' | 'adult' | 'youth';
  requiresSub:    boolean;
  authors:        BookAuthor[];
  /** Two hex colour strings for the library card gradient */
  coverGradient?: [string, string];
  /** Single hex accent colour */
  coverAccent?:   string;
  tags:           string[];
  chapters:       BookChapter[];
}

// ── Validation helpers ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid:    boolean;
  errors:   string[];
  warnings: string[];
}

export function validateBookDocument(doc: unknown): ValidationResult {
  const errors:   string[] = [];
  const warnings: string[] = [];

  if (typeof doc !== 'object' || doc === null) {
    return { valid: false, errors: ['Root must be a JSON object'], warnings };
  }

  const b = doc as Record<string, unknown>;

  // Required string fields
  for (const field of ['id', 'title', 'category', 'layoutMode', 'language', 'ageGroup'] as const) {
    if (typeof b[field] !== 'string' || !(b[field] as string).trim()) {
      errors.push(`Missing or empty required field: "${field}"`);
    }
  }

  if (typeof b['requiresSub'] !== 'boolean') {
    errors.push('requiresSub must be a boolean');
  }

  if (!Array.isArray(b['chapters'])) {
    errors.push('chapters must be an array');
  } else if ((b['chapters'] as unknown[]).length === 0) {
    errors.push('Book must have at least one chapter');
  } else {
    const chapters = b['chapters'] as unknown[];
    const chapterIds = new Set<string>();
    chapters.forEach((ch, i) => {
      if (typeof ch !== 'object' || ch === null) {
        errors.push(`chapters[${i}] must be an object`);
        return;
      }
      const c = ch as Record<string, unknown>;
      if (typeof c['id'] !== 'string' || !c['id']) errors.push(`chapters[${i}].id is required`);
      if (typeof c['title'] !== 'string' || !c['title']) errors.push(`chapters[${i}].title is required`);
      if (typeof c['id'] === 'string') {
        if (chapterIds.has(c['id'] as string)) {
          errors.push(`Duplicate chapter id: "${c['id']}"`);
        }
        chapterIds.add(c['id'] as string);
      }
      if (!Array.isArray(c['sections'])) {
        errors.push(`chapters[${i}].sections must be an array`);
      } else if ((c['sections'] as unknown[]).length === 0) {
        warnings.push(`chapters[${i}] ("${c['id']}") has no sections`);
      } else {
        (c['sections'] as unknown[]).forEach((sec, si) => {
          if (typeof sec !== 'object' || sec === null) {
            errors.push(`chapters[${i}].sections[${si}] must be an object`);
            return;
          }
          const s = sec as Record<string, unknown>;
          const validTypes: SectionType[] = [
            // v1
            'heading', 'hebrew', 'english', 'commentary', 'divider',
            // v2
            'mishnah', 'gemara', 'rashi', 'tosfos', 'mefaresh',
            'pasuk', 'parsha-marker', 'aliyah', 'perek-open',
          ];
          if (!validTypes.includes(s['type'] as SectionType)) {
            errors.push(`chapters[${i}].sections[${si}].type must be one of: ${validTypes.join(', ')}`);
          }
          // mefaresh requires a speaker
          if (s['type'] === 'mefaresh' && !s['speaker']) {
            errors.push(`chapters[${i}].sections[${si}] (type=mefaresh) requires a 'speaker' field`);
          }
          const contentless = ['divider', 'perek-open', 'parsha-marker', 'aliyah'];
          if (!contentless.includes(s['type'] as string) && typeof s['content'] !== 'string') {
            warnings.push(`chapters[${i}].sections[${si}] has no content`);
          }
        });
      }
    });
  }

  if (!Array.isArray(b['authors'])) {
    warnings.push('authors field is missing — consider adding author metadata');
  }

  if (!Array.isArray(b['tags'])) {
    warnings.push('tags field is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
