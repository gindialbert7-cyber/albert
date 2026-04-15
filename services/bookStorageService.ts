/**
 * services/bookStorageService.ts
 *
 * Fetches chapter content from Supabase Storage CDN.
 *
 * Each chapter is stored at: books/{bookId}/{chapterId}.json
 * Files are in the public `books` bucket (no auth needed to read).
 *
 * Caches in AsyncStorage with a 7-day TTL (same as Sefaria cache).
 * Memory-level cache is handled by contentService.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { TextSection } from '@/constants/SampleText';

// ── Cache config ───────────────────────────────────────────────────────────────

const CACHE_TTL_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_PREFIX  = 'albert:bookcdn:';

interface CacheEntry {
  sections:   TextSection[];
  title:      string;
  heTitle?:   string;
  sefariaRef?: string;
  cachedAt:   number;
}

function cacheKey(bookId: string, chapterId: string): string {
  return `${CACHE_PREFIX}${bookId}:${chapterId}`;
}

async function readCache(bookId: string, chapterId: string): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(bookId, chapterId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(bookId: string, chapterId: string, entry: CacheEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(bookId, chapterId), JSON.stringify(entry));
  } catch {}
}

// ── Chapter JSON shape (as stored in Supabase Storage) ────────────────────────

interface StoredChapter {
  id:          string;
  title:       string;
  hebrewTitle?: string;
  sefariaRef?: string;
  sections:    TextSection[];
}

// ── Core fetch ─────────────────────────────────────────────────────────────────

/**
 * Fetch a chapter's content from Supabase Storage CDN.
 * Returns null if the chapter doesn't exist in storage (fall through to Sefaria).
 */
export async function fetchChapterFromStorage(
  bookId:    string,
  chapterId: string,
): Promise<CacheEntry | null> {
  // 1. Check AsyncStorage cache
  const cached = await readCache(bookId, chapterId);
  if (cached) return cached;

  // 2. Get CDN URL from Supabase client
  const storagePath = `books/${bookId}/${chapterId}.json`;
  const { data: urlData } = supabase.storage
    .from('books')
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) return null;

  // 3. Fetch from CDN
  try {
    const resp = await fetch(urlData.publicUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!resp.ok) {
      // 404 = chapter not in storage yet (will fall through to Sefaria)
      if (resp.status === 404) return null;
      throw new Error(`Storage CDN returned ${resp.status}`);
    }

    const stored: StoredChapter = await resp.json();

    if (!Array.isArray(stored.sections) || stored.sections.length === 0) {
      return null;
    }

    const entry: CacheEntry = {
      sections:   stored.sections,
      title:      stored.title,
      heTitle:    stored.hebrewTitle,
      sefariaRef: stored.sefariaRef,
      cachedAt:   Date.now(),
    };

    await writeCache(bookId, chapterId, entry);
    return entry;

  } catch {
    return null;
  }
}

/**
 * Invalidate the AsyncStorage cache for a specific chapter
 * (call after re-uploading chapter content).
 */
export async function invalidateChapterCache(bookId: string, chapterId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(cacheKey(bookId, chapterId));
  } catch {}
}

/**
 * Pre-warm the CDN cache for a list of chapters (fire-and-forget).
 */
export function prefetchChapters(bookId: string, chapterIds: string[]): void {
  for (const chapterId of chapterIds) {
    fetchChapterFromStorage(bookId, chapterId).catch(() => {});
  }
}
