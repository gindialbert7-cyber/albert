import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Radius, Shadow, Space } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import { useLibraryStore } from '@/store/useLibraryStore';
import BookCover from './BookCover';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import PressableScale from '../ui/PressableScale';

interface Props {
  book:     Book;
  width?:   number;
  onPress?: (book: Book) => void;
}

export default function BookCard({ book, width = 130, onPress }: Props) {
  const coverH  = Math.round(width * 1.5);
  const positions = useLibraryStore(s => s.positions);
  const pos       = positions[book.id];
  const progress  = pos?.progress ?? 0;
  const hasStarted = progress > 0;

  function handlePress() {
    if (onPress) { onPress(book); return; }
    router.push({ pathname: '/book-detail/[id]', params: { id: book.id } });
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
        {hasStarted && (
          <View style={styles.progressWrap}>
            <ProgressBar
              progress={progress}
              height={3}
              trackColor="rgba(0,0,0,0.4)"
              fillColor={Palette.goldBright}
            />
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
        {hasStarted && (
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% read
          </Text>
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
    width:    '100%',
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
  progressWrap: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
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
  progressText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    color:      Palette.goldMid + '90',
    marginTop:  1,
  },
});
