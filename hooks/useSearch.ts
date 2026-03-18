/**
 * useSearch — search with persistent history
 *
 * Features:
 *   - Debounced query (300ms)
 *   - Search history saved to AsyncStorage (last 12 searches)
 *   - Clear individual or all history entries
 *   - Exposes filtered results and loading state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_BOOKS, Book, BookCategory } from '@/constants/Books';

const HISTORY_KEY     = 'albert-search-history-v1';
const MAX_HISTORY     = 12;
const DEBOUNCE_MS     = 300;

export interface SearchResult {
  book:     Book;
  matchOn:  'title' | 'author' | 'tag' | 'hebrew';
}

interface UseSearchOptions {
  category?: BookCategory | 'all';
}

interface UseSearchReturn {
  query:         string;
  setQuery:      (q: string) => void;
  results:       SearchResult[];
  isSearching:   boolean;
  searchHistory: string[];
  addToHistory:  (term: string) => void;
  removeHistory: (term: string) => void;
  clearHistory:  () => void;
}

export function useSearch({ category = 'all' }: UseSearchOptions = {}): UseSearchReturn {
  const [query,         setQueryRaw]   = useState('');
  const [debouncedQ,    setDebouncedQ] = useState('');
  const [searchHistory, setHistory]    = useState<string[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load history on mount
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then(json => {
      if (json) {
        try { setHistory(JSON.parse(json)); } catch {}
      }
    });
  }, []);

  // Debounce query
  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQ(q), DEBOUNCE_MS);
  }, []);

  // Compute results
  const results: SearchResult[] = (() => {
    const q = debouncedQ.trim().toLowerCase();
    if (!q) return [];

    let pool = category === 'all'
      ? ALL_BOOKS
      : ALL_BOOKS.filter(b => b.category === category);

    return pool.flatMap((book): SearchResult[] => {
      if (book.title.toLowerCase().includes(q)) {
        return [{ book, matchOn: 'title' }];
      }
      if ((book.hebrewTitle ?? '').includes(q)) {
        return [{ book, matchOn: 'hebrew' }];
      }
      if (book.authors.some(a => a.name.toLowerCase().includes(q))) {
        return [{ book, matchOn: 'author' }];
      }
      if (book.tags.some(t => t.toLowerCase().includes(q))) {
        return [{ book, matchOn: 'tag' }];
      }
      return [];
    });
  })();

  const addToHistory = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, MAX_HISTORY);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeHistory = useCallback((term: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== term);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching: debouncedQ.trim().length > 0,
    searchHistory,
    addToHistory,
    removeHistory,
    clearHistory,
  };
}
