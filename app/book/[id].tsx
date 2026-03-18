import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Dimensions, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { ALL_BOOKS } from '@/constants/Books';
import { SAMPLE_CONTENT, TextSection } from '@/constants/SampleText';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

import { useLibraryStore } from '@/store/useLibraryStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useReaderColors } from '@/hooks/useTheme';

import ReaderToolbar from '@/components/reader/ReaderToolbar';
import ReaderSettings from '@/components/reader/ReaderSettings';
import GoldDivider from '@/components/ui/GoldDivider';
import BookCover from '@/components/library/BookCover';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;
const READER_MAX_W = Math.min(SCREEN_W, isTablet ? 760 : SCREEN_W);

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = ALL_BOOKS.find(b => b.id === id);

  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [activeChapter,  setActiveChapter]  = useState(0);
  const [showToc,        setShowToc]        = useState(false);

  const {
    fontSize, hebrewFontSize, lineHeight,
    bookmarks, addBookmark, removeBookmark,
    addToLibrary, openBook,
  } = useLibraryStore();

  const { isActive } = useSubscriptionStore();
  const colors = useReaderColors();

  const scrollRef = useRef<ScrollView>(null);
  const lastTap   = useRef<number>(0);

  // Open book tracking
  React.useEffect(() => {
    if (book) {
      openBook(book.id);
      addToLibrary(book.id);
    }
  }, [book?.id]);

  if (!book) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Book not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const chapter     = book.chapters[activeChapter];
  const content     = SAMPLE_CONTENT[book.id] ?? SAMPLE_CONTENT['default'];
  const isPaywalled = book.requiresSub && !isActive;
  const isBookmarked = bookmarks.some(
    bm => bm.bookId === book.id && bm.chapterId === chapter?.id,
  );

  function handleBookmark() {
    if (isBookmarked) {
      const bm = bookmarks.find(b => b.bookId === book.id && b.chapterId === chapter?.id);
      if (bm) removeBookmark(bm.id);
    } else if (chapter) {
      addBookmark({ bookId: book.id, chapterId: chapter.id, page: 1 });
    }
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // double-tap: hide toolbar
      setToolbarVisible(false);
    } else {
      setToolbarVisible(v => !v);
    }
    lastTap.current = now;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.bg === '#0F1825' ? 'light' : 'dark'} />

      {/* Toolbar */}
      <ReaderToolbar
        title={book.title}
        hebrewTitle={book.hebrewTitle}
        visible={toolbarVisible}
        isBookmarked={isBookmarked}
        onSettingsPress={() => setSettingsOpen(true)}
        onBookmarkPress={handleBookmark}
      />

      {/* Main scroll area */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: READER_MAX_W, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setToolbarVisible(false)}
      >
        <Pressable onPress={handleTap} style={styles.tapArea}>

          {/* Book title area */}
          <View style={styles.bookHeader}>
            <View style={styles.coverMini}>
              <BookCover book={book} width={80} height={120} showSpine={false} />
            </View>
            <View style={styles.bookHeaderText}>
              {book.hebrewTitle && (
                <Text style={[styles.titleHebrew, { color: colors.heading }]}>
                  {book.hebrewTitle}
                </Text>
              )}
              <Text style={[styles.titleEnglish, { color: colors.text }]}>
                {book.title}
              </Text>
              {book.authors[0] && (
                <Text style={[styles.authorName, { color: colors.muted }]}>
                  {book.authors[0].name}
                  {book.authors[0].years ? `  ·  ${book.authors[0].years}` : ''}
                </Text>
              )}
            </View>
          </View>

          <GoldDivider marginVertical={20} opacity={0.35} />

          {/* Chapter picker */}
          {book.chapters.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chapterScroll}
            >
              {book.chapters.map((ch, i) => (
                <Pressable
                  key={ch.id}
                  style={[
                    styles.chapterPill,
                    { borderColor: colors.divider },
                    activeChapter === i && { backgroundColor: Palette.navyMid, borderColor: Palette.goldMid },
                  ]}
                  onPress={() => {
                    setActiveChapter(i);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  {ch.hebrewTitle && (
                    <Text style={[styles.chapterPillHeb, {
                      color: activeChapter === i ? Palette.goldBright : colors.muted,
                    }]}>
                      {ch.hebrewTitle}
                    </Text>
                  )}
                  <Text style={[styles.chapterPillEn, {
                    color: activeChapter === i ? '#EDE8DD' : colors.muted,
                  }]}>
                    {ch.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <GoldDivider marginVertical={16} opacity={0.25} />

          {/* ── Actual text content ─────────────────────────────────── */}
          {(isPaywalled ? content.slice(0, 3) : content).map((section, i) =>
            renderSection(section, i, colors, fontSize, hebrewFontSize, lineHeight),
          )}

          {/* ── Paywall curtain ─────────────────────────────────────── */}
          {isPaywalled && (
            <PaywallCurtain bookId={book.id} />
          )}

          {/* ── End of chapter nav ──────────────────────────────────── */}
          {!isPaywalled && (
            <View style={styles.chapterNav}>
              <GoldDivider marginVertical={24} opacity={0.3} />
              <View style={styles.chapterNavRow}>
                <Pressable
                  style={[styles.navBtn, { borderColor: colors.divider }]}
                  disabled={activeChapter === 0}
                  onPress={() => {
                    setActiveChapter(p => p - 1);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <Text style={[styles.navBtnText, { color: colors.muted }]}>
                    ← Previous
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.navBtn, { borderColor: colors.divider }]}
                  disabled={activeChapter >= book.chapters.length - 1}
                  onPress={() => {
                    setActiveChapter(p => p + 1);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <Text style={[styles.navBtnText, { color: colors.muted }]}>
                    Next →
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ height: 80 }} />
        </Pressable>
      </ScrollView>

      {/* Settings sheet */}
      <ReaderSettings visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

// ── Section renderer ──────────────────────────────────────────────────────

function renderSection(
  s: TextSection,
  i: number,
  colors: ReturnType<typeof useReaderColors>,
  engSize: number,
  hebSize: number,
  lh: number,
) {
  switch (s.type) {
    case 'heading':
      return (
        <View key={i} style={sectionStyles.headingBlock}>
          {s.verseRef && (
            <Text style={[sectionStyles.headingHebrew, { color: colors.gold }]}>
              {s.verseRef}
            </Text>
          )}
          <Text style={[sectionStyles.heading, { color: colors.heading }]}>
            {s.content}
          </Text>
        </View>
      );

    case 'hebrew':
      return (
        <View key={i} style={sectionStyles.hebrewBlock}>
          {s.verseRef && (
            <Text style={[sectionStyles.verseRef, { color: colors.gold + 'AA' }]}>
              {s.verseRef}
            </Text>
          )}
          <Text style={[
            sectionStyles.hebrewText,
            { color: colors.text, fontSize: hebSize, lineHeight: hebSize * lh },
          ]}>
            {s.content}
          </Text>
        </View>
      );

    case 'english':
      return (
        <View key={i} style={sectionStyles.englishBlock}>
          {s.verseRef && (
            <Text style={[sectionStyles.verseRefEn, { color: colors.gold + 'AA' }]}>
              {s.verseRef}
            </Text>
          )}
          <Text style={[
            sectionStyles.englishText,
            { color: colors.text, fontSize: engSize, lineHeight: engSize * lh },
          ]}>
            {s.content}
          </Text>
        </View>
      );

    case 'commentary':
      return (
        <View key={i} style={[sectionStyles.commentaryBlock, { borderLeftColor: colors.gold + '60' }]}>
          <Text style={[
            sectionStyles.commentaryText,
            { color: colors.muted, fontSize: Math.max(13, engSize - 3), lineHeight: (engSize - 3) * lh },
          ]}>
            {s.content}
          </Text>
        </View>
      );

    case 'divider':
      return <GoldDivider key={i} marginVertical={20} opacity={0.2} />;

    default:
      return null;
  }
}

// ── Paywall curtain ───────────────────────────────────────────────────────

function PaywallCurtain({ bookId }: { bookId: string }) {
  return (
    <View style={paywallStyles.container}>
      <LinearGradient
        colors={['transparent', '#F5EFE0F5', '#F5EFE0']}
        style={paywallStyles.gradient}
        pointerEvents="none"
      />
      <View style={paywallStyles.card}>
        <Text style={paywallStyles.star}>✦</Text>
        <Text style={paywallStyles.hebrewTitle}>המשך ללמוד</Text>
        <Text style={paywallStyles.title}>Continue Reading</Text>
        <Text style={paywallStyles.body}>
          Subscribe to Albert to unlock every sefer in our library — classic, modern, and children's books.
        </Text>
        <Pressable
          style={paywallStyles.btn}
          onPress={() => router.push('/subscribe')}
        >
          <LinearGradient
            colors={[Palette.goldBright, Palette.goldMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={paywallStyles.btnGrad}
          >
            <Text style={paywallStyles.btnText}>View Subscription Plans</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.push('/subscribe')}>
          <Text style={paywallStyles.trialText}>Start 7-day free trial →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? Space[10] : Space[6],
    paddingTop:        Platform.OS === 'ios' ? 110 : 90,
    paddingBottom:     Space[10],
  },
  tapArea: {
    flex: 1,
  },

  // Book header
  bookHeader: {
    flexDirection: 'row',
    gap:           Space[5],
    alignItems:    'flex-start',
  },
  coverMini: {
    flexShrink: 0,
  },
  bookHeaderText: {
    flex:           1,
    gap:            4,
    paddingTop:     Space[2],
  },
  titleHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   22,
    textAlign:  'right',
    lineHeight: 30,
  },
  titleEnglish: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    lineHeight: 26,
  },
  authorName: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    lineHeight: 18,
  },

  // Chapter nav
  chapterScroll: {
    gap:           8,
    paddingBottom: 4,
  },
  chapterPill: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    gap:               2,
    alignItems:        'center',
  },
  chapterPillHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
  },
  chapterPillEn: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
  },

  // Bottom nav
  chapterNav: {
    marginTop: Space[6],
  },
  chapterNavRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:            Space[4],
  },
  navBtn: {
    flex:             1,
    paddingVertical:  14,
    borderRadius:     Radius.md,
    borderWidth:      1,
    alignItems:       'center',
  },
  navBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
  },

  // Error
  notFound: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor:'#0D1220',
    gap:            12,
  },
  notFoundText: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      '#EDE8DD',
  },
  notFoundLink: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
});

