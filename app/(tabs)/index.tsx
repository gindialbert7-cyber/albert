import React, { useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Animated,
  Platform, StatusBar, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import {
  ALL_BOOKS, FEATURED_BOOKS, CLASSIC_SEFARIM,
  CHILDRENS_BOOKS, MODERN_BOOKS, FREE_BOOKS, PRAYER_BOOKS,
} from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { getShabbatInfo } from '@/constants/DailyContent';

import FeaturedHero from '@/components/library/FeaturedHero';
import BookShelf from '@/components/library/BookShelf';
import GoldDivider from '@/components/ui/GoldDivider';
import DailyLearningCard from '@/components/home/DailyLearningCard';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroBook = FEATURED_BOOKS[0];

  const { recentBooks, myBooks, streak } = useLibraryStore();
  const { isActive, isTrialing }         = useSubscriptionStore();
  const shabbat = getShabbatInfo();
  const hasSubscription = isActive || isTrialing;
  const bookMap = Object.fromEntries(ALL_BOOKS.map(b => [b.id, b]));

  const continueBooks = recentBooks
    .map(id => bookMap[id])
    .filter(Boolean)
    .slice(0, 8);

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

          {/* Streak + Shabbat row */}
          {(streak > 1 || shabbat.status !== 'weekday') && (
            <View style={styles.statusRow}>
              {streak > 1 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={styles.streakText}>{streak} day streak</Text>
                </View>
              )}
              {shabbat.status !== 'weekday' && (
                <View style={[
                  styles.shabbatBadge,
                  shabbat.status === 'shabbat' && styles.shabbatBadgeActive,
                ]}>
                  <Text style={[
                    styles.shabbatBadgeHeb,
                    shabbat.status === 'shabbat' && { color: Palette.goldBright },
                  ]}>
                    {shabbat.hebrewText}
                  </Text>
                  <Text style={[
                    styles.shabbatBadgeEn,
                    shabbat.status === 'shabbat' && { color: Palette.goldMid },
                  ]}>
                    {shabbat.displayText}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Search pill — navigates to Explore */}
          <Pressable
            style={styles.searchPill}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search sefarim, authors, topics…</Text>
          </Pressable>
        </LinearGradient>

        {/* ── Featured hero ──────────────────────────────────────────── */}
        {heroBook && <FeaturedHero book={heroBook} />}

        {/* ── Daily Learning ─────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHebrew}>לימוד יומי</Text>
            <Text style={styles.sectionTitle}>Today's Learning</Text>
          </View>
        </View>
        <DailyLearningCard />

        {/* ── Continue reading ──────────────────────────────────────── */}
        {continueBooks.length > 0 && (
          <BookShelf
            title="Continue Reading"
            hebrewTitle="המשך ללמוד"
            books={continueBooks}
            onSeeAll={() => router.push('/(tabs)/library')}
            cardWidth={isTablet ? 150 : 130}
          />
        )}

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

        {/* ── Prayer & Liturgy ──────────────────────────────────────── */}
        <BookShelf
          title="Prayer & Liturgy"
          hebrewTitle="תפילה"
          books={PRAYER_BOOKS}
          cardWidth={isTablet ? 145 : 125}
        />

        {/* ── Free to Read ──────────────────────────────────────────── */}
        <BookShelf
          title="Free to Read"
          hebrewTitle="חינם"
          books={FREE_BOOKS}
          cardWidth={isTablet ? 145 : 125}
        />

        {/* ── Subscription promo banner (hidden for subscribers) ─────── */}
        {!hasSubscription && <View style={styles.promoBannerWrap}>
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
              <Pressable
                style={styles.promoBtn}
                onPress={() => router.push('/subscribe')}
              >
                <LinearGradient
                  colors={[Palette.goldBright, Palette.goldMid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.promoBtnGrad}
                >
                  <Text style={styles.promoBtnText}>Start Free Trial</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <GoldDivider marginVertical={0} opacity={0.4} />
          </LinearGradient>
        </View>}

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

  // Section header
  sectionHeaderRow: {
    paddingHorizontal: Space[5],
    marginBottom:      Space[3],
    marginTop:         Space[2],
  },
  sectionHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
    color:      Palette.goldMid,
  },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      '#EDE8DD',
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
  promoBtn: {
    marginTop: Space[3],
    width:     '100%',
  },
  promoBtnGrad: {
    paddingVertical:   14,
    borderRadius:      Radius.pill,
    alignItems:        'center',
  },
  promoBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   15,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },

  // Streak + Shabbat status row
  statusRow: {
    flexDirection:  'row',
    gap:            Space[3],
    marginTop:      Space[4],
    marginBottom:   Space[2],
    flexWrap:       'wrap',
  },
  streakBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[1],
    borderRadius:      Radius.pill,
    backgroundColor:   'rgba(232,197,71,0.12)',
    borderWidth:       1,
    borderColor:       Palette.goldMid + '30',
  },
  streakIcon: {
    fontSize: 13,
  },
  streakText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      Palette.goldBright,
  },
  shabbatBadge: {
    paddingHorizontal: Space[3],
    paddingVertical:   Space[1],
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '25',
  },
  shabbatBadgeActive: {
    backgroundColor: Palette.goldMid + '15',
    borderColor:     Palette.goldBright + '50',
  },
  shabbatBadgeHeb: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  shabbatBadgeEn: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    color:      '#5A5040',
  },
});
