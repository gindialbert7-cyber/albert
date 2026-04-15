/**
 * app/admin/upload.tsx — Book Upload
 *
 * Paste a BookDocument JSON → validate → upload via the admin-upload-book Edge Function.
 * The Edge Function uses service role key server-side, so no secret is ever in the app.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateBookDocument } from '@/constants/BookSchema';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'done' | 'error';

export default function AdminUpload() {
  const [json,      setJson]      = useState('');
  const [publish,   setPublish]   = useState(false);
  const [status,    setStatus]    = useState<UploadStatus>('idle');
  const [messages,  setMessages]  = useState<{ type: 'info' | 'warn' | 'error' | 'success'; text: string }[]>([]);
  const [result,    setResult]    = useState<{ bookId: string; chaptersUploaded: number; published: boolean } | null>(null);

  function log(type: 'info' | 'warn' | 'error' | 'success', text: string) {
    setMessages(prev => [...prev, { type, text }]);
  }

  async function handleUpload() {
    setMessages([]);
    setResult(null);

    // 1. Parse JSON
    setStatus('validating');
    let parsed: unknown;
    try {
      parsed = JSON.parse(json.trim());
    } catch (e: any) {
      log('error', `Invalid JSON: ${e.message}`);
      setStatus('error');
      return;
    }

    // 2. Validate
    const validation = validateBookDocument(parsed);
    validation.warnings.forEach(w => log('warn', w));
    if (!validation.valid) {
      validation.errors.forEach(e => log('error', e));
      setStatus('error');
      return;
    }
    log('success', `Validation passed`);

    // 3. Upload via Edge Function
    setStatus('uploading');
    log('info', 'Uploading to Supabase…');

    try {
      const { data, error } = await supabase.functions.invoke('admin-upload-book', {
        body: { book: parsed, publish },
      });

      if (error) {
        const msg = (error as any)?.context?.json?.error ?? error.message ?? 'Upload failed';
        log('error', msg);
        setStatus('error');
        return;
      }

      log('success', `Uploaded ${data.chaptersUploaded} chapter(s) to Storage`);
      log('success', `Book row upserted: ${data.bookId}`);
      if (data.published) {
        log('success', '📢 Book is now LIVE in the app');
      } else {
        log('info', 'Book saved as DRAFT — toggle Published in /admin/books to go live');
      }

      setResult(data);
      setStatus('done');

    } catch (e: any) {
      log('error', e?.message ?? 'Network error');
      setStatus('error');
    }
  }

  const busy = status === 'validating' || status === 'uploading';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Books</Text>
        </Pressable>
        <Text style={s.title}>Upload Book</Text>
      </View>

      {/* Instructions */}
      <View style={s.instructions}>
        <Text style={s.instructionsTitle}>How to upload a book</Text>
        <Text style={s.instructionsText}>
          1. Author your book in the <Text style={s.code}>BookDocument</Text> JSON format (see <Text style={s.code}>constants/BookSchema.ts</Text>).{'\n'}
          2. Paste the complete JSON below.{'\n'}
          3. Toggle "Publish immediately" if you want it live right away.{'\n'}
          4. Click Upload — the server validates, stores chapter files, and updates the database.{'\n\n'}
          Alternatively, use the CLI for large books:{'\n'}
          <Text style={s.code}>npx ts-node scripts/upload-book.ts book.json --publish</Text>
        </Text>
      </View>

      {/* JSON input */}
      <Text style={s.label}>Book JSON</Text>
      <TextInput
        style={s.jsonInput}
        value={json}
        onChangeText={setJson}
        placeholder={'{\n  "id": "my-book",\n  "title": "...",\n  ...\n}'}
        placeholderTextColor="#2A3040"
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        editable={!busy}
      />
      <Text style={s.charCount}>{json.length.toLocaleString()} characters</Text>

      {/* Publish toggle */}
      <View style={s.publishRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.publishLabel}>Publish immediately</Text>
          <Text style={s.publishSub}>Makes the book visible to all users in the app. You can toggle this later in Books.</Text>
        </View>
        <Switch
          value={publish}
          onValueChange={setPublish}
          trackColor={{ false: '#2A3450', true: '#2A6040' }}
          thumbColor={publish ? '#66BB6A' : '#5A5040'}
          disabled={busy}
        />
      </View>

      {/* Upload button */}
      <Pressable
        style={[s.uploadBtn, (busy || !json.trim()) && s.uploadBtnDisabled]}
        onPress={handleUpload}
        disabled={busy || !json.trim()}
      >
        {busy
          ? <ActivityIndicator color={Palette.navyDeep} />
          : <Text style={s.uploadBtnText}>
              {status === 'validating' ? 'Validating…' : status === 'uploading' ? 'Uploading…' : '⬆  Upload Book'}
            </Text>
        }
      </Pressable>

      {/* Log output */}
      {messages.length > 0 && (
        <View style={s.logBox}>
          {messages.map((m, i) => (
            <Text key={i} style={[s.logLine, s[`log_${m.type}`]]}>
              {m.type === 'error' ? '✗ ' : m.type === 'success' ? '✓ ' : m.type === 'warn' ? '⚠ ' : '  '}{m.text}
            </Text>
          ))}
        </View>
      )}

      {/* Success result */}
      {result && status === 'done' && (
        <View style={s.successCard}>
          <Text style={s.successTitle}>Upload complete!</Text>
          <Text style={s.successLine}>Book ID:  <Text style={s.code}>{result.bookId}</Text></Text>
          <Text style={s.successLine}>Chapters: {result.chaptersUploaded}</Text>
          <Text style={s.successLine}>Status:   {result.published ? '📢 Published' : '📝 Draft'}</Text>
          <Pressable style={s.goToBooks} onPress={() => router.replace('/admin/books')}>
            <Text style={s.goToBooksText}>Go to Books →</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const s: any = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0D1220' },
  content: { padding: Space[5], maxWidth: 800, alignSelf: 'center', width: '100%' },

  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[4],
    paddingTop:    Space[8],
    paddingBottom: Space[5],
  },
  backBtn:     { paddingVertical: 8, paddingRight: 8 },
  backBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Palette.goldMid },
  title:       { fontFamily: Fonts.serifBold, fontSize: 24, color: '#EDE8DD' },

  instructions: {
    backgroundColor: '#0F1825',
    borderRadius:    Radius.lg,
    padding:         Space[5],
    marginBottom:    Space[5],
    borderWidth:     1,
    borderColor:     '#1A2340',
  },
  instructionsTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Palette.goldMid, marginBottom: Space[3] },
  instructionsText:  { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#8B8070', lineHeight: 20 },
  code:              { fontFamily: 'monospace', fontSize: 12, color: Palette.goldMid },

  label: { fontFamily: Fonts.sansMedium, fontSize: 12, color: '#8B8070', marginBottom: Space[2], letterSpacing: 0.5 },
  jsonInput: {
    backgroundColor:   '#0A1020',
    borderRadius:      Radius.lg,
    borderWidth:       1,
    borderColor:       '#1E2A40',
    padding:           Space[4],
    fontFamily:        'monospace',
    fontSize:          13,
    color:             '#A0D0A0',
    minHeight:         300,
    textAlignVertical: 'top',
    lineHeight:        20,
  },
  charCount: { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#3A3028', textAlign: 'right', marginTop: 4, marginBottom: Space[5] },

  publishRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[4],
    gap:             Space[4],
    marginBottom:    Space[5],
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  publishLabel: { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#EDE8DD', marginBottom: 4 },
  publishSub:   { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040', lineHeight: 18 },

  uploadBtn: {
    backgroundColor: Palette.goldBright,
    borderRadius:    Radius.pill,
    paddingVertical: 16,
    alignItems:      'center',
    marginBottom:    Space[5],
  },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText:     { fontFamily: Fonts.sansBold, fontSize: 16, color: Palette.navyDeep },

  logBox: {
    backgroundColor: '#070E1A',
    borderRadius:    Radius.lg,
    padding:         Space[4],
    gap:             6,
    marginBottom:    Space[5],
    borderWidth:     1,
    borderColor:     '#1A2340',
  },
  logLine:         { fontFamily: 'monospace', fontSize: 12, lineHeight: 20 },
  log_info:        { color: '#8B8070' },
  log_warn:        { color: '#E8A030' },
  log_error:       { color: '#E05050' },
  log_success:     { color: '#66BB6A' },

  successCard: {
    backgroundColor: '#0A2010',
    borderRadius:    Radius.lg,
    padding:         Space[5],
    gap:             Space[3],
    borderWidth:     1,
    borderColor:     '#1A4020',
  },
  successTitle: { fontFamily: Fonts.serifBold, fontSize: 18, color: '#A0E0A0' },
  successLine:  { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#8B8070' },
  goToBooks:    { backgroundColor: '#66BB6A', borderRadius: Radius.md, padding: Space[3], alignItems: 'center', marginTop: Space[2] },
  goToBooksText:{ fontFamily: Fonts.sansBold, fontSize: 14, color: '#0A2010' },
});
