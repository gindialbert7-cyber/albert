import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Radius, Shadow, Space } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCover from './BookCover';
import Badge from '../ui/Badge';
import PressableScale from '../ui/PressableScale';

interface Props {
  book:     Book;
  width?:   number;
  onPress?: (book: Book) => void;
}

export default function BookCard({ book, width = 130, onPress }: Props) {
  const coverH = Math.round(width * 1.5);

  function handlePress() {
    if (onPress) { onPress(book); return; }
    router.push({ pathname: '/book/[id]', params: { id: book.id } });
  }

  return (
    <PressableScale style={[styles.card, { width }]} onPress={handlePress}>
      <View style={styles.coverWrap}>
        <BookCover book={book} width={width} height={coverH} />
        {book.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        {book.hebrewTitle ? (
          <Text style={styles.hebrewTitle} numberOfLines={1}>
            {book.hebrewTitle}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.authors[0]?.name ?? ''}
        </Text>
        {!book.requiresSub && (
          <Badge label="FREE" variant="green" />
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
  },
  coverWrap: {
    position: 'relative',
  },
  newBadge: {
    position:        'absolute',
    top:             6,
    right:           0,
    backgroundColor: Palette.goldBright,
    paddingHorizontal: 6,
    paddingVertical:  2,
    borderTopLeftRadius:    4,
    borderBottomLeftRadius: 4,
  },
  newBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize:   9,
    color:      Palette.navyDeep,
    letterSpacing: 0.8,
  },
  info: {
    marginTop: Space[2],
    gap:       2,
    width:     '100%',
  },
  hebrewTitle: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   13,
    color:      Palette.goldMid,
    textAlign:  'right',
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   12,
    color:      '#EDE8DD',
    lineHeight: 17,
  },
  author: {
    fontFamily: Fonts.serifItalic,
    fontSize:   11,
    color:      '#8B8070',
    lineHeight: 15,
  },
});
