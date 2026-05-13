import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '@/constants/Books';
import { Config } from '@/constants/Config';
import { syncService } from '@/services/syncService';
import { useAuthStore } from '@/store/useAuthStore';

export interface ReadingPosition {
  bookId:     string;
  chapterId:  string;
  chapterIdx: number;
  scrollY:    number;
  progress:   number; // 0–1 percentage through chapter
  updatedAt:  number;
}

export interface BookmarkItem {
  id:         string;
  bookId:     string;
  bookTitle:  string;
  chapterId:  string;
  chapterTitle: string;
  page:       number;
  note?:      string;
  excerpt?:   string;
  createdAt:  number;
}

export interface HighlightItem {
  id:         string;
  bookId:     string;
  bookTitle:  string;
  chapterId:  string;
  chapterTitle: string;
  sectionIdx: number;
  text:       string;
  color:      string;
  note?:      string;
  createdAt:  number;
}

/**
 * WordNote — stores an annotated selection inside a single TextSection.
 * wordStart/End are character offsets within section.content; both are -1
 * when the note covers the whole section (legacy / section-level long-press).
 */
export interface WordNote {
  id:           string;
  bookId:       string;
  bookTitle:    string;
  chapterId:    string;
  chapterTitle: string;
  sectionIdx:   number;
  wordStart:    number;   // char offset, -1 = whole section
  wordEnd:      number;   // char offset, -1 = whole section
  selectedText: string;
  noteText:     string;
  color:        string;
  createdAt:    number;
  updatedAt:    number;
}

interface LibraryState {
  // Reading list
  myBooks:        string[];        // book ids
  recentBooks:    string[];        // ordered by last opened
  positions:      Record<string, ReadingPosition>;
  bookmarks:      BookmarkItem[];
  highlights:     HighlightItem[];

  // App preferences
  isDarkMode:     boolean;
  usesSystemTheme:boolean;

  // Reader settings
  fontSize:       number;          // 14–28
  fontFace:       'serif' | 'sans' | 'hebrew';
  lineHeight:     number;          // 1.4–2.2
  theme:          'parchment' | 'white' | 'sepia' | 'night';
  hebrewFontSize: number;

  // Per-book reader preferences
  dualColumnByBook: Record<string, boolean>;

  // Word-level notes
  wordNotes: WordNote[];

  // Learning streak
  streak:           number;        // current consecutive days
  longestStreak:    number;        // all-time best streak
  lastLearnedDate:  string | null; // YYYY-MM-DD
  totalMinutesRead: number;
  todayMinutes:     number;        // resets each new day
  dailyGoalMinutes: number;        // user-set target

  // Sync
  lastSyncedAt:     number | null; // epoch ms

  // Actions
  addToLibrary:     (bookId: string) => void;
  removeFromLib:    (bookId: string) => void;
  openBook:         (bookId: string) => void;
  savePosition:     (pos: ReadingPosition) => void;
  getProgress:      (bookId: string) => number;
  addBookmark:      (bm: Omit<BookmarkItem, 'id' | 'createdAt'>) => void;
  removeBookmark:   (id: string) => void;
  addHighlight:     (hl: Omit<HighlightItem, 'id' | 'createdAt'>) => void;
  removeHighlight:  (id: string) => void;
  recordLearning:   (minutes?: number) => void;
  setFontSize:      (size: number) => void;
  setHebrewSize:    (size: number) => void;
  setLineHeight:    (h: number) => void;
  setTheme:         (t: LibraryState['theme']) => void;
  setFontFace:      (f: LibraryState['fontFace']) => void;
  setDarkMode:      (on: boolean) => void;
  setUsesSystem:    (on: boolean) => void;
  setDualColumn:    (bookId: string, on: boolean) => void;
  addWordNote:      (note: Omit<WordNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWordNote:   (id: string, patch: Partial<Pick<WordNote, 'noteText' | 'color'>>) => void;
  deleteWordNote:   (id: string) => void;
  getNotesForChapter: (bookId: string, chapterId: string) => WordNote[];
  setDailyGoal:       (minutes: number) => void;
  syncNow:            () => Promise<void>;
  /** Sync variants — insert with explicit id/timestamps from remote (no duplication) */
  syncBookmark:     (bm: BookmarkItem) => void;
  syncHighlight:    (hl: HighlightItem) => void;
  syncWordNote:     (note: WordNote) => void;
}

let nextId = Date.now();
const uid = () => String(nextId++);

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      myBooks:          [],
      recentBooks:      [],
      positions:        {},
      bookmarks:        [],
      highlights:       [],
      wordNotes:        [],
      isDarkMode:       false,
      usesSystemTheme:  true,
      fontSize:         18,
      hebrewFontSize:   22,
      fontFace:         'serif',
      lineHeight:       1.75,
      theme:            'parchment',
      streak:           0,
      longestStreak:    0,
      lastLearnedDate:  null,
      totalMinutesRead: 0,
      todayMinutes:     0,
      dailyGoalMinutes: 15,
      lastSyncedAt:     null,
      dualColumnByBook: {},

