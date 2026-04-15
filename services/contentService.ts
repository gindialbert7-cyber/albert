/**
 * contentService — Book content retrieval with Sefaria integration.
 *
 * Priority chain for each chapter:
 *   1. In-memory cache  (fastest — current session)
 *   2. Sefaria API      (real, authoritative text — cached 7 days in AsyncStorage)
 *   3. Bundled sample   (always works offline, covers key books)
 *   4. Empty fallback   (never crashes)
 */

import { SAMPLE_CONTENT, TextSection } from '@/constants/SampleText';
import { ALL_BOOKS } from '@/constants/Books';
import { getSefariaChapterRef } from '@/constants/SefariaRefs';
import { fetchSefariaRef, prefetchSefariaRefs } from './sefariaService';

export interface ChapterContent {
  chapterId:  string;
  title:      string;
  heTitle?:   string;
  sections:   TextSection[];
  pageCount:  number;
  fromSefaria: boolean;
  sefariaRef?: string;
  nextRef?:   string;
  prevRef?:   string;
}

export interface BookContent {
  bookId:    string;
  chapters:  ChapterContent[];
  fetchedAt: number;
}

// ── In-memory cache (current session) ────────────────────────────────────────
const _memCache = new Map<string, ChapterContent>();

function memKey(bookId: string, chapterIdx: number) {
  return `${bookId}::${chapterIdx}`;
}

// ── Default empty fallback ────────────────────────────────────────────────────
const EMPTY_SECTIONS: TextSection[] = [
  {
    type:    'heading',
    content: 'Loading…',
    verseRef: '',
  },
];

// ── Core fetch for a single chapter ──────────────────────────────────────────

async function fetchChapter(
  bookId:     string,
  chapterIdx: number,
  chapterId:  string,
  chapterTitle: string,
  pages:      number,
): Promise<ChapterContent> {
  const mk = memKey(bookId, chapterIdx);

  // 1. Memory hit
  const mem = _memCache.get(mk);
  if (mem) return mem;

  // 2. Try Sefaria
  const sefariaRef = getSefariaChapterRef(bookId, chapterIdx);
  if (sefariaRef) {
    const result = await fetchSefariaRef(sefariaRef);
    if (result && result.sections.length > 1) {
      const chapter: ChapterContent = {
        chapterId,
        title:       chapterTitle,
        sections:    result.sections,
        pageCount:   pages,
        fromSefaria: true,
        sefariaRef,
        nextRef:     result.next,
        prevRef:     result.prev,
      };
      _memCache.set(mk, chapter);
      return chapter;
    }
  }

  // 3. Bundled sample (uses per-book content if available, else 'default')
  const samples = SAMPLE_CONTENT[bookId] ?? SAMPLE_CONTENT['default'] ?? EMPTY_SECTIONS;
  const chapter: ChapterContent = {
    chapterId,
    title:       chapterTitle,
    sections:    samples,
    pageCount:   pages,
    fromSefaria: false,
  };
  _memCache.set(mk, chapter);
  return chapter;
}

// ── Public service ────────────────────────────────────────────────────────────

export const contentService = {

  /**
   * Get full content for a book — all chapters.
   * Fetches chapter 0 immediately; the rest are lazy.
   */
  getBookContent: async (bookId: string): Promise<BookContent> => {
    const book = ALL_BOOKS.find(b => b.id === bookId);
    const bookChapters = book?.chapters ?? [];

    if (bookChapters.length === 0) {
      // Single-chapter book
      const ch = await fetchChapter(bookId, 0, 'main', 'Content', 20);
      return { bookId, fetchedAt: Date.now(), chapters: [ch] };
    }

    // Fetch all chapters (memory + Sefaria cache hits are instant)
    const chapters = await Promise.all(
      bookChapters.map((ch, idx) =>
        fetchChapter(bookId, idx, ch.id, ch.title, ch.pages),
      ),
    );

    return { bookId, fetchedAt: Date.now(), chapters };
  },

  /**
   * Get content for a specific chapter by index (faster — only fetches that one).
   */
  getChapterByIndex: async (
    bookId:     string,
    chapterIdx: number,
  ): Promise<ChapterContent> => {
    const book = ALL_BOOKS.find(b => b.id === bookId);
    const ch   = book?.chapters?.[chapterIdx];
    return fetchChapter(
      bookId,
      chapterIdx,
      ch?.id    ?? `ch-${chapterIdx}`,
      ch?.title ?? `Chapter ${chapterIdx + 1}`,
      ch?.pages ?? 20,
    );
  },

  /**
   * Get content for a specific chapter by ID.
   */
  getChapterContent: async (bookId: string, chapterId: string): Promise<ChapterContent | null> => {
    const book = ALL_BOOKS.find(b => b.id === bookId);
    const idx  = book?.chapters?.findIndex(c => c.id === chapterId) ?? -1;
    if (idx === -1) return null;
    return contentService.getChapterByIndex(bookId, idx);
  },

  /**
   * Prefetch the first chapter of each book (warms Sefaria cache silently).
   */
  prefetchBooks: (bookIds: string[]): void => {
    const refs = bookIds.flatMap(id => {
      const ref = getSefariaChapterRef(id, 0);
      return ref ? [ref] : [];
    });
    prefetchSefariaRefs(refs);
  },

  /**
   * Prefetch the next N chapters for a book being read.
   */
  prefetchAheadChapters: (bookId: string, fromChapter: number, count = 3): void => {
    const book = ALL_BOOKS.find(b => b.id === bookId);
    const total = book?.chapters?.length ?? 0;
    const refs: string[] = [];
    for (let i = fromChapter + 1; i < Math.min(fromChapter + 1 + count, total); i++) {
      const ref = getSefariaChapterRef(bookId, i);
      if (ref) refs.push(ref);
    }
    prefetchSefariaRefs(refs);
  },

  /**
   * Invalidate a single chapter from memory (forces re-fetch).
   */
  invalidateChapter: (bookId: string, chapterIdx: number): void => {
    _memCache.delete(memKey(bookId, chapterIdx));
  },

  /**
   * Clear entire memory cache.
   */
  clearCache: (): void => {
    _memCache.clear();
  },

  isCached: (bookId: string): boolean => {
    return _memCache.has(memKey(bookId, 0));
  },
};
