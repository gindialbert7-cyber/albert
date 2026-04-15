/**
 * app/admin/featured.tsx — Featured & Hero Management
 *
 * - Pick which book is the hero (shown in the home screen banner)
 * - Reorder featured books via up/down arrows (updates sort_order)
 * - Toggle is_featured directly from this screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell, AdminSection, StatCard } from './components/AdminShell';

interface BookRow {
  id:           string;
  title:        string;
  hebrew_title: string | null;
  category:     string;
  is_published: boolean;
  is_featured:  boolean;
  sort_order:   number;
}

export default function AdminFeatured() {
  const [books,      setBooks]      = useState<BookRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [heroBookId, setHeroBookId] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [booksRes, settingRes] = await Promise.all([
      supabase.from('books')
        .select('id, title, hebrew_title, category, is_published, is_featured, sort_order')
        .order('sort_order', { ascending: true }),
      supabase.from('app_settings')
        .select('value')
        .eq('key', 'hero_book_id')
        .single(),
    ]);

    if (booksRes.data) setBooks(booksRes.data);
    if (settingRes.data?.value) {
      setHeroBookId(
        typeof settingRes.data.value === 'string'
          ? settingRes.data.value
          : String(settingRes.data.value).replace(/"/g, '')
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  async function setHero(bookId: string) {
    setSaving(true);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: JSON.stringify(bookId), updated_at: new Date().toISOString() })
      .eq('key', 'hero_book_id');

    if (error) Alert.alert('Error', error.message);
    else setHeroBookId(bookId);
    setSaving(false);
  }

  async function toggleFeatured(book: BookRow) {
    const newVal = !book.is_featured;
    const { error } = await supabase.from('books').update({ is_featured: newVal }).eq('id', book.id);
    if (error) Alert.alert('Error', error.message);
    else setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_featured: newVal } : b));
  }

  async function moveUp(book: BookRow) {
    const idx = books.findIndex(b => b.id === book.id);
    if (idx <= 0) return;
    const other = books[idx - 1];
    await Promise.all([
      supabase.from('books').update({ sort_order: other.sort_order }).eq('id', book.id),
      supabase.from('books').update({ sort_order: book.sort_order }).eq('id', other.id),
    ]);
    setBooks(prev => {
      const next = [...prev];
      next[idx]     = { ...book,  sort_order: other.sort_order };
      next[idx - 1] = { ...other, sort_order: book.sort_order };
      return next.sort((a, b) => a.sort_order - b.sort_order);
    });
  }

  async function moveDown(book: BookRow) {
    const idx = books.findIndex(b => b.id === book.id);
    if (idx < 0 || idx >= books.length - 1) return;
    const other = books[idx + 1];
    await Promise.all([
      supabase.from('books').update({ sort_order: other.sort_order }).eq('id', book.id),
      supabase.from('books').update({ sort_order: book.sort_order }).eq('id', other.id),
    ]);
    setBooks(prev => {
      const next = [...prev];
      next[idx]     = { ...book,  sort_order: other.sort_order };
      next[idx + 1] = { ...other, sort_order: book.sort_order };
      return next.sort((a, b) => a.sort_order - b.sort_order);
    });
  }

  const featured = books.filter(b => b.is_featured);

  if (loading) {
    return (
      <AdminShell title="Featured">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
          <ActivityIndicator size="large" color={Palette.goldBright} />
        </View>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Featured" back="/admin" noScroll>
      <FlatList
        data={books}
        keyExtractor={b => b.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={s.statsRow}>
              <StatCard label="Total books"    value={books.length} />
              <StatCard label="Featured"       value={featured.length} color={Palette.goldBright} />
              <StatCard label="Published"      value={books.filter(b => b.is_published).length} color="#66BB6A" />
            </View>

            {/* Hero picker */}
            <AdminSection title="Hero Book" />
            <View style={s.heroCard}>
              <Text style={s.heroLabel}>Current hero displayed in the home screen banner</Text>
              {heroBookId ? (
                <Text style={s.heroValue}>
                  {books.find(b => b.id === heroBookId)?.title ?? heroBookId}
                </Text>
              ) : (
                <Text style={s.heroDim}>Not set</Text>
              )}
              {saving && <ActivityIndicator size="small" color={Palette.goldBright} style={{ marginTop: 8 }} />}
            </View>

            <AdminSection title="All Books  ·  tap star to feature, arrows to reorder" />
          </>
        }
        renderItem={({ item: b, index }) => (
          <View style={s.row}>
            {/* Featured toggle */}
            <Pressable
              style={[s.starBtn, b.is_featured && s.starBtnActive]}
              onPress={() => toggleFeatured(b)}
            >
              <Text style={[s.star, b.is_featured && s.starActive]}>★</Text>
            </Pressable>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={s.title} numberOfLines={1}>{b.title}</Text>
                {!b.is_published && <Text style={s.draftBadge}>DRAFT</Text>}
                {b.id === heroBookId && <Text style={s.heroBadge}>HERO</Text>}
              </View>
              <Text style={s.meta}>{b.category}</Text>
            </View>

            {/* Reorder */}
            <View style={s.orderBtns}>
              <Pressable style={s.orderBtn} onPress={() => moveUp(b)} disabled={index === 0}>
                <Text style={[s.orderBtnText, index === 0 && s.orderBtnDim]}>↑</Text>
              </Pressable>
              <Text style={s.orderNum}>{b.sort_order}</Text>
              <Pressable style={s.orderBtn} onPress={() => moveDown(b)} disabled={index === books.length - 1}>
                <Text style={[s.orderBtnText, index === books.length - 1 && s.orderBtnDim]}>↓</Text>
              </Pressable>
            </View>

            {/* Set as hero */}
            <Pressable
              style={[s.heroBtn, b.id === heroBookId && s.heroBtnActive]}
              onPress={() => setHero(b.id)}
              disabled={saving}
            >
              <Text style={[s.heroBtnText, b.id === heroBookId && { color: Palette.goldBright }]}>
                {b.id === heroBookId ? '◉' : '○'}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No books found.</Text>}
      />
    </AdminShell>
  );
}

