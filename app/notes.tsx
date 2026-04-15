import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, FlatList,
  Pressable, Platform, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useLibraryStore, BookmarkItem, HighlightItem, WordNote } from '@/store/useLibraryStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

type Tab = 'bookmarks' | 'highlights' | 'notes';

export default function NotesScreen() {
  const [tab, setTab] = useState<Tab>('bookmarks');
  const { bookmarks, highlights, wordNotes, removeBookmark, removeHighlight, deleteWordNote } = useLibraryStore();

  function handleOpenBookmark(bm: BookmarkItem) {
    router.push({ pathname: '/book/[id]', params: { id: bm.bookId } });
  }

  function handleOpenHighlight(hl: HighlightItem) {
    router.push({ pathname: '/book/[id]', params: { id: hl.bookId } });
  }

  function confirmRemoveBookmark(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Remove Bookmark', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeBookmark(id) },
    ]);
  }

  function confirmRemoveHighlight(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Remove Highlight', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeHighlight(id) },
    ]);
  }

  function confirmDeleteNote(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWordNote(id) },
    ]);
  }

  function shareNote(item: WordNote) {
    const body = item.noteText
      ? `"${item.selectedText}"\n\nMy note: ${item.noteText}`
      : `"${item.selectedText}"`;
    Share.share({
      message: `${body}\n\n— ${item.bookTitle}, ${item.chapterTitle}\n\nRead on Albert`,
    });
  }

  function shareHighlight(item: HighlightItem) {
    Share.share({
      message: `"${item.text}"\n\n— ${item.bookTitle ?? item.bookId}, ${item.chapterTitle}\n\nRead on Albert — The Jewish Reading Library`,
    });
  }

  function shareBookmark(item: BookmarkItem) {
    const excerpt = item.excerpt ? `\n"${item.excerpt}"` : '';
    Share.share({
      message: `Bookmarked: ${item.chapterTitle} in ${item.bookTitle ?? item.bookId}${excerpt}\n\nRead on Albert — The Jewish Reading Library`,
    });
  }

  // Group by book title
  const bookmarksByBook = groupBy(bookmarks, b => b.bookTitle ?? b.bookId);
  const highlightsByBook = groupBy(highlights, h => h.bookTitle ?? h.bookId);

  const bmSections = Object.entries(bookmarksByBook).map(([title, items]) => ({
    title, data: items,
  }));
  const hlSections = Object.entries(highlightsByBook).map(([title, items]) => ({
    title, data: items,
  }));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <View>
            <Text style={styles.headerHebrew}>סימניות והדגשות</Text>
            <Text style={styles.headerTitle}>Notes & Highlights</Text>
          </View>
        </View>

        <GoldDivider marginVertical={8} opacity={0.3} />

        <View style={styles.tabBar}>
          {([
            { key: 'bookmarks',  label: 'Bookmarks', count: bookmarks.length },
            { key: 'highlights', label: 'Highlights', count: highlights.length },
            { key: 'notes',      label: 'Notes',      count: wordNotes.length  },
          ] as { key: Tab; label: string; count: number }[]).map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={[styles.tabBadge, tab === t.key && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{t.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {tab === 'notes' ? (
        wordNotes.length === 0 ? (
          <EmptyState
            hebrew="הערות שלי"
            english="Long-press any passage in the reader and add a note to save it here."
          />
        ) : (
          <FlatList
            data={[...wordNotes].sort((a, b) => b.createdAt - a.createdAt)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <WordNoteRow
                item={item}
                onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.bookId } })}
                onDelete={() => confirmDeleteNote(item.id)}
                onShare={() => shareNote(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : tab === 'bookmarks' ? (
        bmSections.length === 0 ? (
          <EmptyState
            hebrew="שמור את מקומך"
            english="Long-press any chapter in the reader to bookmark it."
          />
        ) : (
          <SectionList
            sections={bmSections}
            keyExtractor={item => item.id}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <BookmarkRow
                item={item}
                onPress={() => handleOpenBookmark(item)}
                onRemove={() => confirmRemoveBookmark(item.id)}
                onShare={() => shareBookmark(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        hlSections.length === 0 ? (
          <EmptyState
            hebrew="הדגש פסוקים"
            english="Long-press any text passage in the reader to highlight it."
          />
        ) : (
          <SectionList
            sections={hlSections}
            keyExtractor={item => item.id}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <HighlightRow
                item={item}
                onPress={() => handleOpenHighlight(item)}
                onRemove={() => confirmRemoveHighlight(item.id)}
                onShare={() => shareHighlight(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function BookmarkRow({ item, onPress, onRemove, onShare }: {
  item: BookmarkItem;
  onPress:  () => void;
  onRemove: () => void;
  onShare:  () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      onLongPress={onRemove}
      accessibilityLabel={`Bookmark: ${item.chapterTitle}`}
      accessibilityRole="button"
    >
      <View style={styles.rowIcon}>
        <Ionicons name="bookmark" size={18} color="#C9A84C" />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowChapter}>{item.chapterTitle}</Text>
        {item.excerpt ? (
          <Text style={styles.rowExcerpt} numberOfLines={2}>{item.excerpt}</Text>
        ) : null}
        <Text style={styles.rowDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          style={styles.actionBtn}
          onPress={onShare}
          hitSlop={8}
          accessibilityLabel="Share bookmark"
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={15} color="#5A5040" />
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel="Remove bookmark"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={15} color="#5A5040" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function HighlightRow({ item, onPress, onRemove, onShare }: {
  item: HighlightItem;
  onPress:  () => void;
  onRemove: () => void;
  onShare:  () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      onLongPress={onRemove}
      accessibilityLabel={`Highlight: ${item.text.slice(0, 50)}`}
      accessibilityRole="button"
    >
      <View style={[styles.highlightSwatch, { backgroundColor: item.color }]} />
      <View style={styles.rowContent}>
        <Text style={styles.rowChapter}>{item.chapterTitle}</Text>
        <Text
          style={[styles.rowHighlightText, { backgroundColor: item.color + '55' }]}
          numberOfLines={3}
        >
          {item.text}
        </Text>
        <Text style={styles.rowDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          style={styles.actionBtn}
          onPress={onShare}
          hitSlop={8}
          accessibilityLabel="Share highlight"
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={15} color="#5A5040" />
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel="Remove highlight"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={15} color="#5A5040" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function WordNoteRow({ item, onPress, onDelete, onShare }: {
  item:     WordNote;
  onPress:  () => void;
  onDelete: () => void;
  onShare:  () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={`Note on: ${item.selectedText.slice(0, 50)}`}
      accessibilityRole="button"
    >
      {/* Colour swatch */}
      <View style={[styles.highlightSwatch, { backgroundColor: item.color }]} />

      <View style={styles.rowContent}>
        <Text style={styles.rowChapter}>
          {item.bookTitle}  ·  {item.chapterTitle}
        </Text>
        {/* Highlighted passage */}
        <Text
          style={[styles.rowHighlightText, { backgroundColor: item.color + '55' }]}
          numberOfLines={2}
        >
          {item.selectedText}
        </Text>
        {/* User note */}
        {item.noteText ? (
          <View style={styles.noteBlock}>
            <Ionicons name="pencil-outline" size={11} color={Palette.goldMid + 'AA'} style={{ marginTop: 1 }} />
            <Text style={styles.noteText} numberOfLines={3}>{item.noteText}</Text>
          </View>
        ) : null}
        <Text style={styles.rowDate}>
          {new Date(item.createdAt).toLocaleDateString()}
          {item.updatedAt !== item.createdAt ? '  (edited)' : ''}
        </Text>
      </View>

      <View style={styles.rowActions}>
        <Pressable style={styles.actionBtn} onPress={onShare} hitSlop={8} accessibilityLabel="Share note" accessibilityRole="button">
          <Ionicons name="share-outline" size={15} color="#5A5040" />
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete} hitSlop={8} accessibilityLabel="Delete note" accessibilityRole="button">
          <Ionicons name="trash-outline" size={15} color="#5A5040" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function EmptyState({ hebrew, english }: { hebrew: string; english: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyHebrew}>{hebrew}</Text>
      <GoldDivider marginVertical={12} opacity={0.2} />
      <Text style={styles.emptyText}>{english}</Text>
      <Pressable
        style={styles.emptyBtn}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.emptyBtnText}>Browse Books</Text>
      </Pressable>
    </View>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  safeTop: {
    backgroundColor: '#0D1220',
  },
  header: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[3],
    paddingBottom:     Space[2],
    gap:               2,
  },
  backBtn: {
    marginBottom: Space[2],
  },
  backBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  headerHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
  },

  // Tabs
  tabBar: {
    flexDirection:    'row',
    paddingHorizontal: Space[5],
    paddingBottom:    Space[3],
    gap:              8,
  },
  tab: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '25',
    gap:              6,
  },
  tabActive: {
    backgroundColor: Palette.navyMid,
    borderColor:     Palette.goldBright + '60',
  },
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#5A5040',
  },
  tabLabelActive: {
    color: '#EDE8DD',
  },
  tabBadge: {
    backgroundColor: '#1E2A40',
    borderRadius:    10,
    minWidth:        18,
    height:          18,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: Palette.goldMid + '30',
  },
  tabBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize:   10,
    color:      Palette.goldBright,
  },

  // List
  list: {
    paddingBottom: Space[10],
  },
  sectionHeader: {
    backgroundColor:  '#0D1220',
    paddingHorizontal: Space[5],
    paddingVertical:   Space[3],
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A40',
  },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   16,
    color:      '#EDE8DD',
  },

  // Row
  row: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingVertical: Space[4],
    paddingHorizontal: Space[5],
    borderBottomWidth: 1,
    borderBottomColor: '#1A2030',
    gap:             Space[3],
  },
  rowIcon: {
    width:          32,
    alignItems:     'center',
    paddingTop:     2,
  },
  rowIconText: {
    fontSize: 18,
  },
  highlightSwatch: {
    width:        4,
    borderRadius: 2,
    alignSelf:    'stretch',
    minHeight:    50,
    flexShrink:   0,
  },
  rowContent: {
    flex: 1,
    gap:  4,
  },
  rowChapter: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   13,
    color:      '#EDE8DD',
  },
  rowExcerpt: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#8B8070',
    lineHeight: 19,
  },
  rowHighlightText: {
    fontFamily:  Fonts.serifRegular,
    fontSize:    14,
    color:       '#1A1207',
    lineHeight:  21,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical:   2,
  },
  rowDate: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#3A4050',
  },
  noteBlock: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           6,
    marginTop:     2,
    paddingLeft:   4,
    borderLeftWidth: 2,
    borderLeftColor: Palette.goldMid + '40',
  },
  noteText: {
    flex:       1,
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#A89880',
    lineHeight: 20,
  },
  rowActions: {
    flexDirection: 'column',
    gap:           4,
    flexShrink:    0,
  },
  actionBtn: {
    width:           30,
    height:          30,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    8,
    backgroundColor: '#1A2030',
  },

  // Empty
  emptyState: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: Space[10],
    gap:             12,
  },
  emptyHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   22,
    color:      Palette.goldMid + '80',
    textAlign:  'center',
  },
  emptyText: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
    color:      '#5A5040',
    textAlign:  'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop:        Space[4],
    paddingHorizontal:Space[6],
    paddingVertical:  Space[3],
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Palette.goldMid,
  },
  emptyBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldBright,
  },
});
