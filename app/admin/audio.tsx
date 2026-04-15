/**
 * app/admin/audio.tsx — Audio Manifest Manager
 *
 * Per-book audio clip management:
 * - List all books, tap to manage their audio clips
 * - Add / edit / delete audio clip records (stored in audio_clips table)
 * - Upload .mp3 files directly to Supabase Storage bucket "audio"
 * - Clips are publicly accessible via CDN URL
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Alert, Modal, ScrollView,
  TextInput, Switch,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell, AdminSection } from './components/AdminShell';

interface BookRow   { id: string; title: string; hebrew_title: string | null; }
interface AudioClip {
  id:           string;
  book_id:      string;
  clip_id:      string;
  title:        string;
  duration_s:   number | null;
  storage_path: string;
  sort_order:   number;
  is_premium:   boolean;
}

type ModalMode = 'create' | 'edit';

const EMPTY_FORM = {
  clip_id:     '',
  title:       '',
  duration_s:  '',
  sort_order:  '0',
  is_premium:  false,
};

export default function AdminAudio() {
  const [books,       setBooks]       = useState<BookRow[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [selected,    setSelected]    = useState<BookRow | null>(null);
  const [clips,       setClips]       = useState<AudioClip[]>([]);
  const [loadingClips, setLoadingClips] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode,    setModalMode]    = useState<ModalMode>('create');
  const [editingClip,  setEditingClip]  = useState<AudioClip | null>(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [uploading,    setUploading]    = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // Load books
  useEffect(() => {
    supabase.from('books')
      .select('id, title, hebrew_title')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setBooks(data);
        setLoadingBooks(false);
      });
  }, []);

  // Load clips for selected book
  const loadClips = useCallback(async (bookId: string) => {
    setLoadingClips(true);
    const { data } = await supabase.from('audio_clips')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order', { ascending: true });
    if (data) setClips(data);
    setLoadingClips(false);
  }, []);

  function openBook(book: BookRow) {
    setSelected(book);
    loadClips(book.id);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setUploadedPath(null);
    setEditingClip(null);
    setModalMode('create');
    setModalVisible(true);
  }

  function openEdit(clip: AudioClip) {
    setForm({
      clip_id:    clip.clip_id,
      title:      clip.title,
      duration_s: clip.duration_s != null ? String(clip.duration_s) : '',
      sort_order: String(clip.sort_order),
      is_premium: clip.is_premium,
    });
    setUploadedPath(clip.storage_path);
    setEditingClip(clip);
    setModalMode('edit');
    setModalVisible(true);
  }

  async function pickAndUpload() {
    if (!selected) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const file = result.assets[0];
    const clipId = form.clip_id.trim() || file.name.replace(/\.[^.]+$/, '');
    const storagePath = `${selected.id}/${clipId}.mp3`;

    setUploading(true);
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('audio')
      .upload(storagePath, blob, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    setUploading(false);
    if (error) {
      Alert.alert('Upload error', error.message);
      return;
    }

    setUploadedPath(storagePath);
    if (!form.clip_id.trim()) {
      setForm(prev => ({ ...prev, clip_id: clipId, title: prev.title || clipId }));
    }
    Alert.alert('Uploaded', `File uploaded to audio/${storagePath}`);
  }

  async function saveClip() {
    if (!selected) return;
    if (!form.clip_id.trim() || !form.title.trim()) {
      Alert.alert('Required', 'Clip ID and Title are required.');
      return;
    }
    if (!uploadedPath && modalMode === 'create') {
      Alert.alert('No file', 'Please upload an audio file first.');
      return;
    }

    setUploading(true);
    const payload = {
      book_id:      selected.id,
      clip_id:      form.clip_id.trim(),
      title:        form.title.trim(),
      duration_s:   form.duration_s ? parseInt(form.duration_s) : null,
      storage_path: uploadedPath ?? editingClip?.storage_path ?? '',
      sort_order:   parseInt(form.sort_order) || 0,
      is_premium:   form.is_premium,
      updated_at:   new Date().toISOString(),
    };

    let error;
    if (modalMode === 'create') {
      ({ error } = await supabase.from('audio_clips').insert(payload));
    } else if (editingClip) {
      ({ error } = await supabase.from('audio_clips').update(payload).eq('id', editingClip.id));
    }

    setUploading(false);
    if (error) { Alert.alert('Error', error.message); return; }

    setModalVisible(false);
    loadClips(selected.id);
  }

  async function deleteClip(clip: AudioClip) {
    Alert.alert(
      'Delete Clip',
      `Delete "${clip.title}"? The Storage file will NOT be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('audio_clips').delete().eq('id', clip.id);
          if (error) Alert.alert('Error', error.message);
          else setClips(prev => prev.filter(c => c.id !== clip.id));
        }},
      ]
    );
  }

  // ── Book list view ─────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <AdminShell title="Audio" back="/admin" noScroll>
        <FlatList
          data={books}
          keyExtractor={b => b.id}
          contentContainerStyle={{ padding: Space[4], paddingBottom: 80 }}
          ListHeaderComponent={
            <Text style={s.hint}>Select a book to manage its audio clips.</Text>
          }
          renderItem={({ item: b }) => (
            <Pressable style={s.bookRow} onPress={() => openBook(b)}>
              <View style={{ flex: 1 }}>
                <Text style={s.bookTitle}>{b.title}</Text>
                {b.hebrew_title && <Text style={s.bookHeb}>{b.hebrew_title}</Text>}
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            loadingBooks
              ? <ActivityIndicator color={Palette.goldBright} style={{ marginTop: 40 }} />
              : <Text style={s.empty}>No books found.</Text>
          }
        />
      </AdminShell>
    );
  }

  // ── Clip list view ─────────────────────────────────────────────────────────
  return (
    <AdminShell title={`Audio: ${selected.title}`} back="/admin/audio" noScroll>
      {/* We can't use back prop properly since it needs to return to book list state.
          Override back behavior with a custom header action. */}
      <FlatList
        data={clips}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: Space[4], paddingBottom: 80 }}
        ListHeaderComponent={
          <>
            <Pressable style={s.backToBooks} onPress={() => setSelected(null)}>
              <Text style={s.backToBooksText}>← All Books</Text>
            </Pressable>
            <AdminSection
              title={`${clips.length} clip${clips.length !== 1 ? 's' : ''}`}
              action="+ Add Clip"
              onAction={openCreate}
            />
          </>
        }
        renderItem={({ item: c }) => (
          <View style={s.clipRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.clipTitle}>{c.title}</Text>
                {c.is_premium && <Text style={s.premBadge}>PREMIUM</Text>}
              </View>
              <Text style={s.clipMeta}>
                ID: {c.clip_id}
                {c.duration_s ? `  ·  ${Math.floor(c.duration_s / 60)}:${String(c.duration_s % 60).padStart(2, '0')}` : ''}
              </Text>
              <Text style={s.clipPath} numberOfLines={1}>{c.storage_path}</Text>
            </View>
            <Pressable style={s.editBtn} onPress={() => openEdit(c)}>
              <Text style={s.editBtnText}>Edit</Text>
            </Pressable>
            <Pressable style={s.delBtn} onPress={() => deleteClip(c)}>
              <Text style={s.delBtnText}>🗑</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          loadingClips
            ? <ActivityIndicator color={Palette.goldBright} style={{ marginTop: 40 }} />
            : <Text style={s.empty}>No audio clips yet. Tap "+ Add Clip" to upload.</Text>
        }
      />

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={m.backdrop}>
          <ScrollView contentContainerStyle={m.sheet} keyboardShouldPersistTaps="handled">
            <Text style={m.title}>{modalMode === 'create' ? 'Add Audio Clip' : 'Edit Clip'}</Text>

            <Text style={m.label}>Clip ID *</Text>
            <TextInput
              style={m.input}
              value={form.clip_id}
              onChangeText={v => setForm(p => ({ ...p, clip_id: v }))}
              placeholder="e.g. chapter-01"
              placeholderTextColor="#3A3028"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!uploading}
            />

            <Text style={m.label}>Title *</Text>
            <TextInput
              style={m.input}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              placeholder="e.g. Chapter 1 – Bereishit"
              placeholderTextColor="#3A3028"
              editable={!uploading}
            />

            <Text style={m.label}>Duration (seconds)</Text>
            <TextInput
              style={m.input}
              value={form.duration_s}
              onChangeText={v => setForm(p => ({ ...p, duration_s: v.replace(/[^0-9]/g, '') }))}
              placeholder="e.g. 245"
              placeholderTextColor="#3A3028"
              keyboardType="numeric"
              editable={!uploading}
            />

            <Text style={m.label}>Sort Order</Text>
            <TextInput
              style={m.input}
              value={form.sort_order}
              onChangeText={v => setForm(p => ({ ...p, sort_order: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              editable={!uploading}
            />

            <View style={m.switchRow}>
              <Text style={m.switchLabel}>Premium only</Text>
              <Switch
                value={form.is_premium}
                onValueChange={v => setForm(p => ({ ...p, is_premium: v }))}
                trackColor={{ false: '#2A3450', true: '#2A3050' }}
                thumbColor={form.is_premium ? Palette.goldBright : '#5A5040'}
                disabled={uploading}
              />
            </View>

            {/* File upload */}
            <Text style={m.label}>Audio File (.mp3)</Text>
            <Pressable
              style={[m.uploadBtn, uploading && { opacity: 0.5 }]}
              onPress={pickAndUpload}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator size="small" color={Palette.goldBright} />
                : <Text style={m.uploadBtnText}>
                    {uploadedPath ? `✓ ${uploadedPath}` : '⬆  Pick & Upload .mp3'}
                  </Text>
              }
            </Pressable>

            <View style={m.actions}>
              <Pressable style={m.cancelBtn} onPress={() => setModalVisible(false)} disabled={uploading}>
                <Text style={m.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[m.saveBtn, uploading && { opacity: 0.5 }]} onPress={saveClip} disabled={uploading}>
                <Text style={m.saveBtnText}>{modalMode === 'create' ? 'Create' : 'Save'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  hint: { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#5A5040', marginBottom: Space[4] },

  bookRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   Space[4],
    borderBottomWidth: 1,
    borderBottomColor: '#141B2A',
  },
  bookTitle: { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#C0B090' },
  bookHeb:   { fontFamily: Fonts.sansRegular, fontSize: 12, color: Palette.goldMid, marginTop: 2 },
  chevron:   { fontFamily: Fonts.sansMedium, fontSize: 22, color: '#3A3028' },

  backToBooks:    { paddingVertical: 8, marginBottom: Space[3] },
  backToBooksText:{ fontFamily: Fonts.sansMedium, fontSize: 14, color: Palette.goldMid },

  clipRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingVertical:   Space[3],
    borderBottomWidth: 1,
    borderBottomColor: '#141B2A',
  },
  clipTitle:  { fontFamily: Fonts.sansMedium, fontSize: 13, color: '#C0B090' },
  clipMeta:   { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#5A5040', marginTop: 2 },
  clipPath:   { fontFamily: 'monospace', fontSize: 10, color: '#3A3028', marginTop: 2 },
  premBadge:  { fontFamily: Fonts.sansMedium, fontSize: 9, color: Palette.goldBright, backgroundColor: '#1A1500', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },

  editBtn:     { backgroundColor: '#1A2340', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: '#8B8070' },
  delBtn:      { width: 32, alignItems: 'center' },
  delBtnText:  { fontSize: 16 },
  empty:       { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#5A5040', textAlign: 'center', padding: 40 },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#0F1825', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Space[5], paddingBottom: 60, gap: Space[3] },
  title:    { fontFamily: Fonts.serifBold, fontSize: 20, color: '#EDE8DD', marginBottom: Space[2] },

  label: { fontFamily: Fonts.sansMedium, fontSize: 11, color: '#5A5040', letterSpacing: 0.8 },
  input: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     '#1E2A40',
    paddingHorizontal: Space[4],
    paddingVertical:   10,
    fontFamily:      Fonts.sansRegular,
    fontSize:        14,
    color:           '#EDE8DD',
  },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Space[2] },
  switchLabel: { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#8B8070' },

  uploadBtn: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     '#2A4060',
    paddingVertical: 14,
    alignItems:      'center',
  },
  uploadBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Palette.goldMid },

  actions: { flexDirection: 'row', gap: Space[3], marginTop: Space[3] },
  cancelBtn: { flex: 1, backgroundColor: '#141B30', borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: '#8B8070' },
  saveBtn: { flex: 1, backgroundColor: Palette.goldBright, borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontFamily: Fonts.sansBold, fontSize: 15, color: Palette.navyDeep },
});
