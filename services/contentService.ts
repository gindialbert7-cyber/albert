/**
 * Content Service
 *
 * Abstracts book content retrieval. Currently returns bundled local data,
 * but the interface is designed to swap in remote API calls with caching.
 *
 * Caching strategy (future):
 *   1. Check in-memory cache (fastest)
 *   2. Check AsyncStorage cache (fast, persists offline)
 *   3. Fetch from API (slow, requires network)
 *   4. Fall back to bundled data (always works)
 */

import { SAMPLE_CONTENT, TextSection } from '@/constants/SampleText';
import { ALL_BOOKS, Book } from '@/constants/Books';

export interface ChapterContent {
  chapterId: string;
  title:     string;
  sections:  TextSection[];
  pageCount: number;
}

export interface BookContent {
  bookId:   string;
  chapters: ChapterContent[];
  fetchedAt:number; // timestamp for cache invalidation
}

// In-memory cache for the current session
const _cache = new Map<string, BookContent>();

export const contentService = {
  /**
   * Get full content for a book.
   * Falls back to bundled sample data when offline or during development.
   */
  getBookContent: async (bookId: string): Promise<BookContent> => {
    // 1. Memory cache hit
    const cached = _cache.get(bookId);
    if (cached) return cached;

    // 2. Load from bundled data (current implementation)
    const book    = ALL_BOOKS.find(b => b.id === bookId);
    const samples = SAMPLE_CONTENT[bookId] ?? SAMPLE_CONTENT['default'] ?? [];

    const content: BookContent = {
      bookId,
      fetchedAt: Date.now(),
      chapters: (book?.chapters ?? []).map((ch, idx) => ({
        chapterId: ch.id,
        title:     ch.title,
        sections:  samples, // In production: per-chapter sections
        pageCount: ch.pages,
      })),
    };

    if (content.chapters.length === 0) {
      content.chapters = [{
        chapterId: 'main',
        title:     'Content',
        sections:  samples,
        pageCount: Math.ceil(samples.length * 1.5),
      }];
    }

    _cache.set(bookId, content);
    return content;
  },

  /**
   * Get content for a specific chapter.
   */
  getChapterContent: async (bookId: string, chapterId: string): Promise<ChapterContent | null> => {
    const book = await contentService.getBookContent(bookId);
    return book.chapters.find(c => c.chapterId === chapterId) ?? null;
  },

  /**
   * Prefetch content for recently-read books in the background.
   */
  prefetchBooks: async (bookIds: string[]): Promise<void> => {
    await Promise.allSettled(bookIds.map(id => contentService.getBookContent(id)));
  },

  /**
   * Clear the in-memory cache (e.g., on sign-out or low-memory warning).
   */
  clearCache: () => {
    _cache.clear();
  },

  /**
   * Check if content is cached for a book.
   */
  isCached: (bookId: string): boolean => {
    return _cache.has(bookId);
  },
};
