import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  FlatList, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import {
  ALL_BOOKS, Book, BookCategory,
  CATEGORY_LABELS, CATEGORY_HEBREW,
} from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCard from '@/components/library/BookCard';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

const CATEGORIES: { key: BookCategory | 'all'; label: string; hebrew?: string }[] = [
  { key: 'all',       label: 'All Books' },
  { key: 'torah',     label: 'Torah',      hebrew: 'תורה' },
  { key: 'talmud',    label: 'Talmud',     hebrew: 'גמרא' },
  { key: 'halacha',   label: 'Halacha',    hebrew: 'הלכה' },
  { key: 'mussar',    label: 'Mussar',     hebrew: 'מוסר' },
  { key: 'chasidus',  label: 'Chassidus',  hebrew: 'חסידות' },
  { key: 'philosophy',label: 'Philosophy' },
  { key: 'biography', label: 'Biography' },
  { key: 'children',  label: "Children's" },
  { key: 'modern',    label: 'Modern' },
];

const CARD_W = isTablet ? 155 : 130;
const COLS   = isTablet ? Math.floor((SCREEN_W - 40) / (CARD_W + 16)) : 3;

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const initCat = (params.category === 'classics' ? 'torah'
    : params.category === 'modern'   ? 'modern'
    : params.category === 'children' ? 'children'
    : 'all') as BookCategory | 'all';

  const [query,       setQuery]    = useState('');
  const [activeCategory, setCategory] = useState<BookCategory | 'all'>(initCat);

  const filtered = useMemo(() => {
    let books = ALL_BOOKS;
    if (activeCategory !== 'all') {
      books = books.filter(b => b.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.hebrewTitle ?? '').includes(q) ||
        b.authors.some(a => a.name.toLowerCase().includes(q)) ||
        b.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    return books;
  }, [query, activeCategory]);

  function renderBook({ item }: { item: Book }) {
    return <BookCard book={item} width={CARD_W} />;
  }

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.headerHebrew}>חיפוש</Text>
          <Text style={styles.headerTitle}>Browse & Search</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search sefarim, authors…"
              placeholderTextColor="#4A4030"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map(cat => {
            const active = cat.key === activeCategory;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catPill, active && styles.catPillActive]}
                onPress={() => setCategory(cat.key)}
              >
                {cat.hebrew && active && (
                  <Text style={[styles.catHebrew, { color: active ? Palette.navyDeep : Palette.goldMid }]}>
                    {cat.hebrew}
                  </Text>
                )}
                <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <FlatList
        key={`grid-${COLS}`}
        data={filtered}
        keyExtractor={b => b.id}
        renderItem={renderBook}
        numColumns={COLS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={COLS > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyHebrew}>אין תוצאות</Text>
            <Text style={styles.emptyText}>No books found for "{query}"</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <Text style={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  safeTop: {
    backgroundColor: '#0D1220',
  },
  header: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[4],
    paddingBottom:     Space[2],
    gap:               2,
  },
  headerHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
  },

  // Search
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
  searchIcon: { fontSize: 14 },
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

  // Category pills
  catScroll: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[4],
    gap:               8,
  },
  catPill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingHorizontal:12,
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
  catHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
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

  // Grid
  resultCount: {
    fontFamily:    Fonts.sansRegular,
    fontSize:      12,
    color:         '#5A5040',
    marginBottom:  Space[4],
    paddingHorizontal: Space[5],
  },
  grid: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[10],
  },
  row: {
    gap:          Space[4],
    marginBottom: Space[6],
  },

  // Empty state
  emptyState: {
    alignItems:  'center',
    paddingTop:  Space[12],
    gap:         8,
  },
  emptyHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   28,
    color:      Palette.goldMid + '60',
  },
  emptyText: {
    fontFamily: Fonts.serifRegular,
    fontSize:   15,
    color:      '#5A5040',
  },
});