const s = StyleSheet.create({
  list:   { padding: Space[4], paddingBottom: 80 },

  statsRow: { flexDirection: 'row', gap: Space[3], marginBottom: Space[5] },

  heroCard: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[4],
    borderWidth:     1,
    borderColor:     '#2A3450',
    marginBottom:    Space[5],
    gap:             Space[1],
  },
  heroLabel: { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040' },
  heroValue: { fontFamily: Fonts.serifBold,   fontSize: 16, color: Palette.goldBright },
  heroDim:   { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#3A3028' },

  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingVertical:   Space[3],
    borderBottomWidth: 1,
    borderBottomColor: '#141B2A',
  },

  starBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  starBtnActive: {},
  star:          { fontSize: 20, color: '#2A3450' },
  starActive:    { color: Palette.goldBright },

  title:      { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#C0B090' },
  meta:       { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#5A5040', marginTop: 2 },
  draftBadge: { fontFamily: Fonts.sansMedium, fontSize: 9, color: '#E08030', backgroundColor: '#200E00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  heroBadge:  { fontFamily: Fonts.sansMedium, fontSize: 9, color: Palette.goldBright, backgroundColor: '#1A1500', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },

  orderBtns:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderBtn:     { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  orderBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#8B8070' },
  orderBtnDim:  { color: '#2A3040' },
  orderNum:     { fontFamily: 'monospace', fontSize: 11, color: '#3A3028', width: 28, textAlign: 'center' },

  heroBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  heroBtnActive: {},
  heroBtnText:   { fontSize: 18, color: '#3A3028' },

  empty: { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#5A5040', textAlign: 'center', padding: 40 },
});
