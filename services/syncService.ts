/**
 * services/syncService.ts
 *
 * Bidirectional sync between local Zustand stores and Supabase.
 *
 * Design principles:
 *   - LOCAL FIRST: reads/writes always go to local store first (instant UX)
 *   - ASYNC SYNC:  Supabase is updated in background after local write
 *   - CONFLICT RESOLUTION: "last write wins" by updated_at timestamp
 *   - GRACEFUL DEGRADATION: sync failures are silent (app works fully offline)
 *
 * Usage:
 *   import { syncService } from '@/services/syncService';
 *
 *   // After sign-in: pull remote data into local store
 *   await syncService.pullAll(userId);
 *
 *   // After a local write: push a single item to Supabase
 *   syncService.pushBookmark(userId, bookmark);
 *   syncService.pushHighlight(userId, highlight);
 *   syncService.pushWordNote(userId, wordNote);
 *   syncService.pushReadingPosition(userId, position, bookId);
 */

import { supabase } from '@/lib/supabase';
import { useLibraryStore, BookmarkItem, HighlightItem, WordNote, ReadingPosition } from '@/store/useLibraryStore';

// ── Push single items (fire-and-forget) ──────────────────────────────────────

export const syncService = {

  /**
   * Push reading position for one book.
   */
  pushReadingPosition(userId: string, bookId: string, pos: ReadingPosition): void {
    supabase.from('reading_positions').upsert({
      user_id:       userId,
      book_id:       bookId,
      chapter_id:    pos.chapterId,
      chapter_index: pos.chapterIdx,
      scroll_y:      pos.scrollY,
      progress:      pos.progress,
    }, { onConflict: 'user_id,book_id' }).then(({ error }) => {
      if (error) console.warn('[sync] position push failed:', error.message);
    });
  },

  /**
   * Push a new bookmark (insert — bookmarks are never updated, only created/deleted).
   */
  pushBookmark(userId: string, item: BookmarkItem): void {
    supabase.from('bookmarks').upsert({
      id:            item.id,
      user_id:       userId,
      book_id:       item.bookId,
      book_title:    item.bookTitle,
      chapter_id:    item.chapterId,
      chapter_title: item.chapterTitle,
      page:          item.page,
      excerpt:       item.excerpt   ?? null,
      note:          item.note      ?? null,
    }).then(({ error }) => {
      if (error) console.warn('[sync] bookmark push failed:', error.message);
    });
  },

  /**
   * Delete a bookmark from Supabase when removed locally.
   */
  deleteBookmark(userId: string, bookmarkId: string): void {
    supabase.from('bookmarks')
      .delete()
      .match({ id: bookmarkId, user_id: userId })
      .then(({ error }) => {
        if (error) console.warn('[sync] bookmark delete failed:', error.message);
      });
  },

  /**
   * Push a highlight.
   */
  pushHighlight(userId: string, item: HighlightItem): void {
    supabase.from('highlights').upsert({
      id:            item.id,
      user_id:       userId,
      book_id:       item.bookId,
      book_title:    item.bookTitle,
      chapter_id:    item.chapterId,
      chapter_title: item.chapterTitle,
      section_index: item.sectionIdx,
      text:          item.text,
      color:         item.color,
      note:          item.note ?? null,
    }).then(({ error }) => {
      if (error) console.warn('[sync] highlight push failed:', error.message);
    });
  },

  /**
   * Delete a highlight from Supabase.
   */
  deleteHighlight(userId: string, highlightId: string): void {
    supabase.from('highlights')
      .delete()
      .match({ id: highlightId, user_id: userId })
      .then(({ error }) => {
        if (error) console.warn('[sync] highlight delete failed:', error.message);
      });
  },

  /**
   * Push a word note.
   */
  pushWordNote(userId: string, item: WordNote): void {
    supabase.from('word_notes').upsert({
      id:            item.id,
      user_id:       userId,
      book_id:       item.bookId,
      book_title:    item.bookTitle,
      chapter_id:    item.chapterId,
      chapter_title: item.chapterTitle,
      section_index: item.sectionIdx,
      word_start:    item.wordStart,
      word_end:      item.wordEnd,
      selected_text: item.selectedText,
      note_text:     item.noteText,
      color:         item.color,
    }).then(({ error }) => {
      if (error) console.warn('[sync] word_note push failed:', error.message);
    });
  },

  /**
   * Delete a word note from Supabase.
   */
  deleteWordNote(userId: string, noteId: string): void {
    supabase.from('word_notes')
      .delete()
      .match({ id: noteId, user_id: userId })
      .then(({ error }) => {
        if (error) console.warn('[sync] word_note delete failed:', error.message);
      });
  },

  // ── Pull (on sign-in) ────────────────────────────────────────────────────────

  /**
   * Pull all user data from Supabase into local store.
   * Call this once after sign-in (or on explicit manual sync).
   * Uses last-write-wins: remote wins for any item with newer updated_at.
   */
  async pullAll(userId: string): Promise<void> {
    await Promise.allSettled([
      syncService._pullPositions(userId),
      syncService._pullBookmarks(userId),
      syncService._pullHighlights(userId),
      syncService._pullWordNotes(userId),
    ]);
  },

  async _pullPositions(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('reading_positions')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return;

    const store = useLibraryStore.getState();
    for (const row of data) {
      const local    = store.positions[row.book_id];
      const remoteTs = new Date(row.updated_at).getTime();
      if (!local || remoteTs > local.updatedAt) {
        store.savePosition({
          bookId:     row.book_id,
          chapterId:  row.chapter_id,
          chapterIdx: row.chapter_index,
          scrollY:    row.scroll_y,
          progress:   row.progress,
          updatedAt:  remoteTs,
        });
      }
    }
  },

  async _pullBookmarks(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const store = useLibraryStore.getState();
    for (const row of data) {
      store.syncBookmark({
        id:           row.id,
        bookId:       row.book_id,
        bookTitle:    row.book_title    ?? '',
        chapterId:    row.chapter_id,
        chapterTitle: row.chapter_title ?? '',
        page:         row.page,
        excerpt:      row.excerpt       ?? undefined,
        note:         row.note          ?? undefined,
        createdAt:    new Date(row.created_at).getTime(),
      });
    }
  },

  async _pullHighlights(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const store = useLibraryStore.getState();
    for (const row of data) {
      store.syncHighlight({
        id:           row.id,
        bookId:       row.book_id,
        bookTitle:    row.book_title    ?? '',
        chapterId:    row.chapter_id,
        chapterTitle: row.chapter_title ?? '',
        sectionIdx:   row.section_index,
        text:         row.text,
        color:        row.color,
        note:         row.note          ?? undefined,
        createdAt:    new Date(row.created_at).getTime(),
      });
    }
  },

  async _pullWordNotes(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('word_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const store = useLibraryStore.getState();
    for (const row of data) {
      store.syncWordNote({
        id:           row.id,
        bookId:       row.book_id,
        bookTitle:    row.book_title    ?? '',
        chapterId:    row.chapter_id,
        chapterTitle: row.chapter_title ?? '',
        sectionIdx:   row.section_index,
        wordStart:    row.word_start,
        wordEnd:      row.word_end,
        selectedText: row.selected_text,
        noteText:     row.note_text,
        color:        row.color,
        createdAt:    new Date(row.created_at).getTime(),
        updatedAt:    new Date(row.updated_at).getTime(),
      });
    }
  },
};
