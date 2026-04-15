/**
 * app/admin/books.tsx — Book Management
 *
 * List all books, toggle published status, view chapter counts.
 * Upload new books via /admin/upload.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Switch, TextInput, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';

interface BookRow {
  id:             string;
  title:          string;
  hebrew_title:   string | null;
  category:       string;
  total_chapters: number;
  total_pages:    number;
  requires_sub:   boolean;
  is_published:   boolean;
  is_featured:    boolean;
  sort_order:     number;
  created_at:     string;
}

export default function AdminBooks() {
  const [books,      setBooks]      = useState<BookRow[]>([]);
  const [filtered,   setFiltered]   = useState<BookRow[]>([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, hebrew_title, category, total_chapters, total_pages, requires_sub, is_published, is_featured, sort_order, created_at')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setBooks(data);
      setFiltered(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadBooks(); }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.hebrew_title ?? '').includes(q)
    ) : books);
  }, [search, books]);

  async function togglePublished(book: BookRow) {
    setToggling(book.id);
    const newVal = !book.is_published;
    const { error } = await supabase
      .from('books')
      .update({ is_published: newVal })
      .eq('id', book.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_published: newVal } : b));
    }
    setToggling(null);
  }

  async function toggleFeatured(book: BookRow) {
    setToggling(book.id + '-f');
    const newVal = !book.is_featured;
    const { error } = await supabase
      .from('books')
      .update({ is_featured: newVal })
      .eq('id', book.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_featured: newVal } : b));
    }
    setToggling(null);
  }

  async function deleteBook(book: BookRow) {
    Alert.alert(
      'Delete Book',
      `Delete "${book.title}"? This cannot be undone. Storage files are NOT deleted automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('books').delete().eq('id', book.id);
            if (error) Alert.alert('Error', error.message);
            else setBooks(prev => prev.filter(b => b.id !== book.id));
          },
        },
      ],
    );
  }

  if (loading) {
    return <View style={s.loading}><ActivityIndicator size="large" color={Palette.goldBright} /></View>;
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Dashboard</Text>
        </Pressable>
        <Text style={s.title}>Books  <Text style={s.count}>({books.length})</Text></Text>
        <Pressable style={s.uploadBtn} onPress={() => router.push('/admin/upload')}>
          <Text style={s.uploadBtnText}>+ Upload</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search title, category, Hebrew…"
          placeholderTextColor="#3A3028"
        />
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <Text style={s.statsText}>{books.filter(b => b.is_published).length} published</Text>
        <Text style={s.statsDivider}>·</Text>
        <Text style={s.statsText}>{books.filter(b => !b.is_published).length} drafts</Text>
        <Text style={s.statsDivider}>·</Text>
        <Text style={s.statsText}>{books.filter(b => b.is_featured).length} featured</Text>
      </View>

      {/* Column headers */}
      <View style={s.tableHeader}>
        <Text style={[s.col, s.headText, { flex: 3 }]}>BOOK</Text>
        <Text style={[s.col, s.headText, { flex: 1.2, textAlign: 'center' }]}>CHAPTERS</Text>
        <Text style={[s.col, s.headText, { flex: 1.5, textAlign: 'center' }]}>PUBLISHED</Text>
        <Text style={[s.col, s.headText, { flex: 1.2, textAlign: 'center' }]}>FEATURED</Text>
        <Text style={[s.col, s.headText, { width: 40 }]}> </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={b => b.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBooks(); }} tintColor={Palette.goldBright} />}
        renderItem={({ item: b }) => (
          <View style={s.row}>
            <View style={[s.col, { flex: 3 }]}>
              <Text style={s.bookTitle} numberOfLines={1}>{b.title}</Text>
              {b.hebrew_title && <Text style={s.bookHeb}>{b.hebrew_title}</Text>}
              <Text style={s.bookMeta}>{b.category} · {b.requires_sub ? '🔒 Premium' : '🆓 Free'}</Text>
            </View>
            <Text style={[s.col, s.centeredText, { flex: 1.2 }]}>{b.total_chapters}</Text>
            <View style={[s.col, { flex: 1.5, alignItems: 'center' }]}>
              {toggling === b.id
                ? <ActivityIndicator size="small" color={Palette.goldBright} />
                : (
                  <Switch
                    value={b.is_published}
                    onValueChange={() => togglePublished(b)}
                    trackColor={{ false: '#2A3450', true: '#2A6040' }}
                    thumbColor={b.is_published ? '#66BB6A' : '#5A5040'}
                  />
                )
              }
            </View>
            <View style={[s.col, { flex: 1.2, alignItems: 'center' }]}>
              {toggling === b.id + '-f'
                ? <ActivityIndicator size="small" color={Palette.goldBright} />
                : (
                  <Switch
                    value={b.is_featured}
                    onValueChange={() => toggleFeatured(b)}
                    trackColor={{ false: '#2A3450', true: '#3A3010' }}
                    thumbColor={b.is_featured ? Palette.goldBright : '#5A5040'}
                  />
                )
              }
            </View>
            <Pressable
              style={[s.col, { width: 40, alignItems: 'center' }]}
              onPress={() => deleteBook(b)}
            >
              <Text style={s.deleteBtn}>🗑</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No books found.</Text>}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0D1220' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D1220' },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         Space[5],
    paddingTop:      Space[8],
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
  },
  backBtn:     { paddingVertical: 8, paddingRight: 16 },
  backBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Palette.goldMid },
  title:       { fontFamily: Fonts.serifBold, fontSize: 20, color: '#EDE8DD', flex: 1 },
  count:       { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#8B8070' },
  uploadBtn:   { backgroundColor: Palette.goldBright, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  uploadBtnText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Palette.navyDeep },

  searchWrap: { padding: Space[4], paddingBottom: Space[2] },
  search: {
    backgroundColor:  '#141B30',
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      '#1E2A40',
    paddingHorizontal: Space[4],
    paddingVertical:  10,
    fontFamily:       Fonts.sansRegular,
    fontSize:         14,
    color:            '#EDE8DD',
  },

  statsBar: {
    flexDirection:  'row',
    paddingHorizontal: Space[5],
    paddingVertical:   Space[2],
    gap:            Space[3],
  },
  statsText:    { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040' },
  statsDivider: { color: '#2A3040' },

  tableHeader: {
    flexDirection:    'row',
    paddingHorizontal: Space[5],
    paddingVertical:  Space[3],
    backgroundColor:  '#0F1825',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2340',
    alignItems:       'center',
  },
  headText: { fontFamily: Fonts.sansMedium, fontSize: 10, color: '#3A4060', letterSpacing: 0.8 },

  list: { paddingBottom: 40 },
  row: {
    flexDirection:     'row',
    paddingHorizontal: Space[5],
    paddingVertical:   Space[4],
    borderBottomWidth: 1,
    borderBottomColor: '#141B2A',
    alignItems:        'center',
  },
  col:         { paddingRight: Space[2] },
  centeredText:{ fontFamily: Fonts.sansRegular, fontSize: 14, color: '#A09080', textAlign: 'center' },

  bookTitle:  { fontFamily: Fonts.serifBold, fontSize: 14, color: '#EDE8DD' },
  bookHeb:    { fontFamily: Fonts.hebrewBlack, fontSize: 13, color: Palette.goldMid, marginTop: 2 },
  bookMeta:   { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#5A5040', marginTop: 2 },

  deleteBtn:  { fontSize: 16, opacity: 0.5 },
  empty:      { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#5A5040', textAlign: 'center', padding: 40 },
});