const sectionStyles = StyleSheet.create({
  headingBlock: {
    marginBottom: Space[5],
    gap:          4,
    alignItems:   'flex-start',
  },
  headingHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   20,
    lineHeight: 28,
  },
  heading: {
    fontFamily: Fonts.serifBold,
    fontSize:   22,
    lineHeight: 30,
  },

  hebrewBlock: {
    marginBottom:  Space[3],
    alignItems:    'flex-end',
    paddingRight:  isTablet ? Space[8] : 0,
  },
  verseRef: {
    fontFamily:   Fonts.hebrewMedium,
    fontSize:     11,
    letterSpacing: 0.5,
    marginBottom:  4,
  },
  hebrewText: {
    fontFamily: Fonts.hebrewRegular,
    textAlign:  'right',
  },

  englishBlock: {
    marginBottom: Space[4],
    paddingLeft:  isTablet ? Space[8] : 0,
  },
  verseRefEn: {
    fontFamily: Fonts.sansMedium,
    fontSize:   10,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  englishText: {
    fontFamily: Fonts.serifRegular,
  },

  commentaryBlock: {
    marginTop:   Space[2],
    marginBottom:Space[5],
    paddingLeft: Space[4],
    borderLeftWidth: 2,
  },
  commentaryText: {
    fontFamily: Fonts.serifItalic,
  },
});

const paywallStyles = StyleSheet.create({
  container: {
    marginTop: -80,
  },
  gradient: {
    height: 100,
  },
  card: {
    backgroundColor: '#F5EFE0',
    borderRadius:    Radius.xl,
    padding:         Space[7],
    alignItems:      'center',
    gap:             Space[3],
    borderWidth:     1,
    borderColor:     Palette.goldMid + '40',
  },
  star: {
    fontSize: 20,
    color:    Palette.goldMid,
  },
  hebrewTitle: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   20,
    color:      Palette.navyMid,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   20,
    color:      Palette.navyMid,
  },
  body: {
    fontFamily: Fonts.serifRegular,
    fontSize:   15,
    color:      '#6B5B3E',
    textAlign:  'center',
    lineHeight: 23,
  },
  btn: {
    marginTop: Space[2],
    width:     '100%',
  },
  btnGrad: {
    paddingVertical:   14,
    borderRadius:      Radius.pill,
    alignItems:        'center',
  },
  btnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   15,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },
  trialText: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      Palette.navyMid,
    marginTop:  4,
  },
});
