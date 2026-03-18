import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ALL_BOOKS, Book } from '@/constants/Books';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCard from '@/components/library/BookCard';
import GoldDivider from '@/components/ui/GoldDivider';
import ProgressBar from '@/components/ui/ProgressBar';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;
const CARD_W   = isTablet ? 150 : 130;
const COLS     = isTablet ? Math.floor((SCREEN_W - 40) / (CARD_W + 16)) : 3;

type Tab = 'myBooks' | 'recent' | 'bookmarks';

export default function LibraryScreen() {
  const [tab, setTab] = useState<Tab>('myBooks');
  const { myBooks, recentBooks, bookmarks, highlights, positions } = useLibraryStore();

  const bookMap = Object.fromEntries(ALL_BOOKS.map(b => [b.id, b]));

  const visibleBooks: Book[] = tab === 'myBooks'
    ? myBooks.map(id => bookMap[id]).filter(Boolean)
    : tab === 'recent'
    ? recentBooks.map(id => bookMap[id]).filter(Boolean)
    : bookmarks
        .map(bm => bookMap[bm.bookId])
        .filter((b, i, arr) => b && arr.findIndex(x => x?.id === b.id) === i);

  function renderBook({ item }: { item: Book }) {
    return <BookCard book={item} width={CARD_W} />;
  }

  // Reading stats
  const booksInProgress = Object.values(positions).filter(p => p.progress > 0 && p.progress < 0.98).length;
  const booksCompleted  = Object.values(positions).filter(p => p.progress >= 0.98).length;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerHebrew}>הספרייה שלי</Text>
            <Text style={styles.headerTitle}>My Library</Text>
          </View>
          <Pressable
            style={styles.notesBtn}
            onPress={() => router.push('/notes')}
          >
            <Text style={styles.notesBtnIcon}>🔖</Text>
            <View>
              <Text style={styles.notesBtnText}>Notes</Text>
              {(bookmarks.length + highlights.length) > 0 && (
                <Text style={styles.notesBtnCount}>
                  {bookmarks.length + highlights.length}
                </Text>
              )}
            </View>
          </Pressable>
        </View>

        {/* Stats strip */}
        {(booksInProgress > 0 || booksCompleted > 0) && (
          <View style={styles.statsStrip}>
            {booksInProgress > 0 && (
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{booksInProgress}</Text>
                <Text style={styles.statLabel}>in progress</Text>
              </View>
            )}
            {booksCompleted > 0 && (
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{booksCompleted}</Text>
                <Text style={styles.statLabel}>completed</Text>
              </View>
            )}
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{myBooks.length}</Text>
              <Text style={styles.statLabel}>in library</Text>
            </View>
          </View>
        )}

        <GoldDivider marginVertical={8} opacity={0.3} />

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {([
            { key: 'myBooks',   label: 'My Books',     count: myBooks.length },
            { key: 'recent',    label: 'Recently Read', count: recentBooks.length },
            { key: 'bookmarks', label: 'Bookmarks',     count: bookmarks.length },
          ] as { key: Tab; label: string; count: number }[]).map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {t.count > 0 && tab !== t.key && (
                <Text style={styles.tabCount}>{t.count}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {visibleBooks.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <FlatList
          key={`lib-${COLS}`}
          data={visibleBooks}
          keyExtractor={b => b.id}
          renderItem={renderBook}
          numColumns={COLS}
          columnWrapperStyle={COLS > 1 ? styles.row : undefined}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { hebrew: string; english: string; cta: string }> = {
    myBooks:   {
      hebrew:  'ספריית ה-Torah שלך מחכה',
      english: 'Your Jewish library starts here.',
      cta:     'Browse Books',
    },
    recent:    {
      hebrew:  'התחל ללמוד',
      english: 'Open a sefer to start your learning journey.',
      cta:     'Explore Library',
    },
    bookmarks: {
      hebrew:  'שמור את מקומך',
      english: 'Tap the bookmark icon while reading to save passages.',
      cta:     'Browse Books',
    },
  };

  const m = messages[tab];

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyHebrew}>{m.hebrew}</Text>
      <GoldDivider marginVertical={12} opacity={0.3} />
      <Text style={styles.emptyText}>{m.english}</Text>
      <Pressable
        style={styles.emptyBtn}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.emptyBtnText}>{m.cta}</Text>
      </Pressable>
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
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-end',
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
  notesBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    backgroundColor:'#141B30',
    borderRadius:   Radius.md,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderWidth:    1,
    borderColor:    '#1E2A40',
    marginBottom:   4,
  },
  notesBtnIcon: {
    fontSize: 16,
  },
  notesBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#EDE8DD',
  },
  notesBtnCount: {
    fontFamily: Fonts.sansBold,
    fontSize:   10,
    color:      Palette.goldMid,
  },

  // Stats strip
  statsStrip: {
    flexDirection:    'row',
    paddingHorizontal: Space[5],
    paddingBottom:    Space[2],
    gap:              Space[3],
  },
  statChip: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.sm,
    paddingHorizontal: Space[3],
    paddingVertical:  Space[2],
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#1E2A40',
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
  tabBar: {
    flexDirection:    'row',
    paddingHorizontal: Space[5],
    paddingBottom:    Space[3],
    gap:              8,
  },
  tab: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '25',
    gap:               4,
  },
  tabActive: {
    backgroundColor: Palette.navyMid,
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
  tabCount: {
    fontFamily: Fonts.sansBold,
    fontSize:   11,
    color:      '#3A4A60',
  },

  // Grid
  grid: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[4],
    paddingBottom:     Space[10],
  },
  row: {
    gap:          Space[4],
    marginBottom: Space[6],
  },

  // Empty
  emptyState: {
    flex:        1,
    alignItems:  'center',
    justifyContent: 'center',
    paddingHorizontal: Space[10],
    gap:         12,
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
