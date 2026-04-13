import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import {
  ALL_BOOKS, Book, BookCategory,
} from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCard from '@/components/library/BookCard';
import { useSearch } from '@/hooks/useSearch';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;
const CARD_W   = isTablet ? 150 : 120;
const COLS     = isTablet ? Math.floor((SCREEN_W - 40) / (CARD_W + 16)) : 3;

// ─── Curated collections ───────────────────────────────────────────────────

interface Collection {
  id:          string;
  title:       string;
  hebrewTitle: string;
  description: string;
  bookIds:     string[];
  gradient:    [string, string];
  accentColor: string;
}

const CURATED_COLLECTIONS: Collection[] = [
  {
    id:          'essentials',
    title:       'Jewish Essentials',
    hebrewTitle: 'יסודות',
    description: 'The texts every Jewish library begins with',
    bookIds:     ['chumash-rashi', 'pirkei-avos', 'tehillim', 'siddur-complete', 'tanya'],
    gradient:    ['#1A2845', '#0F1A35'],
    accentColor: Palette.goldBright,
  },
  {
    id:          'mussar',
    title:       'Path of Growth',
    hebrewTitle: 'דרך המוסר',
    description: 'Timeless wisdom for character and soul',
    bookIds:     ['mesilat-yesharim', 'orchos-tzaddikim', 'chovas-halevavos', 'pirkei-avos'],
    gradient:    ['#2A1A0A', '#1A0F05'],
    accentColor: '#D4884A',
  },
  {
    id:          'modern',
    title:       'Modern Jewish Thought',
    hebrewTitle: 'מחשבה עכשווית',
    description: 'Contemporary thinkers on faith and meaning',
    bookIds:     ['rabbi-sacks-great-partnership', 'rav-soloveitchik-lonely-man', 'man-is-not-alone', 'thirteen-petalled-rose'],
    gradient:    ['#0A2A1A', '#051A10'],
    accentColor: '#5CA87A',
  },
  {
    id:          'beginners',
    title:       "New to Learning?",
    hebrewTitle: 'למתחילים',
    description: 'Accessible, welcoming texts to start your journey',
    bookIds:     ['pirkei-avos', 'haggadah-pesach', 'igrot-haramban', 'rabbi-sacks-covenant'],
    gradient:    ['#2A1A3A', '#1A0F28'],
    accentColor: '#9B7EBD',
  },
];

// ─── Category pills ────────────────────────────────────────────────────────

const CATEGORIES: { key: BookCategory | 'all'; label: string; hebrew?: string; emoji: string }[] = [
  { key: 'all',        label: 'All',        emoji: '📚' },
  { key: 'torah',      label: 'Torah',      hebrew: 'תורה',   emoji: '📜' },
  { key: 'talmud',     label: 'Talmud',     hebrew: 'גמרא',   emoji: '🕍' },
  { key: 'halacha',    label: 'Halacha',    hebrew: 'הלכה',   emoji: '⚖️' },
  { key: 'mussar',     label: 'Mussar',     hebrew: 'מוסר',   emoji: '✨' },
  { key: 'chasidus',   label: 'Chassidus',  hebrew: 'חסידות', emoji: '🕯️' },
  { key: 'philosophy', label: 'Philosophy',                   emoji: '🔭' },
  { key: 'modern',     label: 'Modern',                       emoji: '📖' },
  { key: 'biography',  label: 'Biography',                    emoji: '👤' },
  { key: 'children',   label: "Children's",                   emoji: '🌟' },
];

// ─── Sort options ──────────────────────────────────────────────────────────

type SortMode = 'default' | 'free' | 'az' | 'classic' | 'new';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'default', label: 'Recommended' },
  { key: 'free',    label: 'Free First'  },
  { key: 'classic', label: 'Classics'    },
  { key: 'new',     label: 'New Arrivals'},
  { key: 'az',      label: 'A → Z'       },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function booksByIds(ids: string[]): Book[] {
  return ids.flatMap(id => {
    const b = ALL_BOOKS.find(x => x.id === id);
    return b ? [b] : [];
  });
}

