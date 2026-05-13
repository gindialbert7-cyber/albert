import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, Platform, Share, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ALL_BOOKS, CATEGORY_LABELS, Book } from '@/constants/Books';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

import BookCover from '@/components/library/BookCover';
import BookShelf from '@/components/library/BookShelf';
import GoldDivider from '@/components/ui/GoldDivider';
import ProgressBar from '@/components/ui/ProgressBar';
import { estimateReadTime } from '@/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book    = ALL_BOOKS.find(b => b.id === id);
  const [descExpanded, setDescExpanded] = useState(false);

  const { myBooks, addToLibrary, removeFromLib, positions, bookmarks } = useLibraryStore();
  const { isActive } = useSubscriptionStore();

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

  const inLibrary  = myBooks.includes(book.id);
  const pos        = positions[book.id];
  const progress   = pos?.progress ?? 0;
  const hasStarted = progress > 0;
  const isPaywalled = book.requiresSub && !isActive;

  const bookmarkCount = bookmarks.filter(bm => bm.bookId === book.id).length;

  // Related books — same category, not this book
  const relatedBooks = ALL_BOOKS
    .filter(b => b.category === book.category && b.id !== book.id)
    .slice(0, 8);

  const coverW = isTablet ? 200 : 150;
  const coverH = Math.round(coverW * 1.5);

  const handleReadNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/book/[id]', params: { id: book.id } });
  };

  const handleLibraryToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (inLibrary) {
      Alert.alert(
        'Remove from Library',
        `Remove "${book.title}" from your library?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeFromLib(book.id) },
        ],
      );
    } else {
      addToLibrary(book.id);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `I'm reading "${book.title}"${book.hebrewTitle ? ` (${book.hebrewTitle})` : ''} on Albert — the Jewish Reading Library.`,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Hero gradient header */}
      <LinearGradient
        colors={[...book.coverGradient, '#0A1220']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroGradient}
      />

      {/* Back button */}
      <SafeAreaView edges={['top']} style={styles.backRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero area ─────────────────────────────────────────────── */}
        <View style={[styles.hero, isTablet && styles.heroTablet]}>
          {/* Book cover */}
          <View style={styles.coverShadow}>
            <BookCover book={book} width={coverW} height={coverH} />
          </View>

          {/* Metadata */}
          <View style={styles.heroMeta}>
            {/* Category badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {CATEGORY_LABELS[book.category] ?? book.category}
              </Text>
            </View>

            {book.hebrewTitle && (
              <Text style={styles.hebrewTitle}>{book.hebrewTitle}</Text>
            )}
            <Text style={styles.title}>{book.title}</Text>

            {book.subtitle && (
              <Text style={styles.subtitle}>{book.subtitle}</Text>
            )}

            {/* Authors */}
            <View style={styles.authorsBlock}>
              {book.authors.map((author, i) => (
                <Text key={i} style={styles.author}>
                  {author.hebrew ? `${author.hebrew}  ·  ` : ''}{author.name}
                  {author.years ? `  (${author.years})` : ''}
                </Text>
              ))}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatPill icon="📄" value={`${book.pageCount} pp`} />
              <StatPill icon="📚" value={`${book.chapters.length} ${book.chapters.length === 1 ? 'ch' : 'ch'}`} />
              <StatPill icon="⏱" value={estimateReadTime(book.pageCount)} />
              {book.publishYear && <StatPill icon="🕰️" value={String(book.publishYear)} />}
              {!book.requiresSub && <StatPill icon="✓" value="Free" highlight />}
            </View>

            {/* Reading progress */}
            {hasStarted && (
              <View style={styles.progressBlock}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Reading progress</Text>
                  <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
                </View>
                <ProgressBar progress={progress} height={5} trackColor="#1E2A40" fillColor={Palette.goldBright} />
                {pos?.chapterIdx !== undefined && (
                  <Text style={styles.progressChapter}>
                    Last read: {book.chapters[pos.chapterIdx]?.title ?? 'Beginning'}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <View style={styles.ctaRow}>
          <Pressable style={styles.readBtn} onPress={handleReadNow}>
            <LinearGradient
              colors={[Palette.goldBright, Palette.goldMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.readBtnGrad}
            >
              <Text style={styles.readBtnText}>
                {hasStarted ? '▶  Continue Reading' : '▶  Start Reading'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[styles.libBtn, inLibrary && styles.libBtnActive]}
            onPress={handleLibraryToggle}
          >
            <Text style={[styles.libBtnText, inLibrary && styles.libBtnTextActive]}>
              {inLibrary ? '✓  In Library' : '+  Add to Library'}
            </Text>
          </Pressable>
        </View>

        {/* Paywall notice */}
        {isPaywalled && (
          <Pressable style={styles.paywallNotice} onPress={() => router.push('/subscribe')}>
            <LinearGradient
              colors={[Palette.navyMid, Palette.navyDeep]}
              style={styles.paywallNoticeInner}
            >
              <Text style={styles.paywallIcon}>✦</Text>
              <Text style={styles.paywallText}>
                Subscribe to read the full text of this sefer
              </Text>
              <Text style={styles.paywallCta}>View Plans →</Text>
            </LinearGradient>
          </Pressable>
        )}

        <GoldDivider marginVertical={24} opacity={0.3} />

        {/* ── Description ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHebrew}>אודות הספר</Text>
          <Text style={styles.sectionTitle}>About This Book</Text>
          <Text
            style={styles.description}
            numberOfLines={descExpanded ? undefined : 4}
          >
            {book.description}
          </Text>
          {book.description.length > 200 && (
            <Pressable onPress={() => setDescExpanded(v => !v)}>
              <Text style={styles.readMoreBtn}>
                {descExpanded ? 'Show less ↑' : 'Read more ↓'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Tags ───────────────────────────────────────────────────── */}
        {book.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {book.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <GoldDivider marginVertical={24} opacity={0.2} />

        {/* ── Table of contents ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHebrew}>תוכן עניינים</Text>
          <Text style={styles.sectionTitle}>Table of Contents</Text>
          <View style={styles.tocList}>
            {book.chapters.map((ch, idx) => {
              const isCurrentChapter = pos?.chapterIdx === idx;
              return (
                <Pressable
                  key={ch.id}
                  style={[styles.tocRow, isCurrentChapter && styles.tocRowActive]}
                  onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
                >
                  <View style={styles.tocLeft}>
                    <Text style={[styles.tocNum, isCurrentChapter && styles.tocNumActive]}>
                      {String(idx + 1).padStart(2, '0')}
                    </Text>
                    <View>
                      {ch.hebrewTitle && (
                        <Text style={[styles.tocHebrew, isCurrentChapter && styles.tocHebrewActive]}>
                          {ch.hebrewTitle}
                        </Text>
                      )}
                      <Text style={[styles.tocTitle, isCurrentChapter && styles.tocTitleActive]}>
                        {ch.title}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tocRight}>
                    <Text style={styles.tocPages}>{ch.pages}p</Text>
                    {isCurrentChapter && (
                      <View style={styles.tocCurrentDot} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Bookmarks summary ─────────────────────────────────────── */}
        {bookmarkCount > 0 && (
          <>
            <GoldDivider marginVertical={24} opacity={0.2} />
            <Pressable
              style={styles.bookmarkSummary}
              onPress={() => router.push('/notes')}
            >
              <Text style={styles.bookmarkSummaryIcon}>🔖</Text>
              <Text style={styles.bookmarkSummaryText}>
                {bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''} saved in this book
              </Text>
              <Text style={styles.bookmarkSummaryArrow}>→</Text>
            </Pressable>
          </>
        )}

        {/* ── Related books ──────────────────────────────────────────── */}
        {relatedBooks.length > 0 && (
          <>
            <GoldDivider marginVertical={24} opacity={0.2} />
            <BookShelf
              title="More in This Category"
              hebrewTitle={book.category === 'torah' ? 'עוד תורה' :
                           book.category === 'chasidus' ? 'עוד חסידות' :
                           book.category === 'mussar' ? 'עוד מוסר' : undefined}
              books={relatedBooks}
              cardWidth={isTablet ? 140 : 120}
            />
          </>
        )}

        <View style={{ height: Space[10] }} />
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.stickyBottom}>
        <LinearGradient
          colors={['transparent', '#0A1220F0', '#0A1220']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable style={styles.stickyReadBtn} onPress={handleReadNow}>
          <LinearGradient
            colors={[Palette.goldBright, Palette.goldMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stickyReadBtnGrad}
          >
            <Text style={styles.stickyReadBtnText}>
              {hasStarted ? `Continue Reading  ·  ${Math.round(progress * 100)}%` : 'Start Reading'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatPill({ icon, value, highlight }: { icon: string; value: string; highlight?: boolean }) {
  return (
    <View style={[statPill.container, highlight && statPill.containerHL]}>
      <Text style={statPill.icon}>{icon}</Text>
      <Text style={[statPill.value, highlight && statPill.valueHL]}>{value}</Text>
    </View>
  );
}

const statPill = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    backgroundColor:'#0A1428',
    borderRadius:   Radius.pill,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:    1,
    borderColor:    '#1E2A40',
  },
  containerHL: {
    backgroundColor: Palette.goldMid + '20',
    borderColor:     Palette.goldMid + '60',
  },
  icon: { fontSize: 11 },
  value: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#8B8070',
  },
  valueHL: {
    color: Palette.goldBright,
    fontFamily: Fonts.sansBold,
  },
});

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0A1220',
  },
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

  // Gradient bg
  heroGradient: {
    position: 'absolute',
    top:      0, left: 0, right: 0,
    height:   isTablet ? 500 : 420,
    opacity:  0.7,
  },

  // Back / share row
  backRow: {
    position:         'absolute',
    top:              0, left: 0, right: 0,
    zIndex:           100,
    flexDirection:    'row',
    justifyContent:   'space-between',
    paddingHorizontal: Space[5],
    paddingTop:       Platform.OS === 'ios' ? 50 : 16,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius:    Radius.pill,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  backBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      '#EDE8DD',
  },
  shareBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius:    Radius.pill,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  shareBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldBright,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop:    Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 120,
  },

  // Hero
  hero: {
    flexDirection:    'column',
    alignItems:       'center',
    paddingHorizontal: Space[6],
    paddingBottom:     Space[6],
    gap:               Space[6],
  },
  heroTablet: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  coverShadow: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius:  20,
    elevation:     20,
  },
  heroMeta: {
    gap:       Space[3],
    alignSelf: 'stretch',
  },
  categoryBadge: {
    alignSelf:       'flex-start',
    backgroundColor: Palette.navyMid,
    borderRadius:    Radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:     1,
    borderColor:     Palette.goldMid + '40',
  },
  categoryText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   11,
    color:      Palette.goldMid,
    letterSpacing: 0.3,
  },
  hebrewTitle: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   28,
    color:      Palette.goldBright,
    textAlign:  'right',
    lineHeight: 38,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   26,
    color:      '#EDE8DD',
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
    color:      '#8B8070',
    lineHeight: 22,
  },
  authorsBlock: {
    gap: 2,
  },
  author: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#A89880',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
    marginTop:     Space[2],
  },

  // Progress
  progressBlock: {
    gap:           Space[2],
    marginTop:     Space[2],
  },
  progressHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  progressLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#5A5040',
  },
  progressPct: {
    fontFamily: Fonts.sansBold,
    fontSize:   13,
    color:      Palette.goldBright,
  },
  progressChapter: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#3A4050',
  },

  // CTAs
  ctaRow: {
    paddingHorizontal: Space[6],
    gap:               Space[3],
    marginBottom:      Space[2],
  },
  readBtn: {
    borderRadius: Radius.pill,
    overflow:     'hidden',
  },
  readBtnGrad: {
    paddingVertical:   15,
    alignItems:        'center',
    borderRadius:      Radius.pill,
  },
  readBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },
  libBtn: {
    paddingVertical:   12,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '50',
    alignItems:        'center',
  },
  libBtnActive: {
    backgroundColor: Palette.navyMid,
    borderColor:     Palette.goldMid,
  },
  libBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  libBtnTextActive: {
    color: Palette.goldBright,
  },

  // Paywall notice
  paywallNotice: {
    marginHorizontal: Space[6],
    marginBottom:     Space[3],
    borderRadius:     Radius.lg,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      Palette.goldMid + '30',
  },
  paywallNoticeInner: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Space[4],
    gap:            Space[3],
  },
  paywallIcon: {
    fontSize: 16,
    color:    Palette.goldBright,
  },
  paywallText: {
    flex:       1,
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#A89880',
  },
  paywallCta: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      Palette.goldBright,
  },

  // Sections
  section: {
    paddingHorizontal: Space[6],
    gap:               Space[3],
    marginBottom:      Space[4],
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
  description: {
    fontFamily: Fonts.serifRegular,
    fontSize:   16,
    color:      '#A89880',
    lineHeight: 26,
  },
  readMoreBtn: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      Palette.goldMid,
    marginTop:  Space[1],
  },

  // Tags
  tagsRow: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    gap:              8,
    paddingHorizontal: Space[6],
    marginBottom:     Space[2],
  },
  tag: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  tagText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#5A5040',
  },

  // TOC
  tocList: {
    borderRadius:  Radius.lg,
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   '#1E2A40',
  },
  tocRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: 14,
    paddingHorizontal: Space[4],
    borderBottomWidth: 1,
    borderBottomColor: '#1A2030',
    backgroundColor: '#0F1828',
  },
  tocRowActive: {
    backgroundColor: Palette.navyMid,
    borderBottomColor: Palette.goldMid + '20',
  },
  tocLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
    flex:          1,
  },
  tocNum: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      '#3A4050',
    minWidth:   24,
  },
  tocNumActive: {
    color: Palette.goldMid,
  },
  tocHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
    color:      '#5A6070',
  },
  tocHebrewActive: {
    color: Palette.goldBright,
  },
  tocTitle: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#8B8070',
  },
  tocTitleActive: {
    fontFamily: Fonts.serifBold,
    color:      '#EDE8DD',
  },
  tocRight: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Space[2],
    flexShrink:     0,
  },
  tocPages: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#3A4050',
  },
  tocCurrentDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Palette.goldBright,
  },

  // Bookmark summary
  bookmarkSummary: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Space[3],
    marginHorizontal: Space[6],
    marginBottom:     Space[2],
    backgroundColor:  '#141B30',
    borderRadius:     Radius.md,
    padding:          Space[4],
    borderWidth:      1,
    borderColor:      '#1E2A40',
  },
  bookmarkSummaryIcon: { fontSize: 18 },
  bookmarkSummaryText: {
    flex:       1,
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#C8BFA8',
  },
  bookmarkSummaryArrow: {
    fontFamily: Fonts.sansMedium,
    fontSize:   16,
    color:      Palette.goldMid,
  },

  // Sticky bottom CTA
  stickyBottom: {
    position:        'absolute',
    bottom:          0, left: 0, right: 0,
    paddingBottom:   Platform.OS === 'ios' ? 34 : 16,
    paddingTop:      40,
    paddingHorizontal: Space[6],
    justifyContent:  'flex-end',
  },
  stickyReadBtn: {
    borderRadius: Radius.pill,
    overflow:     'hidden',
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:0.4,
    shadowRadius: 12,
    elevation:    8,
  },
  stickyReadBtnGrad: {
    paddingVertical:   16,
    alignItems:        'center',
    borderRadius:      Radius.pill,
  },
  stickyReadBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   15,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },
});
