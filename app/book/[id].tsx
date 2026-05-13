import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity,
  Pressable, Dimensions, Platform, Share, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ALL_BOOKS } from '@/constants/Books';
import { TextSection } from '@/constants/SampleText';
import { Fonts, ReaderType } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

import { useLibraryStore } from '@/store/useLibraryStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useReaderColors } from '@/hooks/useTheme';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { track, Events } from '@/utils/analytics';
import { contentService } from '@/services/contentService';
import { getAudioManifest, getClip, AudioManifest } from '@/services/audioManifestService';
import { stopActiveAudio } from '@/hooks/useAudioPlayer';

import ReaderToolbar from '@/components/reader/ReaderToolbar';
import ReaderSettings from '@/components/reader/ReaderSettings';
import AudioSection from '@/components/reader/AudioSection';
import GoldDivider from '@/components/ui/GoldDivider';
import BookCover from '@/components/library/BookCover';
import ProgressBar from '@/components/ui/ProgressBar';

// Legacy fallback — real dimensions come from useAdaptiveLayout() inside component.
const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 430;

const HIGHLIGHT_COLORS = [
  { color: '#FFE066', label: 'Gold' },
  { color: '#A8E6CF', label: 'Green' },
  { color: '#84B0E8', label: 'Blue' },
  { color: '#F7A8C4', label: 'Pink' },
  { color: '#C5AAFF', label: 'Purple' },
];