function applySort(books: Book[], sort: SortMode): Book[] {
  if (sort === 'default') return books;
  const copy = [...books];
  if (sort === 'free')    return copy.sort((a, b) => (a.requiresSub ? 1 : -1) - (b.requiresSub ? 1 : -1));
  if (sort === 'classic') return copy.sort((a, b) => (b.isClassic ? 1 : 0) - (a.isClassic ? 1 : 0));
  if (sort === 'new')     return copy.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  if (sort === 'az')      return copy.sort((a, b) => a.title.localeCompare(b.title));
  return copy;
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const initCat = (params.category === 'classics' ? 'torah'
    : params.category === 'modern'   ? 'modern'
    : params.category === 'children' ? 'children'
    : 'all') as BookCategory | 'all';

  const [category,   setCategory]   = useState<BookCategory | 'all'>(initCat);
  const [sort,       setSort]       = useState<SortMode>('default');
  const [isFocused,  setIsFocused]  = useState(false);
  const searchRef = useRef<TextInput>(null);

  const {
    query, setQuery,
    searchHistory, addToHistory, removeHistory, clearHistory,
  } = useSearch({ category });

  const isSearching  = query.trim().length > 0;
  const isBrowseAll  = !isSearching && category === 'all';
  const showHistory  = isFocused && !isSearching && searchHistory.length > 0;

  const filtered = useMemo(() => {
    let books = ALL_BOOKS;
    if (category !== 'all') books = books.filter(b => b.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q)         ||
        (b.hebrewTitle ?? '').includes(q)         ||
        b.authors.some(a => a.name.toLowerCase().includes(q)) ||
        b.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    return applySort(books, sort);
  }, [query, category, sort]);

  const handleCategoryPress = useCallback((key: BookCategory | 'all') => {
    Haptics.selectionAsync();
    setCategory(key);
    if (key !== 'all') setSort('default');
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) addToHistory(query.trim());
  }, [query, addToHistory]);

  const handleHistoryTap = useCallback((term: string) => {
    Haptics.selectionAsync();
    setQuery(term);
    addToHistory(term);
    searchRef.current?.blur();
    setIsFocused(false);
  }, [setQuery, addToHistory]);

  // ── Renders ──

  function renderGridBook({ item }: { item: Book }) {
    return <BookCard book={item} width={CARD_W} />;
  }

  return (
    <View style={s.root}>
      {/* ── Fixed Header ──────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <Text style={s.headerHeb}>חיפוש</Text>
          <Text style={s.headerTitle}>Browse & Search</Text>
        </View>

        {/* Search bar */}
        <View style={s.searchRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.searchBar, isFocused && s.searchBarFocused]}
            onPress={() => searchRef.current?.focus()}
          >
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              ref={searchRef}
              style={s.searchInput}
              placeholder="Search sefarim, authors, topics…"
              placeholderTextColor="#4A4030"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => { setIsFocused(false); handleSearchSubmit(); }}
              onSubmitEditing={handleSearchSubmit}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); Haptics.selectionAsync(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Search history dropdown */}
        {showHistory && (
          <View style={s.historyPanel}>
            <View style={s.historyHeader}>
              <Text style={s.historyTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={() => { clearHistory(); Haptics.selectionAsync(); }}>
                <Text style={s.historyClear}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.slice(0, 6).map(term => (
              <TouchableOpacity
                key={term}
                style={s.historyRow}
                onPress={() => handleHistoryTap(term)}
              >
                <Ionicons name="time-outline" size={14} color="#4A4030" />
                <Text style={s.historyTerm} numberOfLines={1}>{term}</Text>
                <TouchableOpacity
                  onPress={() => { removeHistory(term); Haptics.selectionAsync(); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={14} color="#3A3028" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catScroll}
          keyboardShouldPersistTaps="always"
        >
          {CATEGORIES.map(cat => {
            const active = cat.key === category;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[s.catPill, active && s.catPillActive]}
                onPress={() => handleCategoryPress(cat.key)}
              >
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                {cat.hebrew && active && (
                  <Text style={[s.catHeb, { color: active ? Palette.navyDeep : Palette.goldMid }]}>
                    {cat.hebrew}
                  </Text>
                )}
                <Text style={[s.catLabel, active && s.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >

        {/* ── Curated Collections (browse-all mode only) ────────────── */}
        {isBrowseAll && (
          <View style={s.collectionsSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeb}>אוספים</Text>
              <Text style={s.sectionTitle}>Curated Collections</Text>
            </View>

            {CURATED_COLLECTIONS.map(col => (
              <CollectionRow key={col.id} collection={col} />
            ))}
          </View>
        )}

        {/* ── Sort bar ─────────────────────────────────────────────── */}
        {!isBrowseAll && (
          <View style={s.sortSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.sortScroll}
            >
              {SORT_OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.key}
                  style={[s.sortPill, sort === o.key && s.sortPillActive]}
                  onPress={() => setSort(o.key)}
                >
                  <Text style={[s.sortLabel, sort === o.key && s.sortLabelActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── All Books grid ────────────────────────────────────────── */}
        <View style={s.gridSection}>
          {isBrowseAll && (
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeb}>כל הספרים</Text>
              <Text style={s.sectionTitle}>All {filtered.length} Books</Text>
            </View>
          )}
          {!isBrowseAll && (
            <View style={s.resultsHeader}>
              <Text style={s.resultCount}>
                {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
                {isSearching ? ` for "${query}"` : ''}
              </Text>
            </View>
          )}

          {filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={b => b.id}
              renderItem={renderGridBook}
              numColumns={COLS}
              columnWrapperStyle={COLS > 1 ? s.gridRow : undefined}
              scrollEnabled={false}
              contentContainerStyle={s.grid}
            />
          )}
        </View>

        <View style={{ height: Space[12] }} />
      </ScrollView>
    </View>
  );
}

// ─── CollectionRow component ───────────────────────────────────────────────

function CollectionRow({ collection: col }: { collection: Collection }) {
  const books = booksByIds(col.bookIds);

  return (
    <View style={cr.wrap}>
      {/* Header card */}
      <LinearGradient colors={col.gradient} style={cr.header}>
        <View style={cr.headerLeft}>
          <Text style={[cr.headerHeb, { color: col.accentColor }]}>{col.hebrewTitle}</Text>
          <Text style={cr.headerTitle}>{col.title}</Text>
          <Text style={cr.headerDesc}>{col.description}</Text>
        </View>
        <TouchableOpacity
          style={[cr.headerBtn, { borderColor: col.accentColor + '60', flexDirection: 'row', alignItems: 'center', gap: 4 }]}
          onPress={() => router.push({
            pathname: '/collection/[id]',
            params: {
              id:      col.id,
              title:   col.title,
              hebrew:  col.hebrewTitle,
              desc:    col.description,
              bookIds: col.bookIds.join(','),
            },
          })}
        >
          <Text style={[cr.headerBtnText, { color: col.accentColor }]}>See all</Text>
          <Ionicons name="arrow-forward" size={11} color={col.accentColor} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Book shelf */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={cr.shelf}
      >
        {books.map(book => (
          <BookCard key={book.id} book={book} width={110} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── EmptyState component ──────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <View style={es.wrap}>
      <Text style={es.hebrew}>אין תוצאות</Text>
      {query ? (
        <>
          <Text style={es.text}>No books found for "{query}"</Text>
          <Text style={es.sub}>Try a different search term or browse by category</Text>
        </>
      ) : (
        <Text style={es.text}>No books in this category yet</Text>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  safeTop: {
    backgroundColor: '#0D1220',
    zIndex:          10,
  },
  header: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[4],
    paddingBottom:     Space[2],
    gap:               2,
  },
  headerHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   13,
    color:      Palette.goldMid,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
  },

  searchRow: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[3],
  },
  searchBar: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  '#141B30',
    borderRadius:     Radius.pill,
    paddingVertical:  11,
    paddingHorizontal:14,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '25',
    gap:              8,
  },
  searchBarFocused: {
    borderColor: Palette.goldMid + '60',
    backgroundColor: '#1A2240',
  },
  searchIcon:  { fontSize: 14 },
  searchInput: {
    flex:       1,
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#EDE8DD',
  },
  clearBtn: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#5A5040',
    padding:    4,
  },

  historyPanel: {
    marginHorizontal: Space[5],
    marginBottom:     Space[2],
    backgroundColor:  '#141B30',
    borderRadius:     Radius.lg,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '20',
    overflow:         'hidden',
  },
  historyHeader: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: Space[4],
    paddingVertical:   Space[2],
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A40',
  },
  historyTitle: {
    fontFamily:  Fonts.sansSemiBold,
    fontSize:    11,
    color:       '#4A4030',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  historyClear: {
    fontFamily: Fonts.sansMedium,
    fontSize:   11,
    color:      Palette.goldMid + '80',
  },
  historyRow: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: Space[4],
    paddingVertical:   Space[3],
    gap:              Space[3],
    borderBottomWidth: 1,
    borderBottomColor: '#1A2030',
  },
  historyTerm: {
    flex:       1,
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#A89880',
  },

  catScroll: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[4],
    gap:               8,
  },
  catPill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingHorizontal:11,
    paddingVertical:  7,
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '30',
    backgroundColor:  '#141B30',
  },
  catPillActive: {
    backgroundColor: Palette.goldBright,
    borderColor:     Palette.goldBright,
  },
  catEmoji:     { fontSize: 12 },
  catHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   11,
    color:      Palette.navyDeep,
  },
  catLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      Palette.goldMid,
  },
  catLabelActive: {
    color: Palette.navyDeep,
  },

  scroll: {
    paddingTop: Space[3],
  },

  collectionsSection: {
    marginBottom: Space[6],
    gap:          Space[4],
  },
  sectionHeader: {
    paddingHorizontal: Space[5],
    gap:               1,
    marginBottom:      Space[1],
  },
  sectionHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   11,
    color:      Palette.goldMid + '80',
  },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      '#EDE8DD',
  },

  sortSection: {
    marginBottom: Space[4],
  },
  sortScroll: {
    paddingHorizontal: Space[5],
    gap:               8,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       '#2A3450',
    backgroundColor:   '#141B30',
  },
  sortPillActive: {
    backgroundColor: '#243558',
    borderColor:     Palette.goldMid + '60',
  },
  sortLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#5A5040',
  },
  sortLabelActive: {
    color: Palette.goldMid,
  },

  gridSection: {
    paddingBottom: Space[4],
  },
  resultsHeader: {
    paddingHorizontal: Space[5],
    marginBottom:      Space[3],
  },
  resultCount: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#5A5040',
  },
  grid: {
    paddingHorizontal: Space[5],
  },
  gridRow: {
    gap:          Space[3],
    marginBottom: Space[5],
  },
});

const cr = StyleSheet.create({
  wrap: {
    gap: Space[3],
  },
  header: {
    marginHorizontal: Space[5],
    borderRadius:     Radius.lg,
    padding:          Space[5],
    flexDirection:    'row',
    alignItems:       'flex-end',
    justifyContent:   'space-between',
    borderWidth:      1,
    borderColor:      '#FFFFFF10',
  },
  headerLeft: {
    flex: 1,
    gap:  3,
  },
  headerHeb: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   13,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   18,
    color:      '#FDFAF4',
  },
  headerDesc: {
    fontFamily: Fonts.serifItalic,
    fontSize:   12,
    color:      '#8B8070',
    lineHeight: 18,
    maxWidth:   200,
  },
  headerBtn: {
    borderWidth:      1,
    borderRadius:     Radius.pill,
    paddingHorizontal:12,
    paddingVertical:   6,
  },
  headerBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
  },
  shelf: {
    paddingHorizontal: Space[5],
    gap:               Space[3],
    paddingBottom:     Space[2],
  },
});

const es = StyleSheet.create({
  wrap: {
    alignItems:        'center',
    paddingTop:        Space[12],
    paddingHorizontal: Space[6],
    gap:               8,
  },
  hebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   28,
    color:      Palette.goldMid + '50',
  },
  text: {
    fontFamily: Fonts.serifRegular,
    fontSize:   16,
    color:      '#5A5040',
    textAlign:  'center',
  },
  sub: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#3A3028',
    textAlign:  'center',
  },
});
