import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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

type Tab = 'myBooks' | 'recent' | 'bookmarks';

export default function LibraryScreen() {
  const [tab, setTab] = useState<Tab>('myBooks');
  const { myBooks, recentBooks, bookmarks } = useLibraryStore();

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

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.headerHebrew}>הספרייה שלי</Text>
          <Text style={styles.headerTitle}>My Library</Text>
        </View>

        <GoldDivider marginVertical={8} opacity={0.3} />

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {([
            { key: 'myBooks',   label: 'My Books' },
            { key: 'recent',    label: 'Recently Read' },
            { key: 'bookmarks', label: 'Bookmarks' },
          ] as { key: Tab; label: string }[]).map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
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
      english: 'Bookmark passages you want to return to.',
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

  // Tabs
  tabBar: {
    flexDirection:    'row',
    paddingHorizontal: Space[5],
    paddingBottom:    Space[3],
    gap:              8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '25',
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