      addToLibrary: (bookId) =>
        set(s => ({
          myBooks: s.myBooks.includes(bookId) ? s.myBooks : [...s.myBooks, bookId],
        })),

      removeFromLib: (bookId) =>
        set(s => ({ myBooks: s.myBooks.filter(id => id !== bookId) })),

      openBook: (bookId) =>
        set(s => ({
          recentBooks: [bookId, ...s.recentBooks.filter(id => id !== bookId)].slice(0, 20),
        })),

      savePosition: (pos) =>
        set(s => ({ positions: { ...s.positions, [pos.bookId]: pos } })),

      getProgress: (bookId) => {
        const pos = get().positions[bookId];
        return pos?.progress ?? 0;
      },

      addBookmark: (bm) => {
        const newBm = { ...bm, id: uid(), createdAt: Date.now() };
        set(s => ({ bookmarks: [...s.bookmarks, newBm] }));
        if (Config.FEATURE_CLOUD_SYNC) {
          const userId = useAuthStore.getState().user?.id;
          if (userId) syncService.pushBookmark(userId, newBm);
        }
      },

      removeBookmark: (id) =>
        set(s => ({ bookmarks: s.bookmarks.filter(b => b.id !== id) })),

      addHighlight: (hl) => {
        const newHl = { ...hl, id: uid(), createdAt: Date.now() };
        set(s => ({ highlights: [...s.highlights, newHl] }));
        if (Config.FEATURE_CLOUD_SYNC) {
          const userId = useAuthStore.getState().user?.id;
          if (userId) syncService.pushHighlight(userId, newHl);
        }
      },

      removeHighlight: (id) =>
        set(s => ({ highlights: s.highlights.filter(h => h.id !== id) })),

      recordLearning: (minutes = 5) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        set(s => {
          if (s.lastLearnedDate === todayStr) {
            return {
              totalMinutesRead: s.totalMinutesRead + minutes,
              todayMinutes:     s.todayMinutes + minutes,
            };
          }
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);
          const newStreak = s.lastLearnedDate === yesterdayStr ? s.streak + 1 : 1;
          return {
            streak:           newStreak,
            longestStreak:    Math.max(s.longestStreak, newStreak),
            lastLearnedDate:  todayStr,
            totalMinutesRead: s.totalMinutesRead + minutes,
            todayMinutes:     minutes, // reset for new day
          };
        });
      },

      setFontSize:    (size) => set({ fontSize: size }),
      setHebrewSize:  (size) => set({ hebrewFontSize: size }),
      setLineHeight:  (h)    => set({ lineHeight: h }),
      setTheme:       (t)    => set({ theme: t }),
      setFontFace:    (f)    => set({ fontFace: f }),
      setDarkMode:    (on)   => set({ isDarkMode: on }),
      setUsesSystem:  (on)   => set({ usesSystemTheme: on }),
      setDualColumn:  (bookId, on) =>
        set(s => ({ dualColumnByBook: { ...s.dualColumnByBook, [bookId]: on } })),

      addWordNote: (note) => {
        const newNote = { ...note, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
        set(s => ({ wordNotes: [...s.wordNotes, newNote] }));
        if (Config.FEATURE_CLOUD_SYNC) {
          const userId = useAuthStore.getState().user?.id;
          if (userId) syncService.pushWordNote(userId, newNote);
        }
      },

      updateWordNote: (id, patch) =>
        set(s => ({
          wordNotes: s.wordNotes.map(n =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
          ),
        })),

      deleteWordNote: (id) =>
        set(s => ({ wordNotes: s.wordNotes.filter(n => n.id !== id) })),

      getNotesForChapter: (bookId, chapterId) =>
        get().wordNotes.filter(n => n.bookId === bookId && n.chapterId === chapterId),

      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),

      syncNow: async () => {
        if (!Config.FEATURE_CLOUD_SYNC) return;
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;
        try {
          await syncService.pullAll(userId);
          set({ lastSyncedAt: Date.now() });
        } catch {
          // Silently ignore offline / auth errors
        }
      },

      // Sync variants (accept full item with remote id — no-op if id already exists)
      syncBookmark: (bm) =>
        set(s => s.bookmarks.some(b => b.id === bm.id)
          ? {}
          : { bookmarks: [...s.bookmarks, bm] }),

      syncHighlight: (hl) =>
        set(s => s.highlights.some(h => h.id === hl.id)
          ? {}
          : { highlights: [...s.highlights, hl] }),

      syncWordNote: (note) =>
        set(s => s.wordNotes.some(n => n.id === note.id)
          ? {}
          : { wordNotes: [...s.wordNotes, note] }),
    }),
    {
      name:    'albert-library-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
