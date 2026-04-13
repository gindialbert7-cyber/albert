import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Dimensions,
  TextInput, ScrollView, RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ALL_BOOKS, Book } from '@/constants/Books';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCard from '@/components/library/BookCard';
import GoldDivider from '@/components/ui/GoldDivider';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;
const CARD_W   = isTablet ? 150 : 130;
const COLS     = isTablet ? Math.floor((SCREEN_W - 40) / (CARD_W + 16)) : 3;

type Tab    = 'myBooks' | 'recent' | 'bookmarks';
type SortBy = 'default' | 'az' | 'progress' | 'recent';

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'default',  label: 'Added'      },
  { key: 'recent',   label: 'Recent'     },
  { key: 'progress', label: 'Progress'   },
  { key: 'az',       label: 'A → Z'      },
];

export default function LibraryScreen() {
  const [tab,       setTab]      = useState<Tab>('myBooks');
  const [sort,      setSort]     = useState<SortBy>('default');
  const [query,     setQuery]    = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { myBooks, recentBooks, bookmarks, highlights, positions } = useLibraryStore();

  const bookMap = useMemo(
    () => Object.fromEntries(ALL_BOOKS.map(b => [b.id, b])),
    [],
  );

  const baseBooks: Book[] = useMemo(() => {
    if (tab === 'myBooks') {
      return myBooks.map(id => bookMap[id]).filter(Boolean);
    }
    if (tab === 'recent') {
      return recentBooks.map(id => bookMap[id]).filter(Boolean);
    }
    // bookmarks tab: unique books that have bookmarks
    return bookmarks
      .map(bm => bookMap[bm.bookId])
      .filter((b, i, arr) => b && arr.findIndex(x => x?.id === b.id) === i);
  }, [tab, myBooks, recentBooks, bookmarks, bookMap]);

  const visibleBooks: Book[] = useMemo(() => {
    let books = baseBooks;

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.hebrewTitle ?? '').includes(q) ||
        b.authors.some(a => a.name.toLowerCase().includes(q)),
      );
    }

    // Sort
    const copy = [...books];
    if (sort === 'az') {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'progress') {
      copy.sort((a, b) => {
        const pa = positions[a.id]?.progress ?? 0;
        const pb = positions[b.id]?.progress ?? 0;
        return pb - pa;
      });
    } else if (sort === 'recent') {
      copy.sort((a, b) => {
        const ta = positions[a.id]?.updatedAt ?? 0;
        const tb = positions[b.id]?.updatedAt ?? 0;
        return tb - ta;
      });
    }

    return copy;
  }, [baseBooks, query, sort, positions]);

  // Reading stats
  const booksInProgress = Object.values(positions).filter(p => p.progress > 0 && p.progress < 0.98).length;
  const booksCompleted  = Object.values(positions).filter(p => p.progress >= 0.98).length;

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    // Simulate async refresh (store is reactive, state re-computes automatically)
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  function renderBook({ item }: { item: Book }) {
    return <BookCard book={item} width={CARD_W} />;
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.safeTop}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerHebrew}>הספרייה שלי</Text>
            <Text style={s.headerTitle}>My Library</Text>
          </View>
          <Pressable style={s.notesBtn} onPress={() => router.push('/notes')}>
            <Ionicons name="bookmark-outline" size={16} color={Palette.goldMid} />
            <Text style={s.notesBtnText}>Notes</Text>
            {(bookmarks.length + highlights.length) > 0 && (
              <View style={s.notesBadge}>
                <Text style={s.notesBadgeText}>{bookmarks.length + highlights.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        {(booksInProgress > 0 || booksCompleted > 0) && (
          <View style={s.statsStrip}>
            {booksInProgress > 0 && (
              <View style={s.statChip}>
                <Text style={s.statValue}>{booksInProgress}</Text>
                <Text style={s.statLabel}>in progress</Text>
              </View>
            )}
            {booksCompleted > 0 && (
              <View style={[s.statChip, s.statChipGold]}>
                <Text style={[s.statValue, { color: Palette.goldBright }]}>{booksCompleted}</Text>
                <Text style={s.statLabel}>completed</Text>
              </View>
            )}
            <View style={s.statChip}>
              <Text style={s.statValue}>{myBooks.length}</Text>
              <Text style={s.statLabel}>in library</Text>
            </View>
          </View>
        )}

        <GoldDivider marginVertical={8} opacity={0.25} />

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabScroll}
        >
          {([
            { key: 'myBooks',   label: 'My Books',      count: myBooks.length },
            { key: 'recent',    label: 'Recently Read',  count: recentBooks.length },
            { key: 'bookmarks', label: 'Bookmarks',      count: bookmarks.length },
          ] as { key: Tab; label: string; count: number }[]).map(t => (
            <Pressable
              key={t.key}
              style={[s.tabPill, tab === t.key && s.tabPillActive]}
              onPress={() => { setTab(t.key); setQuery(''); }}
            >
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={[s.tabBadge, tab === t.key && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeText, tab === t.key && s.tabBadgeTextActive]}>
                    {t.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Search bar (shown when myBooks is active) ─────────────────── */}
        {baseBooks.length > 0 && (
          <View style={s.searchRow}>
            <View style={s.searchBar}>
              <Ionicons name="search-outline" size={14} color="#4A4030" />
              <TextInput
                style={s.searchInput}
                placeholder={`Search ${tab === 'myBooks' ? 'my books' : tab === 'recent' ? 'recent reads' : 'bookmarked books'}…`}
                placeholderTextColor="#4A4030"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color="#5A5040" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* ── Sort pills ────────────────────────────────────────────────── */}
        {visibleBooks.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.sortScroll}
          >
            {SORT_OPTIONS.map(o => (
              <Pressable
                key={o.key}
                style={[s.sortPill, sort === o.key && s.sortPillActive]}
                onPress={() => setSort(o.key)}
              >
                <Text style={[s.sortLabel, sort === o.key && s.sortLabelActive]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

      </SafeAreaView>

      {/* ── Grid or Empty ────────────────────────────────────────────────── */}
      {visibleBooks.length === 0 ? (
        <EmptyState tab={tab} hasQuery={query.length > 0} />
      ) : (
        <FlatList
          key={`lib-${COLS}`}
          data={visibleBooks}
          keyExtractor={b => b.id}
          renderItem={renderBook}
          numColumns={COLS}
          columnWrapperStyle={COLS > 1 ? s.gridRow : undefined}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#C9A84C"
              colors={['#C9A84C']}
            />
          }
          ListHeaderComponent={() => (
            <Text style={s.resultCount}>
              {visibleBooks.length} {visibleBooks.length === 1 ? 'book' : 'books'}
              {query ? ` matching "${query}"` : ''}
            </Text>
          )}
        />
      )}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────

function EmptyState({ tab, hasQuery }: { tab: Tab; hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyHebrew}>אין תוצאות</Text>
        <GoldDivider marginVertical={12} opacity={0.3} />
        <Text style={s.emptyText}>No books match your search.</Text>
      </View>
    );
  }

  const messages: Record<Tab, { hebrew: string; english: string; cta: string }> = {
    myBooks: {
      hebrew:  'ספריית ה-Torah שלך מחכה',
      english: 'Your Jewish library starts here. Browse and add books to begin your journey.',
      cta:     'Browse Books',
    },
    recent: {
      hebrew:  'התחל ללמוד',
      english: 'Open a sefer to start your learning journey. Your recent reads will appear here.',
      cta:     'Explore Library',
    },
    bookmarks: {
      hebrew:  'שמור את מקומך',
      english: 'Long-press any passage while reading to bookmark it and save your place.',
      cta:     'Browse Books',
    },
  };

  const m = messages[tab];

  return (
    <View style={s.emptyState}>
      <Text style={s.emptyHebrew}>{m.hebrew}</Text>
      <GoldDivider marginVertical={12} opacity={0.3} />
      <Text style={s.emptyText}>{m.english}</Text>
      <Pressable
        style={s.emptyBtn}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={s.emptyBtnText}>{m.cta}</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  safeTop: {
    backgroundColor: '#0D1220',
  },

  // Header
  header: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[4],
    paddingBottom:     Space[2],
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-end',
  },
  headerHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   13,
    color:      Palette.goldMid,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
  },
  notesBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  '#141B30',
    borderRadius:     Radius.md,
    paddingHorizontal:12,
    paddingVertical:  8,
    borderWidth:      1,
    borderColor:      '#1E2A40',
    marginBottom:     4,
  },
  notesBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#EDE8DD',
  },
  notesBadge: {
    backgroundColor:  Palette.goldBright,
    borderRadius:     8,
    minWidth:         18,
    height:           18,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal:4,
  },
  notesBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize:   10,
    color:      Palette.navyDeep,
  },

  // Stats
  statsStrip: {
    flexDirection:     'row',
    paddingHorizontal: Space[5],
    paddingBottom:     Space[2],
    gap:               Space[3],
  },
  statChip: {
    backgroundColor:  '#141B30',
    borderRadius:     Radius.sm,
    paddingHorizontal:Space[3],
    paddingVertical:  Space[2],
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      '#1E2A40',
    minWidth:         56,
  },
  statChipGold: {
    borderColor: Palette.goldMid + '40',
    backgroundColor: '#1A1408',
  },
  statValue: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      '#EDE8DD',
  },
  statLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    color:      '#5A5040',
  },

  // Tabs
  tabScroll: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[3],
    gap:               8,
  },
  tabPill: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal:14,
    paddingVertical:  8,
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '25',
    gap:              6,
  },
  tabPillActive: {
    backgroundColor: '#1E2A40',
    borderColor:     Palette.goldBright + '60',
  },
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#5A5040',
  },
  tabLabelActive: {
    color: '#EDE8DD',
  },
  tabBadge: {
    backgroundColor:  '#1E2A40',
    borderRadius:     10,
    minWidth:         20,
    height:           18,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal:4,
  },
  tabBadgeActive: {
    backgroundColor: Palette.goldBright + '25',
  },
  tabBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize:   10,
    color:      '#3A4A60',
  },
  tabBadgeTextActive: {
    color: Palette.goldBright,
  },

  // Search
  searchRow: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[2],
  },
  searchBar: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  '#141B30',
    borderRadius:     Radius.pill,
    paddingVertical:  9,
    paddingHorizontal:12,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '20',
    gap:              8,
  },
  searchInput: {
    flex:       1,
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#EDE8DD',
  },

  // Sort
  sortScroll: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[3],
    gap:               8,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical:   6,
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
    fontSize:   12,
    color:      '#4A4A4A',
  },
  sortLabelActive: {
    color: Palette.goldMid,
  },

  // Grid
  resultCount: {
    fontFamily:        Fonts.sansRegular,
    fontSize:          12,
    color:             '#4A4030',
    paddingHorizontal: Space[5],
    marginBottom:      Space[3],
    marginTop:         Space[3],
  },
  grid: {
    paddingHorizontal: Space[5],
    paddingBottom:     Space[10],
  },
  gridRow: {
    gap:          Space[4],
    marginBottom: Space[6],
  },

  // Empty state
  emptyState: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space[10],
    gap:               12,
  },
  emptyHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   22,
    color:      Palette.goldMid + '80',
    textAlign:  'center',
  },
  emptyText: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
    color:      '#5A5040',
    textAlign:  'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop:        Space[4],
    paddingHorizontal:Space[6],
    paddingVertical:  Space[3],
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Palette.goldMid,
  },
  emptyBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldBright,
  },
});
