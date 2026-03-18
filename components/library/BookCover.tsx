import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Radius, Shadow } from '@/constants/Spacing';

interface Props {
  book:      Book;
  width?:    number;
  height?:   number;
  showSpine?: boolean;
}

export default function BookCover({ book, width = 120, height = 180, showSpine = true }: Props) {
  const spineW = showSpine ? Math.round(width * 0.08) : 0;
  const coverW = width - spineW;

  return (
    <View style={[styles.wrapper, { width, height }, Shadow.book]}>
      {/* Spine */}
      {showSpine && (
        <LinearGradient
          colors={[book.coverGradient[1], darken(book.coverGradient[1])]}
          style={[styles.spine, { width: spineW, height }]}
        />
      )}

      {/* Cover face */}
      <LinearGradient
        colors={book.coverGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cover, { width: coverW, height }]}
      >
        {/* Gold ornamental border */}
        <View style={[styles.border, { borderColor: book.coverAccent + '60' }]} />

        {/* Inner ornament line */}
        <View style={[styles.innerBorder, { borderColor: book.coverAccent + '30' }]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Top ornament */}
          <View style={styles.ornamentRow}>
            <View style={[styles.ornamentLine, { backgroundColor: book.coverAccent + '80' }]} />
            <Text style={[styles.ornamentDiamond, { color: book.coverAccent }]}>◆</Text>
            <View style={[styles.ornamentLine, { backgroundColor: book.coverAccent + '80' }]} />
          </View>

          {/* Hebrew title */}
          {book.hebrewTitle ? (
            <Text
              style={[styles.hebrewTitle, { color: book.coverAccent }]}
              numberOfLines={3}
              adjustsFontSizeToFit
            >
              {book.hebrewTitle}
            </Text>
          ) : null}

          {/* English title */}
          <Text
            style={[styles.title, { color: '#FFFFFF' }]}
            numberOfLines={3}
            adjustsFontSizeToFit
          >
            {book.title}
          </Text>

          {/* Bottom ornament */}
          <View style={styles.ornamentRow}>
            <View style={[styles.ornamentLine, { backgroundColor: book.coverAccent + '80' }]} />
            <Text style={[styles.ornamentDiamond, { color: book.coverAccent }]}>◆</Text>
            <View style={[styles.ornamentLine, { backgroundColor: book.coverAccent + '80' }]} />
          </View>

          {/* Author */}
          {book.authors[0] && (
            <Text style={[styles.author, { color: '#FFFFFF90' }]} numberOfLines={2}>
              {book.authors[0].name}
            </Text>
          )}
        </View>

        {/* Reflection overlay */}
        <LinearGradient
          colors={['#FFFFFF18', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.4 }}
          style={StyleSheet.absoluteFill}
        />
      </LinearGradient>
    </View>
  );
}

function darken(hex: string): string {
  // Simple darkening for spine effect
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.max(0, r - 30).toString(16).padStart(2, '0');
    const dg = Math.max(0, g - 30).toString(16).padStart(2, '0');
    const db = Math.max(0, b - 30).toString(16).padStart(2, '0');
    return `#${dr}${dg}${db}`;
  } catch {
    return hex;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderRadius:  Radius.sm,
    overflow:      'hidden',
  },
  spine: {
    borderTopLeftRadius:    Radius.sm,
    borderBottomLeftRadius: Radius.sm,
  },
  cover: {
    flex:     1,
    borderTopRightRadius:    Radius.sm,
    borderBottomRightRadius: Radius.sm,
    padding: 10,
    justifyContent: 'space-between',
  },
  border: {
    position:      'absolute',
    top:           6,
    left:          6,
    right:         6,
    bottom:        6,
    borderWidth:   1,
    borderRadius:  4,
  },
  innerBorder: {
    position: 'absolute',
    top:      10,
    left:     10,
    right:    10,
    bottom:   10,
    borderWidth: 0.5,
    borderRadius: 2,
  },
  content: {
    flex:           1,
    padding:        4,
    justifyContent: 'space-around',
    alignItems:     'center',
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems:    'center',
    width:         '100%',
    gap:           4,
  },
  ornamentLine: {
    flex:   1,
    height: 0.5,
  },
  ornamentDiamond: {
    fontSize: 6,
  },
  hebrewTitle: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   14,
    textAlign:  'center',
    lineHeight: 20,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   11,
    textAlign:  'center',
    lineHeight: 16,
    marginTop:  4,
  },
  author: {
    fontFamily: Fonts.serifItalic,
    fontSize:   9,
    textAlign:  'center',
  },
});
