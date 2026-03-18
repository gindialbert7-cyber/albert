/**
 * Collection screen — shows all books in a curated collection
 * Route: /collection/[id]?title=...&hebrew=...&bookIds=id1,id2,...
 */
import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ALL_BOOKS, Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCard from '@/components/library/BookCard';
import GoldDivider from '@/components/ui/GoldDivider';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;
const CARD_W   = isTablet ? 150 : 130;
const COLS     = isTablet ? Math.floor((SCREEN_W - 40) / (CARD_W + 16)) : 3;

export default function CollectionScreen() {
  const params = useLocalSearchParams<{
    id:      string;
    title:   string;
    hebrew:  string;
    desc:    string;
    bookIds: string;
  }>();

  const bookIds = (params.bookIds ?? '').split(',').filter(Boolean);
  const books: Book[] = bookIds
    .map(id => ALL_BOOKS.find(b => b.id === id))
    .filter((b): b is Book => !!b);

  function renderBook({ item }: { item: Book }) {
    return <BookCard book={item} width={CARD_W} />;
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.safeTop}>
        {/* Back button */}
        <View style={s.topBar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Palette.goldMid} />
            <Text style={s.backText}>Back</Text>
          </Pressable>
        </View>

        {/* Header */}
        <View style={s.header}>
          {params.hebrew ? (
            <Text style={s.headerHebrew}>{params.hebrew}</Text>
          ) : null}
          <Text style={s.headerTitle}>{params.title ?? 'Collection'}</Text>
          {params.desc ? (
            <Text style={s.headerDesc}>{params.desc}</Text>
          ) : null}
        </View>

        <GoldDivider marginVertical={0} opacity={0.2} />
        <Text style={s.countLine}>{books.length} books</Text>
      </SafeAreaView>

      <FlatList
        data={books}
        keyExtractor={b => b.id}
        renderItem={renderBook}
        numColumns={COLS}
        columnWrapperStyle={COLS > 1 ? s.row : undefined}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  safeTop: {
    backgroundColor: '#0D1220',
  },
  topBar: {
    paddingHorizontal: Space[4],
    paddingTop:        Space[2],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
    paddingVertical: Space[2],
  },
  backText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   15,
    color:      Palette.goldMid,
  },
  header: {
    paddingHorizontal: Space[5],
    paddingVertical:   Space[4],
    gap:               4,
  },
  headerHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
  },
  headerDesc: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#8B8070',
    lineHeight: 20,
  },
  countLine: {
    fontFamily:        Fonts.sansRegular,
    fontSize:          12,
    color:             '#4A4030',
    paddingHorizontal: Space[5],
    paddingVertical:   Space[3],
  },
  grid: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[2],
    paddingBottom:     Space[12],
  },
  row: {
    gap:          Space[4],
    marginBottom: Space[6],
  },
});