interface NoteSheetState {
  visible:    boolean;
  sectionIdx: number;
  text:       string;
}

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = ALL_BOOKS.find(b => b.id === id);

  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [tocOpen,        setTocOpen]        = useState(false);
  const [content,        setContent]        = useState<TextSection[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [activeChapter,  setActiveChapter]  = useState(0);
  const [audioManifest,  setAudioManifest]  = useState<AudioManifest | null>(null);
  const [noteSheet,      setNoteSheet]      = useState<NoteSheetState>({ visible: false, sectionIdx: 0, text: '' });
  const [contentHeight,  setContentHeight]  = useState(1);
  const [scrollPos,      setScrollPos]      = useState(0);
  const [viewportH,      setViewportH]      = useState(1);

  const {
    fontSize, hebrewFontSize, lineHeight,
    bookmarks, addBookmark, removeBookmark,
    addHighlight, removeHighlight, highlights,
    addWordNote, wordNotes,
    addToLibrary, openBook, savePosition,
    positions, recordLearning,
    dualColumnByBook, setDualColumn,
  } = useLibraryStore();

  const { isActive } = useSubscriptionStore();
  const colors = useReaderColors();
  const layout = useAdaptiveLayout();

  // Per-book dual-column preference — only applicable on tablet/large tiers.
  const userDualPref   = dualColumnByBook[id ?? ''] ?? undefined;
  const dualColumnMode = layout.showDualToggle
    ? (userDualPref ?? (layout.columnMode === 'dual'))
    : false;

  // Adaptive sizes — user's store values act as scale factors vs. adaptive base.
  const engScale = fontSize       / 18;       // 18 = default English size
  const hebScale = hebrewFontSize / 22;       // 22 = default Hebrew size
  const engSize  = Math.round(layout.englishFontSize * engScale);
  const hebSize  = Math.round(layout.hebrewFontSize  * hebScale);
  const lhMult   = lineHeight || layout.lineHeightMultiplier;

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

  // Load chapter content from Sefaria / contentService
  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    setContentLoading(true);
    contentService.getChapterByIndex(book.id, activeChapter).then(ch => {
      if (cancelled) return;
      setContent(ch.sections);
      setContentLoading(false);
      // Prefetch next 2 chapters silently
      contentService.prefetchAheadChapters(book.id, activeChapter, 2);
    }).catch(() => {
      if (!cancelled) setContentLoading(false);
    });
    return () => { cancelled = true; };
  }, [book?.id, activeChapter]);

  // Restore last position when opening
  React.useEffect(() => {
    const pos = positions[book?.id ?? ''];
    if (pos && pos.chapterIdx !== undefined) {
      setActiveChapter(pos.chapterIdx);
    }
  }, [book?.id]);

  // Load audio manifest for this book (null if none exists / feature off)
  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    getAudioManifest(book.id).then(m => {
      if (!cancelled) setAudioManifest(m);
    });
    return () => { cancelled = true; };
  }, [book?.id]);

  // Stop any playing audio when the reader unmounts
  useEffect(() => {
    return () => { stopActiveAudio(); };
  }, []);

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
  const isPaywalled = book.requiresSub && !isActive;
  const isBookmarked = bookmarks.some(
    bm => bm.bookId === book.id && bm.chapterId === chapter?.id,
  );

  // Calculate reading progress
  const progress = contentHeight > viewportH
    ? Math.min(1, (scrollPos + viewportH) / contentHeight)
    : 1;

  const chapterProgress = (activeChapter + progress) / Math.max(1, book.chapters.length);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const y  = contentOffset.y;
    const h  = contentSize.height;
    const lh = layoutMeasurement.height;
    setScrollPos(y);
    setContentHeight(h);
    setViewportH(lh);

    // Save position every scroll
    if (chapter) {
      savePosition({
        bookId:     book.id,
        chapterId:  chapter.id,
        chapterIdx: activeChapter,
        scrollY:    y,
        progress:   chapterProgress,
        updatedAt:  Date.now(),
      });
    }
  };

  const handleBookmark = () => {
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
        excerpt:      content.find((s: TextSection) => s.type === 'english' || s.type === 'hebrew')?.content?.slice(0, 80),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setToolbarVisible(false);
    } else {
      setToolbarVisible(v => !v);
    }
    lastTap.current = now;
  };

  const handleLongPressSection = (sectionIdx: number, text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNoteSheet({ visible: true, sectionIdx, text });
  };

  const handleSaveNote = (color: string, noteText: string) => {
    if (!chapter) return;
    // Always save a highlight (visible in-reader)
    addHighlight({
      bookId:       book.id,
      bookTitle:    book.title,
      chapterId:    chapter.id,
      chapterTitle: chapter.title,
      sectionIdx:   noteSheet.sectionIdx,
      text:         noteSheet.text.slice(0, 200),
      color,
    });
    // If user wrote a note, persist it as a WordNote too
    if (noteText.trim()) {
      addWordNote({
        bookId:       book.id,
        bookTitle:    book.title,
        chapterId:    chapter.id,
        chapterTitle: chapter.title,
        sectionIdx:   noteSheet.sectionIdx,
        wordStart:    -1,
        wordEnd:      -1,
        selectedText: noteSheet.text.slice(0, 200),
        noteText:     noteText.trim(),
        color,
      });
    }
    setNoteSheet({ visible: false, sectionIdx: 0, text: '' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = (text: string) => {
    Share.share({
      message: `${text}\n\n— ${book.hebrewTitle ?? book.title}${chapter ? `, ${chapter.title}` : ''}\n\nRead on Albert`,
    });
  };

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
        chapterCount={book.chapters.length}
        onSettingsPress={() => setSettingsOpen(true)}
        onBookmarkPress={handleBookmark}
        onTocPress={() => setTocOpen(true)}
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
          {
            maxWidth:          layout.maxContentWidth,
            paddingHorizontal: layout.marginHorizontal,
            alignSelf:         'center',
            width:             '100%',
          },
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

          {/* ── Dual / single column toggle (tablet+) ────────────────── */}
          {layout.showDualToggle && !contentLoading && (
            <View style={styles.columnToggleRow}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setDualColumn(book.id, !dualColumnMode);
                }}
                style={[styles.columnToggle, { borderColor: colors.gold + '40' }]}
                accessibilityRole="button"
                accessibilityLabel={dualColumnMode ? 'Switch to single column' : 'Switch to dual column'}
              >
                <Ionicons
                  name={dualColumnMode ? 'reorder-three-outline' : 'copy-outline'}
                  size={14}
                  color={colors.gold}
                />
                <Text style={[styles.columnToggleText, { color: colors.gold }]}>
                  {dualColumnMode ? 'Single column' : 'Dual column'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* ── Actual text content ─────────────────────────────────── */}
          {contentLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                Loading text…
              </Text>
            </View>
          ) : dualColumnMode ? (
            <DualColumnView
              sections={isPaywalled ? content.slice(0, 6) : content}
              colors={colors}
              engSize={engSize}
              hebSize={hebSize}
              lh={lhMult}
              gutter={layout.columnGutter}
              audioManifest={audioManifest}
              getHighlightColor={getHighlightColor}
              onLongPressSection={handleLongPressSection}
              onShareSection={handleShare}
            />
          ) : (
            (isPaywalled ? content.slice(0, 3) : content).map((section: TextSection, i: number) => (
              <React.Fragment key={i}>
                {renderSection(
                  section, i, colors, engSize, hebSize, lhMult,
                  getHighlightColor(i),
                  () => handleLongPressSection(i, section.content ?? ''),
                  () => handleShare(section.content ?? ''),
                )}
                {section.audioId && (
                  <AudioSection
                    clip={getClip(audioManifest, section.audioId)}
                    goldColor={colors.gold}
                    textColor={colors.text}
                    mutedColor={colors.muted}
                  />
                )}
              </React.Fragment>
            ))
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

      {/* Table of Contents modal */}
      <Modal
        visible={tocOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTocOpen(false)}
      >
        <Pressable style={tocStyles.backdrop} onPress={() => setTocOpen(false)}>
          <Pressable style={[tocStyles.sheet, { backgroundColor: colors.bg }]} onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={tocStyles.header}>
              <View>
                <Text style={tocStyles.headerHeb}>תוכן עניינים</Text>
                <Text style={[tocStyles.headerTitle, { color: colors.heading }]}>Table of Contents</Text>
              </View>
              <Pressable
                onPress={() => setTocOpen(false)}
                style={tocStyles.closeBtn}
                hitSlop={8}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <GoldDivider marginVertical={0} opacity={0.25} />
            {/* Chapter list */}
            <ScrollView style={tocStyles.list} showsVerticalScrollIndicator={false}>
              {book.chapters.map((ch, i) => {
                const chPos = positions[book.id];
                const isActive = activeChapter === i;
                const chapterFrac = 1 / book.chapters.length;
                const chProgress = chPos
                  ? Math.max(0, Math.min(1, (chPos.progress - i * chapterFrac) / chapterFrac))
                  : 0;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[tocStyles.chapterRow, isActive && tocStyles.chapterRowActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveChapter(i);
                      scrollRef.current?.scrollTo({ y: 0, animated: false });
                      setTocOpen(false);
                    }}
                    accessibilityLabel={`Chapter: ${ch.title}`}
                    accessibilityRole="button"
                  >
                    <View style={tocStyles.chapterNum}>
                      <Text style={[tocStyles.chapterNumText, isActive && { color: Palette.goldBright }]}>
                        {i + 1}
                      </Text>
                    </View>
                    <View style={tocStyles.chapterInfo}>
                      {ch.hebrewTitle && (
                        <Text style={[tocStyles.chapterHeb, { color: isActive ? Palette.goldMid : colors.gold + '60' }]}>
                          {ch.hebrewTitle}
                        </Text>
                      )}
                      <Text style={[tocStyles.chapterTitle, { color: isActive ? colors.heading : colors.text }]}>
                        {ch.title}
                      </Text>
                      {chProgress > 0.02 && (
                        <View style={tocStyles.chapterProgress}>
                          <ProgressBar
                            progress={Math.min(1, chProgress)}
                            height={2}
                            trackColor={colors.divider}
                            fillColor={Palette.goldMid + '80'}
                          />
                          <Text style={[tocStyles.chapterProgressText, { color: colors.muted }]}>
                            {Math.round(Math.min(1, chProgress) * 100)}%
                          </Text>
                        </View>
                      )}
                    </View>
                    {isActive && (
                      <Ionicons name="chevron-forward" size={14} color={Palette.goldMid} />
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Note sheet (color + optional note text) */}
      {noteSheet.visible && (
        <NoteSheet
          text={noteSheet.text}
          onSave={handleSaveNote}
          onDismiss={() => setNoteSheet({ visible: false, sectionIdx: 0, text: '' })}
          onShare={() => handleShare(noteSheet.text)}
        />
      )}
    </View>
  );
}

// ── Dual-column bilingual view ────────────────────────────────────────────
/**
 * Splits sections into paired Hebrew (right) + English (left) columns.
 * Other types (heading, commentary, divider) span both columns.
 */
function DualColumnView({
  sections, colors, engSize, hebSize, lh, gutter, audioManifest,
  getHighlightColor, onLongPressSection, onShareSection,
}: {
  sections: TextSection[];
  colors: ReturnType<typeof useReaderColors>;
  engSize: number;
  hebSize: number;
  lh: number;
  gutter: number;
  audioManifest: AudioManifest | null;
  getHighlightColor: (idx: number) => string | undefined;
  onLongPressSection: (idx: number, text: string) => void;
  onShareSection: (text: string) => void;
}) {
  // Walk sections, grouping adjacent hebrew+english pairs into a row.
  type Row =
    | { kind: 'pair'; heIdx: number; enIdx: number }
    | { kind: 'span'; idx: number };
  const rows: Row[] = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    const next = sections[i + 1];
    if (s.type === 'hebrew' && next?.type === 'english') {
      rows.push({ kind: 'pair', heIdx: i, enIdx: i + 1 });
      i += 2;
    } else if (s.type === 'english' && next?.type === 'hebrew') {
      rows.push({ kind: 'pair', heIdx: i + 1, enIdx: i });
      i += 2;
    } else {
      rows.push({ kind: 'span', idx: i });
      i += 1;
    }
  }

  return (
    <View>
      {rows.map((row, rowIdx) => {
        if (row.kind === 'span') {
          const s = sections[row.idx];
          return (
            <React.Fragment key={`span-${rowIdx}`}>
              {renderSection(
                s, row.idx, colors, engSize, hebSize, lh,
                getHighlightColor(row.idx),
                () => onLongPressSection(row.idx, s.content ?? ''),
                () => onShareSection(s.content ?? ''),
              )}
              {s.audioId && (
                <AudioSection
                  clip={getClip(audioManifest, s.audioId)}
                  goldColor={colors.gold}
                  textColor={colors.text}
                  mutedColor={colors.muted}
                />
              )}
            </React.Fragment>
          );
        }

        const he  = sections[row.heIdx];
        const en  = sections[row.enIdx];
        const heHl = getHighlightColor(row.heIdx);
        const enHl = getHighlightColor(row.enIdx);
        // Audio on either side of the pair surfaces below the row.
        const pairAudioId = he.audioId ?? en.audioId;

        return (
          <React.Fragment key={`pair-${rowIdx}`}>
            <View style={[dualStyles.row, { gap: gutter }]}>
              {/* English (left) */}
              <Pressable
                style={dualStyles.col}
                onLongPress={() => onLongPressSection(row.enIdx, en.content ?? '')}
              >
                <View style={[dualStyles.colInner, enHl ? { backgroundColor: enHl + '55' } : null]}>
                  {en.verseRef && (
                    <Text style={[sectionStyles.verseRefEn, { color: colors.gold + 'AA' }]}>
                      {en.verseRef}
                    </Text>
                  )}
                  <Text style={[
                    sectionStyles.englishText,
                    { color: colors.text, fontSize: engSize, lineHeight: engSize * lh },
                  ]}>
                    {en.content}
                  </Text>
                </View>
              </Pressable>

              {/* Gold vertical rule */}
              <View style={[dualStyles.divider, { backgroundColor: colors.gold + '4D' }]} />

              {/* Hebrew (right) */}
              <Pressable
                style={dualStyles.col}
                onLongPress={() => onLongPressSection(row.heIdx, he.content ?? '')}
              >
                <View style={[dualStyles.colInner, heHl ? { backgroundColor: heHl + '55' } : null]}>
                  {he.verseRef && (
                    <Text style={[sectionStyles.verseRef, { color: colors.gold + 'AA', textAlign: 'right' }]}>
                      {he.verseRef}
                    </Text>
                  )}
                  <Text style={[
                    sectionStyles.hebrewText,
                    { color: colors.text, fontSize: hebSize, lineHeight: hebSize * lh },
                  ]}>
                    {he.content}
                  </Text>
                </View>
              </Pressable>
            </View>
            {pairAudioId && (
              <AudioSection
                clip={getClip(audioManifest, pairAudioId)}
                goldColor={colors.gold}
                textColor={colors.text}
                mutedColor={colors.muted}
              />
            )}
          </React.Fragment>
        );
      })}
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
            {s.heContent && (
              <Text style={[sectionStyles.headingHebrew, { color: colors.heading }]}>
                {s.heContent}
              </Text>
            )}
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

    // ── v2 section kinds ────────────────────────────────────────────

    case 'mishnah':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[v2Styles.mishnahBlock, { borderLeftColor: colors.gold + '60' }, hl]}>
            {s.verseRef && (
              <Text style={[v2Styles.kicker, { color: colors.gold }]}>
                {s.verseRef.toUpperCase()}
              </Text>
            )}
            <Text style={[v2Styles.mishnahHe, { color: colors.text, fontSize: hebSize, lineHeight: hebSize * lh }]}>
              {s.content}
            </Text>
            {s.translation && (
              <Text style={[v2Styles.translationEn, { color: colors.muted }]}>
                {s.translation}
              </Text>
            )}
          </View>
        </Pressable>
      );

    case 'gemara':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[v2Styles.gemaraBlock, hl]}>
            <Text style={[v2Styles.gemaraHe, { color: colors.text, fontSize: Math.max(16, hebSize - 2), lineHeight: Math.max(28, hebSize - 2) * lh }]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'rashi':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[v2Styles.rashiBlock, { borderTopColor: colors.gold + '50' }, hl]}>
            <Text style={[v2Styles.mefareshLabel, { color: colors.gold }]}>רש״י</Text>
            <Text style={[v2Styles.commentaryHe, { color: colors.muted }]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'tosfos':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[v2Styles.rashiBlock, { borderTopColor: colors.gold + '50' }, hl]}>
            <Text style={[v2Styles.mefareshLabel, { color: colors.gold }]}>תוספות</Text>
            <Text style={[v2Styles.commentaryHe, { color: colors.muted }]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'mefaresh':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[v2Styles.rashiBlock, { borderTopColor: colors.gold + '50' }, hl]}>
            {s.speaker && (
              <Text style={[v2Styles.mefareshLabel, { color: colors.gold }]}>
                {s.speaker.toUpperCase()}
              </Text>
            )}
            <Text style={[v2Styles.commentaryHe, { color: colors.muted }]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'pasuk':
      return (
        <Pressable key={i} onLongPress={onLongPress}>
          <View style={[v2Styles.pasukBlock, hl]}>
            {(s.verse ?? s.verseRef) && (
              <Text style={[v2Styles.verseNumber, { color: colors.gold }]}>
                {s.verse?.gematria ?? s.verseRef}
              </Text>
            )}
            <Text style={[v2Styles.pasukHe, { color: colors.text, fontSize: hebSize, lineHeight: hebSize * lh }]}>
              {s.content}
            </Text>
          </View>
        </Pressable>
      );

    case 'parsha-marker':
      return (
        <View key={i} style={v2Styles.parshaMarker}>
          <Text style={[v2Styles.parshaGlyph, { color: colors.gold }]}>
            {s.content ?? 'פ'}
          </Text>
        </View>
      );

    case 'aliyah':
      return (
        <View key={i} style={[v2Styles.aliyahBar, { borderColor: colors.gold + '40' }]}>
          <View style={[v2Styles.aliyahLine, { backgroundColor: colors.gold + '40' }]} />
          <Text style={[v2Styles.aliyahLabel, { color: colors.gold }]}>
            {s.content ?? 'עלייה'}
          </Text>
          <View style={[v2Styles.aliyahLine, { backgroundColor: colors.gold + '40' }]} />
        </View>
      );

    case 'perek-open':
      return (
        <View key={i} style={v2Styles.perekOpen}>
          <Text style={[v2Styles.perekGlyph, { color: colors.heading }]}>
            {s.content ?? 'א'}
          </Text>
          {s.heContent && (
            <Text style={[v2Styles.perekTitle, { color: colors.muted }]}>{s.heContent}</Text>
          )}
        </View>
      );

    default:
      return null;
  }
}

// ── Note sheet — color picker + optional note text ───────────────────────────

import { TextInput, KeyboardAvoidingView } from 'react-native';

function NoteSheet({
  text, onSave, onDismiss, onShare,
}: {
  text:      string;
  onSave:    (color: string, noteText: string) => void;
  onDismiss: () => void;
  onShare:   () => void;
}) {
  const [selectedColor, setSelectedColor] = React.useState(HIGHLIGHT_COLORS[0].color);
  const [noteText,      setNoteText]      = React.useState('');

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={pickerStyles.backdrop}
      keyboardVerticalOffset={0}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Pressable style={pickerStyles.sheet} onPress={e => e.stopPropagation()}>

        {/* Selected text preview */}
        <Text style={pickerStyles.previewText} numberOfLines={3}>
          "{text.slice(0, 120)}{text.length > 120 ? '…' : ''}"
        </Text>

        <GoldDivider marginVertical={12} opacity={0.2} />

        {/* Color picker */}
        <Text style={pickerStyles.label}>Highlight colour</Text>
        <View style={pickerStyles.colorRow}>
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <Pressable
              key={color}
              style={[
                pickerStyles.colorBtn,
                { backgroundColor: color },
                selectedColor === color && pickerStyles.colorBtnSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedColor(color);
              }}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={16} color="rgba(0,0,0,0.5)" />
              )}
              <Text style={pickerStyles.colorLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Note text input */}
        <Text style={[pickerStyles.label, { marginTop: Space[3] }]}>Add a note (optional)</Text>
        <TextInput
          style={pickerStyles.noteInput}
          placeholder="What does this passage mean to you…"
          placeholderTextColor="#5A5040"
          multiline
          numberOfLines={3}
          value={noteText}
          onChangeText={setNoteText}
          returnKeyType="done"
          blurOnSubmit
        />

        {/* Actions */}
        <View style={pickerStyles.actionRow}>
          <Pressable style={pickerStyles.shareBtn} onPress={onShare}>
            <Ionicons name="share-outline" size={15} color={Palette.goldBright} />
            <Text style={pickerStyles.shareBtnText}>Share</Text>
          </Pressable>
          <Pressable
            style={pickerStyles.saveBtn}
            onPress={() => onSave(selectedColor, noteText)}
          >
            <Text style={pickerStyles.saveBtnText}>
              {noteText.trim() ? 'Save highlight + note' : 'Save highlight'}
            </Text>
          </Pressable>
        </View>

      </Pressable>
    </KeyboardAvoidingView>
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
    // paddingHorizontal is supplied by useAdaptiveLayout in the component
    paddingTop:    Platform.OS === 'ios' ? 110 : 90,
    paddingBottom: Space[10],
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

  // Column toggle
  columnToggleRow: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    marginBottom:   Space[3],
  },
  columnToggle: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      Radius.pill,
    borderWidth:       1,
  },
  columnToggleText: {
    fontFamily:    Fonts.sansMedium,
    fontSize:      11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Content loading
  loadingWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: Space[12],
    gap:            Space[4],
  },
  loadingText: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
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

