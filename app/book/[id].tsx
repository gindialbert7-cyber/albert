import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Dimensions, Platform, Share, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ALL_BOOKS } from '@/constants/Books';
import { SAMPLE_CONTENT, TextSection } from '@/constants/SampleText';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

import { useLibraryStore } from '@/store/useLibraryStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useReaderColors } from '@/hooks/useTheme';
import { track, Events } from '@/utils/analytics';

import ReaderToolbar from '@/components/reader/ReaderToolbar';
import ReaderSettings from '@/components/reader/ReaderSettings';
import GoldDivider from '@/components/ui/GoldDivider';
import BookCover from '@/components/library/BookCover';
import ProgressBar from '@/components/ui/ProgressBar';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;
const READER_MAX_W = Math.min(SCREEN_W, isTablet ? 760 : SCREEN_W);

const HIGHLIGHT_COLORS = [
  { color: '#FFE066', label: 'Gold' },
  { color: '#A8E6CF', label: 'Green' },
  { color: '#84B0E8', label: 'Blue' },
  { color: '#F7A8C4', label: 'Pink' },
  { color: '#C5AAFF', label: 'Purple' },
];

interface HighlightPickerState {
  visible:    boolean;
  sectionIdx: number;
  text:       string;
}

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = ALL_BOOKS.find(b => b.id === id);

  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [activeChapter,  setActiveChapter]  = useState(0);
  const [picker,         setPicker]         = useState<HighlightPickerState>({ visible: false, sectionIdx: 0, text: '' });
  const [contentHeight,  setContentHeight]  = useState(1);
  const [scrollPos,      setScrollPos]      = useState(0);
  const [viewportH,      setViewportH]      = useState(1);

  const {
    fontSize, hebrewFontSize, lineHeight,
    bookmarks, addBookmark, removeBookmark,
    addHighlight, removeHighlight, highlights,
    addToLibrary, openBook, savePosition,
    positions, recordLearning,
  } = useLibraryStore();

  const { isActive } = useSubscriptionStore();
  const colors = useReaderColors();

  const scrollRef = useRef<ScrollView>(null);
  const lastTap   = useRef<number>(0);

  // Open book tracking + analytics + learning streak
  React.useEffect(() => {
    if (book) {
      openBook(book.id);
      addToLibrary(book.id);
      recordLearning(5);
      track(Events.BOOK_OPEN, { bookId: book.id, title: book.title, category: book.category });
    }
  }, [book?.id]);

  // Record additional reading time on chapter changes
  React.useEffect(() => {
    if (book && activeChapter > 0) {
      recordLearning(3);
    }
  }, [activeChapter]);

  // Restore last position when opening
  React.useEffect(() => {
    const pos = positions[book?.id ?? ''];
    if (pos && pos.chapterIdx !== undefined) {
      setActiveChapter(pos.chapterIdx);
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

  // Calculate reading progress
  const progress = contentHeight > viewportH
    ? Math.min(1, (scrollPos + viewportH) / contentHeight)
    : 1;

  const chapterProgress = (activeChapter + progress) / Math.max(1, book.chapters.length);

  function handleScroll(event: any) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const y  = contentOffset.y;
    const h  = contentSize.height;
    const lh = layoutMeasurement.height;
    setScrollPos(y);
    setContentHeight(h);
    setViewportH(lh);

    // Save position every scroll
    if (chapter) {
      const prog = h > lh ? Math.min(1, (y + lh) / h) : 1;
      savePosition({
        bookId:     book.id,
        chapterId:  chapter.id,
        chapterIdx: activeChapter,
        scrollY:    y,
        progress:   chapterProgress,
        updatedAt:  Date.now(),
      });
    }
  }

  function handleBookmark() {
    if (isBookmarked) {
      const bm = bookmarks.find(b => b.bookId === book.id && b.chapterId === chapter?.id);
      if (bm) removeBookmark(bm.id);
    } else if (chapter) {
      addBookmark({
        bookId:       book.id,
        bookTitle:    book.title,
        chapterId:    chapter.id,
        chapterTitle: chapter.title,
        page:         1,
        excerpt:      content.find(s => s.type === 'english' || s.type === 'hebrew')?.content.slice(0, 80),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setToolbarVisible(false);
    } else {
      setToolbarVisible(v => !v);
    }
    lastTap.current = now;
  }

  function handleLongPressSection(sectionIdx: number, text: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPicker({ visible: true, sectionIdx, text });
  }

  function handleAddHighlight(color: string) {
    if (!chapter) return;
    addHighlight({
      bookId:       book.id,
      bookTitle:    book.title,
      chapterId:    chapter.id,
      chapterTitle: chapter.title,
      sectionIdx:   picker.sectionIdx,
      text:         picker.text.slice(0, 200),
      color,
    });
    setPicker({ visible: false, sectionIdx: 0, text: '' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleShare(text: string) {
    Share.share({
      message: `${text}\n\n— ${book.hebrewTitle ?? book.title}${chapter ? `, ${chapter.title}` : ''}\n\nRead on Albert`,
    });
  }

  const chapterHighlights = highlights.filter(
    h => h.bookId === book.id && h.chapterId === chapter?.id,
  );

  function getHighlightColor(idx: number): string | undefined {
    return chapterHighlights.find(h => h.sectionIdx === idx)?.color;
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

      {/* Progress bar at top */}
      <View style={[styles.topProgress, { top: Platform.OS === 'ios' ? 44 : 0 }]}>
        <ProgressBar
          progress={chapterProgress}
          height={2}
          trackColor="transparent"
          fillColor={Palette.goldMid + '90'}
        />
      </View>

      {/* Main scroll area */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: READER_MAX_W, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
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
              <View style={styles.progressRow}>
                <ProgressBar
                  progress={chapterProgress}
                  height={4}
                  trackColor={colors.divider}
                  fillColor={colors.gold}
                />
                <Text style={[styles.progressLabel, { color: colors.muted }]}>
                  {Math.round(chapterProgress * 100)}%
                </Text>
              </View>
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
            renderSection(
              section, i, colors, fontSize, hebrewFontSize, lineHeight,
              getHighlightColor(i),
              () => handleLongPressSection(i, section.content),
              () => handleShare(section.content),
            ),
          )}

          {/* ── Paywall curtain ─────────────────────────────────────── */}
          {isPaywalled && (
            <PaywallCurtain bookId={book.id} bgColor={colors.bg} />
          )}

          {/* ── End of chapter nav ──────────────────────────────────── */}
          {!isPaywalled && (
            <View style={styles.chapterNav}>
              <GoldDivider marginVertical={24} opacity={0.3} />
              <View style={styles.chapterNavRow}>
                <Pressable
                  style={[styles.navBtn, { borderColor: colors.divider }, activeChapter === 0 && styles.navBtnDisabled]}
                  disabled={activeChapter === 0}
                  onPress={() => {
                    setActiveChapter(p => p - 1);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <Text style={[styles.navBtnText, { color: activeChapter === 0 ? colors.divider : colors.muted }]}>
                    ← Previous
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.navBtn,
                    { borderColor: colors.divider },
                    activeChapter >= book.chapters.length - 1 && styles.navBtnDisabled,
                  ]}
                  disabled={activeChapter >= book.chapters.length - 1}
                  onPress={() => {
                    setActiveChapter(p => p + 1);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <Text style={[styles.navBtnText, { color: activeChapter >= book.chapters.length - 1 ? colors.divider : colors.muted }]}>
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

      {/* Highlight color picker */}
      {picker.visible && (
        <HighlightPicker
          text={picker.text}
          onPick={handleAddHighlight}
          onDismiss={() => setPicker({ visible: false, sectionIdx: 0, text: '' })}
          onShare={() => handleShare(picker.text)}
        />
      )}
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
  highlightColor: string | undefined,
  onLongPress: () => void,
  onShare: () => void,
) {
  const hl = highlightColor
    ? { backgroundColor: highlightColor + '55' }
    : {};

  switch (s.type) {
    case 'heading':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[sectionStyles.headingBlock, hl]}>
            {s.verseRef && (
              <Text style={[sectionStyles.headingHebrew, { color: colors.gold }]}>
                {s.verseRef}
              </Text>
            )}
            <Text style={[sectionStyles.heading, { color: colors.heading }]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'hebrew':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[sectionStyles.hebrewBlock, hl]}>
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
        </Pressable>
      );

    case 'english':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[sectionStyles.englishBlock, hl]}>
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
        </Pressable>
      );

    case 'commentary':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[sectionStyles.commentaryBlock, { borderLeftColor: colors.gold + '60' }, hl]}>
            <Text style={[
              sectionStyles.commentaryText,
              { color: colors.muted, fontSize: Math.max(13, engSize - 3), lineHeight: (engSize - 3) * lh },
            ]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'divider':
      return <GoldDivider key={i} marginVertical={20} opacity={0.2} />;

    default:
      return null;
  }
}

// ── Highlight picker ──────────────────────────────────────────────────────

function HighlightPicker({
  text, onPick, onDismiss, onShare,
}: { text: string; onPick: (c: string) => void; onDismiss: () => void; onShare: () => void }) {
  return (
    <Pressable style={pickerStyles.backdrop} onPress={onDismiss}>
      <Pressable style={pickerStyles.sheet} onPress={e => e.stopPropagation()}>
        <Text style={pickerStyles.previewText} numberOfLines={3}>
          "{text.slice(0, 120)}{text.length > 120 ? '…' : ''}"
        </Text>
        <GoldDivider marginVertical={12} opacity={0.2} />
        <Text style={pickerStyles.label}>Highlight color</Text>
        <View style={pickerStyles.colorRow}>
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <Pressable
              key={color}
              style={[pickerStyles.colorBtn, { backgroundColor: color }]}
              onPress={() => onPick(color)}
            >
              <Text style={pickerStyles.colorLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={pickerStyles.shareBtn} onPress={onShare}>
          <Text style={pickerStyles.shareBtnText}>Share this passage</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

// ── Paywall curtain ───────────────────────────────────────────────────────

function PaywallCurtain({ bookId, bgColor }: { bookId: string; bgColor: string }) {
  return (
    <View style={paywallStyles.container}>
      <LinearGradient
        colors={['transparent', bgColor + 'F5', bgColor]}
        style={paywallStyles.gradient}
        pointerEvents="none"
      />
      <View style={[paywallStyles.card, { backgroundColor: bgColor, borderColor: Palette.goldMid + '40' }]}>
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
  topProgress: {
    position: 'absolute',
    left:     0,
    right:    0,
    zIndex:   99,
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
  progressRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginTop:     Space[2],
  },
  progressLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    flexShrink: 0,
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
  navBtnDisabled: {
    opacity: 0.3,
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
    borderRadius: 6,
    padding:      4,
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
    borderRadius:  6,
    padding:       6,
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
    borderRadius: 6,
    padding:      6,
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
    borderRadius: 4,
    paddingVertical: 4,
  },
  commentaryText: {
    fontFamily: Fonts.serifItalic,
  },
});

const pickerStyles = StyleSheet.create({
  backdrop: {
    position:       'absolute',
    top:            0, left: 0, right: 0, bottom: 0,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex:         200,
  },
  sheet: {
    backgroundColor: '#1A2540',
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding:   Space[6],
    gap:       Space[3],
    borderTopWidth:  1,
    borderTopColor:  Palette.goldMid + '30',
  },
  previewText: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#8B8070',
    lineHeight: 20,
  },
  label: {
    fontFamily:   Fonts.sansSemiBold,
    fontSize:     12,
    color:        '#5A5040',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  colorRow: {
    flexDirection: 'row',
    gap:           10,
    flexWrap:      'wrap',
  },
  colorBtn: {
    width:          52,
    height:         52,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  4,
  },
  colorLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   9,
    color:      'rgba(0,0,0,0.6)',
  },
  shareBtn: {
    paddingVertical:   12,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '40',
    alignItems:        'center',
    marginTop:         Space[2],
  },
  shareBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldBright,
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
    borderRadius:    Radius.xl,
    padding:         Space[7],
    alignItems:      'center',
    gap:             Space[3],
    borderWidth:     1,
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
