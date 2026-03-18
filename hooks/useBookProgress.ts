/**
 * useBookProgress
 *
 * Returns a 0–1 progress fraction for any book,
 * accounting for both chapter position and scroll position within the chapter.
 */

import { useLibraryStore } from '@/store/useLibraryStore';
import { ALL_BOOKS } from '@/constants/Books';

export function useBookProgress(bookId: string): {
  progress:      number;   // 0–1
  percent:       number;   // 0–100 integer
  chapterIdx:    number;
  totalChapters: number;
  isStarted:     boolean;
  isFinished:    boolean;
} {
  const positions = useLibraryStore(s => s.positions);
  const pos = positions[bookId];

  const book = ALL_BOOKS.find(b => b.id === bookId);
  const totalChapters = book?.chapters.length ?? 1;

  if (!pos) {
    return { progress: 0, percent: 0, chapterIdx: 0, totalChapters, isStarted: false, isFinished: false };
  }

  const chapterIdx   = pos.chapterIdx ?? 0;
  const withinChapter = pos.progress ?? 0;

  // Overall progress: completed chapters + fraction of current chapter
  const progress = (chapterIdx + withinChapter) / totalChapters;
  const clamped  = Math.min(1, Math.max(0, progress));

  return {
    progress:   clamped,
    percent:    Math.round(clamped * 100),
    chapterIdx,
    totalChapters,
    isStarted:  clamped > 0,
    isFinished: clamped >= 0.99,
  };
}