// ── v2 section styles ─────────────────────────────────────────────────────

const v2Styles = StyleSheet.create({
  // Ceremonial label above a mishnah / pasuk reference
  kicker: {
    ...ReaderType.kicker,
  },
  // Mishnah — elevated commanding block
  mishnahBlock: {
    marginBottom:   Space[5],
    paddingLeft:    Space[3],
    borderLeftWidth:3,
    paddingVertical:Space[3],
    borderRadius:   4,
    gap:            6,
  },
  mishnahHe: {
    fontFamily: Fonts.hebrewRegular,
    textAlign:  'right',
  },

  // Gemara — slightly quieter than mishnah
  gemaraBlock: {
    marginBottom:  Space[4],
    paddingLeft:   Space[2],
    borderRadius:  4,
    paddingVertical:4,
  },
  gemaraHe: {
    fontFamily: Fonts.hebrewRegular,
    textAlign:  'right',
  },

  // Rashi / Tosfos / Mefaresh — commentary register
  rashiBlock: {
    marginTop:    Space[3],
    marginBottom: Space[4],
    paddingTop:   Space[3],
    borderTopWidth: 1,
    gap:          6,
  },
  mefareshLabel: {
    ...ReaderType.mefareshLabel,
  },
  commentaryHe: {
    ...ReaderType.commentaryHe,
  },

  // Pasuk
  pasukBlock: {
    marginBottom:   Space[4],
    alignItems:     'flex-end',
    gap:            4,
    borderRadius:   4,
    paddingVertical:4,
  },
  pasukHe: {
    fontFamily: Fonts.hebrewRegular,
    textAlign:  'right',
  },
  verseNumber: {
    ...ReaderType.verseNumber,
  },

  // Parsha marker פ / ס
  parshaMarker: {
    alignItems:     'center',
    marginVertical: Space[2],
  },
  parshaGlyph: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   22,
    lineHeight: 28,
  },

  // Aliyah bar
  aliyahBar: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: Space[4],
    gap:            Space[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  aliyahLine: {
    flex:   1,
    height: 1,
  },
  aliyahLabel: {
    ...ReaderType.kicker,
  },

  // Perek opener
  perekOpen: {
    alignItems:     'center',
    marginVertical: Space[8],
    gap:            Space[2],
  },
  perekGlyph: {
    ...ReaderType.perekOpener,
  },
  perekTitle: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   16,
    lineHeight: 24,
    textAlign:  'center',
  },

  // Translation (used under mishnah)
  translationEn: {
    ...ReaderType.translationEn,
  },
});

