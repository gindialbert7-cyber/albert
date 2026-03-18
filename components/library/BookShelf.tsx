import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCard from './BookCard';

interface Props {
  title:       string;
  hebrewTitle?: string;
  books:       Book[];
  onSeeAll?:   () => void;
  cardWidth?:  number;
}

export default function BookShelf({ title, hebrewTitle, books, onSeeAll, cardWidth = 130 }: Props) {
  if (!books.length) return null;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          {hebrewTitle ? (
            <Text style={styles.hebrewLabel}>{hebrewTitle}</Text>
          ) : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal scroll of book cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {books.map(book => (
          <BookCard key={book.id} book={book} width={cardWidth} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Space[8],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Space[5],
    marginBottom:   Space[4],
  },
  titleBlock: {
    gap: 2,
  },
  hebrewLabel: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   13,
    color:      Palette.goldMid,
    textAlign:  'left',
  },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      '#EDE8DD',
    lineHeight: 26,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      99,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '60',
  },
  seeAllText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      Palette.goldMid,
  },
  scrollContent: {
    paddingHorizontal: Space[5],
    gap:               Space[4],
  },
});
