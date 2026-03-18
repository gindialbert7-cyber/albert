import React, { useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Animated,
  Platform, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import {
  ALL_BOOKS, FEATURED_BOOKS, CLASSIC_SEFARIM,
  CHILDRENS_BOOKS, MODERN_BOOKS, FREE_BOOKS,
} from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

import FeaturedHero from '@/components/library/FeaturedHero';
import BookShelf from '@/components/library/BookShelf';
import GoldDivider from '@/components/ui/GoldDivider';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroBook = FEATURED_BOOKS[0];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Sticky compact header (fades in on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[Palette.navyDeep, Palette.navyDeep + 'F0']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.stickyLogo}>אַלְבֶּרְט</Text>
        <Text style={styles.stickyLogoEn}>ALBERT</Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── App header / hero masthead ─────────────────────────────── */}
        <LinearGradient
          colors={[Palette.navyDeep, Palette.navyMid, '#1A2744']}
          style={styles.masthead}
        >
          {/* Hebrew logo mark */}
          <View style={styles.logoBlock}>
            <Text style={styles.logoHebrew}>אַלְבֶּרְט</Text>
            <GoldDivider marginVertical={6} opacity={0.6} />
            <Text style={styles.logoTagline}>
              The Jewish Reading Library
            </Text>
          </View>

          {/* Search pill */}
          <View style={styles.searchPill}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search sefarim, authors, topics…</Text>
          </View>
        </LinearGradient>

        {/* ── Featured hero ──────────────────────────────────────────── */}
        {heroBook && <FeaturedHero book={heroBook} />}

        {/* ── Continue reading ──────────────────────────────────────── */}
        <BookShelf
          title="Continue Reading"
          books={ALL_BOOKS.slice(0, 5)}
          onSeeAll={() => router.push('/(tabs)/library')}
          cardWidth={isTablet ? 150 : 130}
        />

        {/* ── Classic Sefarim ───────────────────────────────────────── */}
        <BookShelf
          title="Classic Sefarim"
          hebrewTitle="ספרים קלאסיים"
          books={CLASSIC_SEFARIM}
          onSeeAll={() => router.push({ pathname: '/(tabs)/explore', params: { category: 'classics' } })}
          cardWidth={isTablet ? 155 : 135}
        />

        {/* ── Children's Books ──────────────────────────────────────── */}
        <BookShelf
          title="Children's Books"
          hebrewTitle="ספרי ילדים"
          books={CHILDRENS_BOOKS}
          onSeeAll={() => router.push({ pathname: '/(tabs)/explore', params: { category: 'children' } })}
          cardWidth={isTablet ? 145 : 125}
        />

        {/* ── Modern Jewish ─────────────────────────────────────────── */}
        <BookShelf
          title="Modern Jewish Books"
          books={MODERN_BOOKS}
          onSeeAll={() => router.push({ pathname: '/(tabs)/explore', params: { category: 'modern' } })}
          cardWidth={isTablet ? 150 : 130}
        />

        {/* ── Free to Read ──────────────────────────────────────────── */}
        <BookShelf
          title="Free to Read"
          books={FREE_BOOKS}
          cardWidth={isTablet ? 145 : 125}
        />

        {/* ── Subscription promo banner ─────────────────────────────── */}
        <View style={styles.promoBannerWrap}>
          <LinearGradient
            colors={[Palette.navyDeep, '#0A1020']}
            style={styles.promoBanner}
          >
            <GoldDivider marginVertical={0} opacity={0.4} />
            <View style={styles.promoContent}>
              <Text style={styles.promoHebrew}>בית המדרש שלך</Text>
              <Text style={styles.promoTitle}>Your Personal Beis Medrash</Text>
              <Text style={styles.promoBody}>
                Unlimited access to every sefer, machzor, and Jewish book —
                beautifully formatted for the way you learn.
              </Text>
              <View style={styles.promoFeatures}>
                {[
                  '✦  Every classic sefer in one place',
                  '✦  Hebrew-English bilingual layouts',
                  '✦  Highlight, bookmark & take notes',
                  '✦  Children\'s books included',
                  '✦  New books added monthly',
                ].map(f => (
                  <Text key={f} style={styles.promoFeatureText}>{f}</Text>
                ))}
              </View>
            </View>
            <GoldDivider marginVertical={0} opacity={0.4} />
          </LinearGradient>
        </View>

        <View style={{ height: Space[10] }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  stickyHeader: {
    position:   'absolute',
    top:        0,
    left:       0,
    right:      0,
    zIndex:     100,
    height:     56 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0),
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  stickyLogo: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   18,
    color:      Palette.goldBright,
  },
  stickyLogoEn: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   12,
    color:      Palette.goldMid,
    letterSpacing: 3,
  },
  scrollContent: {
    paddingTop: 0,
  },

  // Masthead
  masthead: {
    paddingTop:        Platform.OS === 'ios' ? 60 : 40,
    paddingBottom:     Space[8],
    paddingHorizontal: Space[5],
    alignItems:        'center',
    gap:               Space[5],
  },
  logoBlock: {
    alignItems: 'center',
    gap:        4,
  },
  logoHebrew: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   isTablet ? 52 : 42,
    color:      Palette.goldBright,
    letterSpacing: -1,
  },
  logoTagline: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#A89880',
    letterSpacing: 1,
  },

  // Search
  searchPill: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor:'#1A2744',
    borderRadius:   Radius.pill,
    paddingVertical:  12,
    paddingHorizontal:16,
    borderWidth:    1,
    borderColor:    Palette.goldMid + '30',
    width:          isTablet ? 480 : SCREEN_W - Space[5] * 2,
    gap:            8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchPlaceholder: {
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#5A5040',
    flex:       1,
  },

  // Promo banner
  promoBannerWrap: {
    marginHorizontal: Space[5],
    marginBottom:     Space[8],
    borderRadius:     Radius.xl,
    overflow:         'hidden',
  },
  promoBanner: {
    borderRadius: Radius.xl,
  },
  promoContent: {
    padding: Space[6],
    gap:     Space[3],
    alignItems: 'center',
  },
  promoHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   24,
    color:      Palette.goldBright,
    textAlign:  'center',
  },
  promoTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      '#FDFAF4',
    textAlign:  'center',
  },
  promoBody: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#A89880',
    textAlign:  'center',
    lineHeight: 22,
  },
  promoFeatures: {
    gap: 6,
    alignSelf: 'stretch',
    marginTop: Space[2],
  },
  promoFeatureText: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#C8BFA8',
    lineHeight: 22,
  },
});
