/**
 * app/admin/notifications.tsx — Push Notification Composer
 *
 * Compose and send push notifications to audiences:
 *   all / free / premium / trialing
 *
 * Calls supabase.functions.invoke('send-push', { body: { ... } })
 * History is stored in push_notifications table and displayed below the form.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell, AdminSection, StatCard } from './components/AdminShell';

type Audience = 'all' | 'free' | 'premium' | 'trialing';

interface PushRecord {
  id:              string;
  title:           string;
  body:            string;
  audience:        Audience;
  sent_at:         string;
  recipient_count: number;
  success_count:   number;
  error_count:     number;
  status:          'pending' | 'sending' | 'done' | 'error';
}

const AUDIENCE_OPTIONS: { value: Audience; label: string; color: string }[] = [
  { value: 'all',      label: 'All Users',  color: '#8B8070' },
  { value: 'free',     label: 'Free',       color: '#8B8070' },
  { value: 'premium',  label: 'Premium',    color: '#42A5F5' },
  { value: 'trialing', label: 'Trialing',   color: '#E8A030' },
];

const TEMPLATES = [
  { title: 'Shabbat Shalom!', body: 'Wishing you a peaceful and joyful Shabbat.' },
  { title: 'New Content Available', body: 'We just added new texts to the library. Come explore!' },
  { title: 'Daily Learning', body: 'Your daily study awaits. Open Albert to continue your journey.' },
  { title: 'Yom Tov', body: 'Wishing you and your family a beautiful and meaningful holiday.' },
];

export default function AdminNotifications() {
  const [title,     setTitle]     = useState('');
  const [body,      setBody]      = useState('');
  const [audience,  setAudience]  = useState<Audience>('all');
  const [sending,   setSending]   = useState(false);
  const [history,   setHistory]   = useState<PushRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('push_notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);
    if (data) setHistory(data);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { loadHistory(); }, []);

  async function send() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Title and body are required.');
      return;
    }

    Alert.alert(
      'Confirm Send',
      `Send to audience: "${audience}"\n\nTitle: ${title.trim()}\n${body.trim()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Now', style: 'destructive', onPress: async () => {
          setSending(true);
          try {
            const { data, error } = await supabase.functions.invoke('send-push', {
              body: { title: title.trim(), body: body.trim(), audience },
            });

            if (error) {
              const msg = (error as any)?.context?.json?.error ?? error.message ?? 'Send failed';
              Alert.alert('Error', msg);
            } else {
              Alert.alert(
                'Sent!',
                `Delivered to ${data?.successCount ?? 0} / ${data?.recipientCount ?? 0} devices.`
              );
              setTitle('');
              setBody('');
              loadHistory();
            }
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Network error');
          }
          setSending(false);
        }},
      ]
    );
  }

  const totalSent    = history.reduce((s, r) => s + r.success_count, 0);
  const totalErrors  = history.reduce((s, r) => s + r.error_count, 0);

  return (
    <AdminShell title="Notifications" back="/admin" noScroll>
      <FlatList
        data={history}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: Space[5], paddingBottom: 80 }}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={s.statsRow}>
              <StatCard label="Campaigns"    value={history.length} />
              <StatCard label="Delivered"    value={totalSent.toLocaleString()} color="#66BB6A" />
              <StatCard label="Errors"       value={totalErrors.toLocaleString()} color="#E05050" />
            </View>

            {/* Compose */}
            <AdminSection title="Compose" />
            <View style={s.card}>

              {/* Audience */}
              <Text style={s.label}>Audience</Text>
              <View style={s.audienceRow}>
                {AUDIENCE_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    style={[s.audienceBtn, audience === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '22' }]}
                    onPress={() => setAudience(opt.value)}
                  >
                    <Text style={[s.audienceBtnText, { color: audience === opt.value ? opt.color : '#5A5040' }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Title */}
              <Text style={s.label}>Title</Text>
              <TextInput
                style={s.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Shabbat Shalom!"
                placeholderTextColor="#3A3028"
                maxLength={100}
                editable={!sending}
              />
              <Text style={s.charHint}>{title.length}/100</Text>

              {/* Body */}
              <Text style={s.label}>Message</Text>
              <TextInput
                style={[s.input, s.multiline]}
                value={body}
                onChangeText={setBody}
                placeholder="Write your message here…"
                placeholderTextColor="#3A3028"
                multiline
                maxLength={256}
                editable={!sending}
                textAlignVertical="top"
              />
              <Text style={s.charHint}>{body.length}/256</Text>

              {/* Templates */}
              <Text style={[s.label, { marginTop: Space[3] }]}>Quick Templates</Text>
              <View style={s.templatesWrap}>
                {TEMPLATES.map((t, i) => (
                  <Pressable
                    key={i}
                    style={s.templateChip}
                    onPress={() => { setTitle(t.title); setBody(t.body); }}
                  >
                    <Text style={s.templateChipText}>{t.title}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Send button */}
              <Pressable
                style={[s.sendBtn, (sending || !title.trim() || !body.trim()) && s.sendBtnDisabled]}
                onPress={send}
                disabled={sending || !title.trim() || !body.trim()}
              >
                {sending
                  ? <ActivityIndicator color={Palette.navyDeep} />
                  : <Text style={s.sendBtnText}>🔔  Send Notification</Text>
                }
              </Pressable>
            </View>

            <AdminSection title="Send History" />
          </>
        }
        renderItem={({ item: r }) => (
          <View style={s.histRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={s.histTitle}>{r.title}</Text>
                <Text style={[s.statusBadge, r.status === 'done' ? s.statusDone : r.status === 'error' ? s.statusError : s.statusPending]}>
                  {r.status}
                </Text>
                <Text style={s.audienceTag}>{r.audience}</Text>
              </View>
              <Text style={s.histBody} numberOfLines={2}>{r.body}</Text>
              <Text style={s.histMeta}>
                {new Date(r.sent_at).toLocaleString()}  ·  {r.success_count}/{r.recipient_count} delivered
                {r.error_count > 0 ? `  ·  ${r.error_count} errors` : ''}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loadingHistory
            ? <ActivityIndicator color={Palette.goldBright} style={{ marginTop: 40 }} />
            : <Text style={s.empty}>No notifications sent yet.</Text>
        }
      />
    </AdminShell>
  );
}

const s = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: Space[3], marginBottom: Space[5] },

  card: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[5],
    borderWidth:     1,
    borderColor:     '#1E2A40',
    gap:             Space[3],
    marginBottom:    Space[5],
  },
  label: { fontFamily: Fonts.sansMedium, fontSize: 11, color: '#5A5040', letterSpacing: 0.8 },
  input: {
    backgroundColor:   '#0A1020',
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       '#1E2A40',
    paddingHorizontal: Space[4],
    paddingVertical:   10,
    fontFamily:        Fonts.sansRegular,
    fontSize:          14,
    color:             '#EDE8DD',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  charHint:  { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#3A3028', textAlign: 'right' },

  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  audienceBtn: {
    borderWidth:  1,
    borderColor:  '#1E2A40',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical:   8,
    backgroundColor:   '#0A1020',
  },
  audienceBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13 },

  templatesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  templateChip:  {
    backgroundColor: '#0A1020',
    borderRadius:    Radius.pill,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderWidth: 1,
    borderColor: '#1E2A40',
  },
  templateChipText: { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#8B8070' },

  sendBtn: {
    backgroundColor: Palette.goldBright,
    borderRadius:    Radius.pill,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       Space[2],
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontFamily: Fonts.sansBold, fontSize: 16, color: Palette.navyDeep },

  histRow: {
    paddingVertical:   Space[4],
    borderBottomWidth: 1,
    borderBottomColor: '#141B2A',
  },
  histTitle:  { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#C0B090' },
  histBody:   { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040', marginTop: 4, lineHeight: 18 },
  histMeta:   { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#3A3028', marginTop: 4 },

  statusBadge: { fontFamily: Fonts.sansMedium, fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusDone:  { color: '#66BB6A', backgroundColor: '#0A2010' },
  statusError: { color: '#E05050', backgroundColor: '#200808' },
  statusPending: { color: '#E8A030', backgroundColor: '#1A1000' },
  audienceTag: { fontFamily: Fonts.sansRegular, fontSize: 10, color: '#3A3028' },

  empty: { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#5A5040', textAlign: 'center', padding: 40 },
});
