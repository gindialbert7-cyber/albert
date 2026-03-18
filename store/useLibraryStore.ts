import { create } from 'zustand';
import { Book } from '@/constants/Books';

export interface ReadingPosition {
  bookId:     string;
  chapterId:  string;
  page:       number;
  scrollY:    number;
  updatedAt:  number;
}

export interface BookmarkItem {
  id:         string;
  bookId:     string;
  chapterId:  string;
  page:       number;
  note?:      string;
  createdAt:  number;
}

export interface HighlightItem {
  id:         string;
  bookId:     string;
  chapterId:  string;
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

  // Reader settings
  fontSize:       number;          // 14–28
  fontFace:       'serif' | 'sans' | 'hebrew';
  lineHeight:     number;          // 1.4–2.2
  theme:          'parchment' | 'white' | 'sepia' | 'night';
  hebrewFontSize: number;

  // Actions
  addToLibrary:   (bookId: string) => void;
  removeFromLib:  (bookId: string) => void;
  openBook:       (bookId: string) => void;
  savePosition:   (pos: ReadingPosition) => void;
  addBookmark:    (bm: Omit<BookmarkItem, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string) => void;
  addHighlight:   (hl: Omit<HighlightItem, 'id' | 'createdAt'>) => void;
  removeHighlight:(id: string) => void;
  setFontSize:    (size: number) => void;
  setHebrewSize:  (size: number) => void;
  setLineHeight:  (h: number) => void;
  setTheme:       (t: LibraryState['theme']) => void;
  setFontFace:    (f: LibraryState['fontFace']) => void;
}

let nextId = 1;
const uid = () => String(nextId++);

export const useLibraryStore = create<LibraryState>((set, get) => ({
  myBooks:        [],
  recentBooks:    [],
  positions:      {},
  bookmarks:      [],
  highlights:     [],
  fontSize:       18,
  hebrewFontSize: 22,
  fontFace:       'serif',
  lineHeight:     1.75,
  theme:          'parchment',

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

  setFontSize:    (size) => set({ fontSize: size }),
  setHebrewSize:  (size) => set({ hebrewFontSize: size }),
  setLineHeight:  (h)    => set({ lineHeight: h }),
  setTheme:       (t)    => set({ theme: t }),
  setFontFace:    (f)    => set({ fontFace: f }),
}));
