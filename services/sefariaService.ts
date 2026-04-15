/**
 * sefariaService — fetches Jewish texts from the Sefaria open API.
 *
 * Sefaria API: https://www.sefaria.org/api/texts/{ref}
 * No API key required. Sefaria asks you to cache aggressively — we do.
 *
 * Flow:
 *   1. Check AsyncStorage cache (24-hour TTL)
 *   2. Fetch from Sefaria if not cached / stale
 *   3. Transform response → TextSection[] (Albert's reader format)
 *   4. Store in cache
 *
 * Handles all Sefaria text shapes:
 *   - Simple string
 *   - string[] (paragraphs or verses in a chapter)
 *   - string[][] (Talmud: outer = amud, inner = paragraphs)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextSection } from '@/constants/SampleText';

const SEFARIA_API  = 'https://www.sefaria.org/api/texts';
const CACHE_PREFIX = 'albert-sefaria-v2-';
const TTL_MS       = 7 * 24 * 60 * 60 * 1000; // 7 days
const TIMEOUT_MS   = 12_000;

// ── Sefaria response types ────────────────────────────────────────────────────

interface SefariaResponse {
  ref:           string;
  heRef:         string;
  text:          SefariaText;
  he:            SefariaText;
  next?:         string;
  prev?:         string;
  book:          string;
  categories:    string[];
  sections:      number[];
  toSections:    number[];
  type?:         string;
  commentary?:   SefariaCommentary[];
}

type SefariaText = string | string[] | string[][];

interface SefariaCommentary {
  ref:   string;
  heRef: string;
  text:  SefariaText;
  he:    SefariaText;
  collectiveTitle?: string;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

interface CacheEntry {
  sections: TextSection[];
  heRef:    string;
  next?:    string;
  prev?:    string;
  savedAt:  number;
}

async function readCache(ref: string): Promise<CacheEntry | null> {
  try {
    const key  = CACHE_PREFIX + encodeRef(ref);
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;
    const entry: CacheEntry = JSON.parse(json);
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(ref: string, entry: CacheEntry): Promise<void> {
  try {
    const key = CACHE_PREFIX + encodeRef(ref);
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

function encodeRef(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
}

// ── Fetch with timeout ────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

// ── Text flattening ───────────────────────────────────────────────────────────

/**
 * Flatten any Sefaria text shape into a flat string[].
 * Strips HTML tags sefaria sometimes includes.
 */
function flattenText(raw: SefariaText): string[] {
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  if (typeof raw === 'string') {
    return raw ? [strip(raw)] : [];
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    if (typeof raw[0] === 'string') {
      return (raw as string[]).map(strip).filter(Boolean);
    }
    // 2D array — Talmud amud structure; flatten all inner arrays
    return (raw as string[][]).flat().map(strip).filter(Boolean);
  }
  return [];
}

// ── Transform → TextSection[] ────────────────────────────────────────────────

function transformToSections(
  resp:         SefariaResponse,
  commentary?:  SefariaCommentary[],
): TextSection[] {
  const englishLines = flattenText(resp.text);
  const hebrewLines  = flattenText(resp.he);
  const maxLines     = Math.max(englishLines.length, hebrewLines.length);
  const sections:    TextSection[] = [];
  const isVerseText  = resp.categories?.includes('Tanakh') || resp.categories?.includes('Mishnah');
  const isTalmud     = resp.categories?.includes('Talmud');

  // Section heading
  sections.push({
    type:     'heading',
    content:  resp.ref,
    verseRef: resp.heRef,
  });

  if (maxLines === 0) {
    sections.push({ type: 'english', content: 'Text not available. Open on sefaria.org.', verseRef: '' });
    return sections;
  }

  for (let i = 0; i < maxLines; i++) {
    const heb = hebrewLines[i]  ?? '';
    const eng = englishLines[i] ?? '';

    // Build verse reference label
    const verseNum = resp.sections.length > 0
      ? `${resp.sections[0]}:${i + 1}`
      : `${i + 1}`;

    if (heb) {
      sections.push({
        type:     'hebrew',
        content:  heb,
        verseRef: isVerseText ? verseNum : undefined,
      });
    }

    if (eng) {
      sections.push({
        type:     'english',
        content:  eng,
        verseRef: isVerseText ? verseNum : undefined,
      });
    }

    // Add Rashi / commentary for this verse if available
    if (commentary) {
      const verseCommentary = commentary.filter(c => {
        const parts = c.ref.split(':');
        return parts[parts.length - 1] === `${i + 1}` ||
               c.ref.includes(` ${i + 1}-`) ||
               c.ref.endsWith(`:${i + 1}`);
      });
      for (const c of verseCommentary.slice(0, 1)) {
        const comEng = flattenText(c.text)[0];
        if (comEng && c.collectiveTitle) {
          sections.push({
            type:    'commentary',
            content: `${c.collectiveTitle}: ${comEng}`,
          });
        }
      }
    }

    // Divider every verse (Tanakh/Mishnah) or every 2 paragraphs (other)
    const divEvery = isVerseText || isTalmud ? 1 : 2;
    if ((i + 1) % divEvery === 0 && i < maxLines - 1) {
      sections.push({ type: 'divider', content: '' });
    }
  }

  return sections;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SefariaResult {
  sections: TextSection[];
  heRef:    string;
  next?:    string;
  prev?:    string;
  fromCache: boolean;
}

/**
 * Fetch a single Sefaria ref (e.g. "Pirkei Avot.1") and return TextSections.
 * Caches for 7 days. Returns null on network error (caller falls back to local).
 */
export async function fetchSefariaRef(ref: string): Promise<SefariaResult | null> {
  // 1. Cache hit
  const cached = await readCache(ref);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // 2. Fetch from Sefaria
  try {
    const url  = `${SEFARIA_API}/${encodeURIComponent(ref)}?commentary=1&context=0`;
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) return null;

    const data: SefariaResponse = await resp.json();
    if (!data || !data.ref) return null;

    const sections  = transformToSections(data, data.commentary);
    const entry: CacheEntry = {
      sections,
      heRef:   data.heRef ?? ref,
      next:    data.next,
      prev:    data.prev,
      savedAt: Date.now(),
    };

    await writeCache(ref, entry);
    return { ...entry, fromCache: false };
  } catch {
    return null;
  }
}

/**
 * Fetch multiple refs in parallel (e.g. all chapters of a book).
 * Returns results in order, with null for any that failed.
 */
export async function fetchSefariaRefs(refs: string[]): Promise<(SefariaResult | null)[]> {
  return Promise.all(refs.map(r => fetchSefariaRef(r)));
}

/**
 * Pre-warm the cache for a list of refs (fire and forget).
 */
export function prefetchSefariaRefs(refs: string[]): void {
  refs.forEach(r => fetchSefariaRef(r).catch(() => {}));
}

/**
 * Clear all cached Sefaria content.
 */
export async function clearSefariaCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toDelete = keys.filter(k => k.startsWith(CACHE_PREFIX));
    if (toDelete.length > 0) await AsyncStorage.multiRemove(toDelete);
  } catch {}
}

/**
 * Return estimated cache size in number of entries.
 */
export async function getSefariaCache(): Promise<{ entries: number; refs: string[] }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sefariaKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    return {
      entries: sefariaKeys.length,
      refs:    sefariaKeys.map(k => k.replace(CACHE_PREFIX, '')),
    };
  } catch {
    return { entries: 0, refs: [] };
  }
}