const pickerStyles = StyleSheet.create({
  backdrop: {
    position:       'absolute',
    top:            0, left: 0, right: 0, bottom: 0,
    backgroundColor:'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    zIndex:         200,
  },
  sheet: {
    backgroundColor:     '#1A2540',
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding:             Space[6],
    gap:                 Space[3],
    borderTopWidth:      1,
    borderTopColor:      Palette.goldMid + '30',
    // keep sheet above keyboard
    paddingBottom:       Platform.OS === 'ios' ? Space[8] : Space[6],
  },
  previewText: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#8B8070',
    lineHeight: 20,
  },
  label: {
    fontFamily:   Fonts.sansSemiBold,
    fontSize:     11,
    color:        '#5A5040',
    letterSpacing: 0.8,
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
    justifyContent: 'center',
    gap:            2,
  },
  colorBtnSelected: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
    transform:   [{ scale: 1.08 }],
  },
  colorLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   9,
    color:      'rgba(0,0,0,0.55)',
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Palette.goldMid + '25',
    color:           '#EDE8DD',
    fontFamily:      Fonts.serifRegular,
    fontSize:        14,
    lineHeight:      21,
    paddingHorizontal: Space[4],
    paddingTop:      Space[3],
    paddingBottom:   Space[3],
    minHeight:       72,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap:           Space[3],
    marginTop:     Space[1],
  },
  shareBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingVertical: 12,
    paddingHorizontal: Space[4],
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Palette.goldMid + '40',
  },
  shareBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldBright,
  },
  saveBtn: {
    flex:            1,
    paddingVertical: 14,
    borderRadius:    Radius.md,
    backgroundColor: Palette.goldMid,
    alignItems:      'center',
  },
  saveBtnText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      14,
    color:         Palette.navyDeep,
    letterSpacing: 0.2,
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

const dualStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'stretch',
    marginBottom:  Space[4],
  },
  col: {
    flex: 1,
  },
  colInner: {
    padding:      6,
    borderRadius: 6,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    opacity: 0.8,
  },
});

const tocStyles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent:  'flex-end',
  },
  sheet: {
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight:            '80%',
    borderTopWidth:       1,
    borderTopColor:       Palette.goldMid + '30',
  },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-start',
    paddingHorizontal: Space[6],
    paddingTop:        Space[6],
    paddingBottom:     Space[4],
  },
  headerHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
    color:      Palette.goldMid,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   22,
  },
  closeBtn: {
    width:           36,
    height:          36,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  list: {
    paddingTop: Space[2],
  },
  chapterRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space[6],
    paddingVertical:   Space[4],
    gap:               Space[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  chapterRowActive: {
    backgroundColor: 'rgba(200,160,60,0.07)',
  },
  chapterNum: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  chapterNumText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   12,
    color:      '#8B8070',
  },
  chapterInfo: {
    flex: 1,
    gap:  2,
  },
  chapterHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
  },
  chapterTitle: {
    fontFamily: Fonts.serifRegular,
    fontSize:   16,
    lineHeight: 22,
  },
  chapterProgress: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginTop:     4,
  },
  chapterProgressText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    flexShrink: 0,
  },
});
