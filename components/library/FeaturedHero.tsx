import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Radius, Space } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import BookCover from './BookCover';
import PressableScale from '../ui/PressableScale';
import GoldDivider from '../ui/GoldDivider';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

interface Props {
  book: Book;
}

export default function FeaturedHero({ book }: Props) {
  function handlePress() {
    router.push({ pathname: '/book/[id]', params: { id: book.id } });
  }

  const coverW = isTablet ? 180 : 140;
  const coverH = Math.round(coverW * 1.5);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...book.coverGradient, '#0F1A35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative background pattern */}
      <View style={styles.patternOverlay} />

      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        {/* Cover */}
        <PressableScale onPress={handlePress} style={styles.coverBtn}>
          <BookCover book={book} width={coverW} height={coverH} />
        </PressableScale>

        {/* Text content */}
        <View style={[styles.textBlock, isTablet && styles.textBlockTablet]}>
          <Text style={styles.featuredLabel}>✦  Featured Book  ✦</Text>

          <GoldDivider marginVertical={8} opacity={0.4} />

          {book.hebrewTitle ? (
            <Text style={styles.hebrewTitle}>{book.hebrewTitle}</Text>
          ) : null}

          <Text style={styles.title}>{book.title}</Text>

          {book.subtitle ? (
            <Text style={styles.subtitle}>{book.subtitle}</Text>
          ) : null}

          <Text style={styles.author}>
            {book.authors.map(a => a.name).join(' · ')}
          </Text>

          <GoldDivider marginVertical={10} opacity={0.3} />

          <Text style={styles.description} numberOfLines={3}>
            {book.description}
          </Text>

          <PressableScale onPress={handlePress} style={styles.readBtn}>
            <LinearGradient
              colors={[Palette.goldBright, Palette.goldMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.readBtnGradient}
            >
              <Text style={styles.readBtnText}>Open Book</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Space[5],
    marginBottom:     Space[8],
    borderRadius:     Radius.xl,
    overflow:         'hidden',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    // SVG pattern would go here via backgroundImage on web
  },
  inner: {
    flexDirection:  'row',
    padding:        Space[6],
    gap:            Space[5],
    alignItems:     'center',
  },
  innerTablet: {
    padding: Space[8],
    gap:     Space[8],
  },
  coverBtn: {
    flexShrink: 0,
  },
  textBlock: {
    flex:           1,
    gap:            4,
  },
  textBlockTablet: {
    gap: 6,
  },
  featuredLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   10,
    color:      Palette.goldBright,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hebrewTitle: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   22,
    color:      Palette.goldBright,
    textAlign:  'right',
    lineHeight: 30,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      '#FDFAF4',
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#C8C0A8',
    lineHeight: 19,
  },
  author: {
    fontFamily: Fonts.serifRegular,
    fontSize:   13,
    color:      '#A89880',
    lineHeight: 18,
  },
  description: {
    fontFamily: Fonts.serifRegular,
    fontSize:   13,
    color:      '#B0A890',
    lineHeight: 20,
  },
  readBtn: {
    marginTop:  Space[3],
    alignSelf:  'flex-start',
  },
  readBtnGradient: {
    paddingHorizontal: Space[6],
    paddingVertical:   Space[3],
    borderRadius:      Radius.pill,
  },
  readBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   14,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },
});
