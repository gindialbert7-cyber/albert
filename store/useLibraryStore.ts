import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '@/constants/Books';

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

  // Learning streak
  streak:          number;         // current consecutive days
  longestStreak:   number;         // all-time best streak
  lastLearnedDate: string | null;  // YYYY-MM-DD
  totalMinutesRead:number;

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

      addBookmark: (bm) =>
        set(s => ({
          bookmarks: [...s.bookmarks, { ...bm, id: uid(), createdAt: Date.now() }],
        })),

      removeBookmark: (id) =>
        set(s => ({ bookmarks: s.bookmarks.filter(b => b.id !== id) })),

      addHighlight: (hl) =>
        set(s => ({
          highlights: [...s.highlights, { ...hl, id: uid(), createdAt: Date.now() }],
        })),

      removeHighlight: (id) =>
        set(s => ({ highlights: s.highlights.filter(h => h.id !== id) })),

      recordLearning: (minutes = 5) => {
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        set(s => {
          if (s.lastLearnedDate === todayStr) {
            return { totalMinutesRead: s.totalMinutesRead + minutes };
          }
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);
          const newStreak = s.lastLearnedDate === yesterdayStr ? s.streak + 1 : 1;
          return {
            streak:          newStreak,
            longestStreak:   Math.max(s.longestStreak, newStreak),
            lastLearnedDate: todayStr,
            totalMinutesRead:s.totalMinutesRead + minutes,
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
    }),
    {
      name:    'albert-library-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
