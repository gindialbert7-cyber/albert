/**
 * app/admin/promo.tsx — Promo Code Management
 *
 * Create, view, activate/deactivate promo codes.
 * Displays usage stats (uses_count / max_uses).
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  ActivityIndicator, Switch, Alert, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell } from './components/AdminShell';

type Tier = 'monthly' | 'annual' | 'lifetime';

interface PromoRow {
  id:           string;
  code:         string;
  tier:         Tier;
  duration_days:number;
  max_uses:     number | null;
  uses_count:   number;
  expires_at:   string | null;
  is_active:    boolean;
  description:  string | null;
  created_at:   string;
}

const TIER_COLORS: Record<Tier, string> = {
  monthly:  '#66BB6A',
  annual:   '#42A5F5',
  lifetime: '#CE93D8',
};

const TIER_LABELS: Record<Tier, string> = {
  monthly:  'Monthly',
  annual:   'Annual',
  lifetime: 'Lifetime',
};

// ── Create form state ─────────────────────────────────────────────────────────

interface CreateForm {
  code:         string;
  tier:         Tier;
  duration_days:string;
  max_uses:     string;
  expires_at:   string;
  description:  string;
}

const DEFAULT_FORM: CreateForm = {
  code:         '',
  tier:         'annual',
  duration_days:'365',
  max_uses:     '',
  expires_at:   '',
  description:  '',
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminPromo() {
  const [codes,      setCodes]      = useState<PromoRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling,   setToggling]   = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState<CreateForm>(DEFAULT_FORM);
  const [creating,   setCreating]   = useState(false);
  const [search,     setSearch]     = useState('');

  const loadCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCodes(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadCodes(); }, []);

  const filtered = search.trim()
    ? codes.filter(c =>
        c.code.includes(search.toUpperCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : codes;

  async function toggleActive(code: PromoRow) {
    setToggling(code.id);
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !code.is_active })
      .eq('id', code.id);

    if (error) Alert.alert('Error', error.message);
    else setCodes(prev => prev.map(c => c.id === code.id ? { ...c, is_active: !code.is_active } : c));
    setToggling(null);
  }

  async function createCode() {
    if (!form.code.trim()) { Alert.alert('Code is required'); return; }
    setCreating(true);
    const { data, error } = await supabase.from('promo_codes').insert({
      code:          form.code.trim().toUpperCase(),
      tier:          form.tier,
      duration_days: parseInt(form.duration_days) || 30,
      max_uses:      form.max_uses ? parseInt(form.max_uses) : null,
      expires_at:    form.expires_at ? new Date(form.expires_at).toISOString() : null,
      description:   form.description.trim() || null,
      is_active:     true,
      uses_count:    0,
    }).select().single();

    setCreating(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setCodes(prev => [data, ...prev]);
    setShowCreate(false);
    setForm(DEFAULT_FORM);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function deleteCode(code: PromoRow) {
    Alert.alert('Delete Code', `Delete "${code.code}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('promo_codes').delete().eq('id', code.id);
        if (error) Alert.alert('Error', error.message);
        else setCodes(prev => prev.filter(c => c.id !== code.id));
      }},
    ]);
  }

  if (loading) return (
    <AdminShell title="Promo Codes">
      <View style={s.loading}><ActivityIndicator size="large" color={Palette.goldBright} /></View>
    </AdminShell>
  );

  return (
    <AdminShell title={`Promo Codes (${codes.length})`} back="/admin" noScroll>
    <View style={s.root}>
      {/* Create button row */}
      <View style={s.subHeader}>
        <Pressable style={s.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.createBtnText}>+ New Code</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={s.statsBar}>
        <Text style={s.statsText}>{codes.filter(c => c.is_active).length} active</Text>
        <Text style={s.statsDivider}>·</Text>
        <Text style={s.statsText}>{codes.reduce((sum, c) => sum + c.uses_count, 0)} total uses</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search code or description…"
          placeholderTextColor="#3A3028"
          autoCapitalize="characters"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCodes(); }} tintColor={Palette.goldBright} />}
        renderItem={({ item: c }) => {
          const usageLabel = c.max_uses ? `${c.uses_count} / ${c.max_uses}` : `${c.uses_count} uses`;
          const usagePct   = c.max_uses ? c.uses_count / c.max_uses : 0;
          const expired    = c.expires_at && new Date(c.expires_at) < new Date();
          return (
            <View style={[s.card, !c.is_active && s.cardInactive]}>
              <View style={s.cardTop}>
                <Text style={s.codeText}>{c.code}</Text>
                <View style={[s.tierBadge, { backgroundColor: TIER_COLORS[c.tier] + '22', borderColor: TIER_COLORS[c.tier] + '55' }]}>
                  <Text style={[s.tierText, { color: TIER_COLORS[c.tier] }]}>{TIER_LABELS[c.tier]}</Text>
                </View>
                {expired && <Text style={s.expiredBadge}>EXPIRED</Text>}
              </View>

              {c.description && <Text style={s.description}>{c.description}</Text>}

              <View style={s.cardMeta}>
                <Text style={s.metaText}>{c.duration_days}d access</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={[s.metaText, usagePct > 0.8 && { color: '#E05050' }]}>{usageLabel}</Text>
                {c.expires_at && (
                  <>
                    <Text style={s.metaDot}>·</Text>
                    <Text style={[s.metaText, expired ? { color: '#E05050' } : {}]}>
                      expires {new Date(c.expires_at).toLocaleDateString()}
                    </Text>
                  </>
                )}
              </View>

              {/* Usage bar */}
              {c.max_uses && (
                <View style={s.usageBar}>
                  <View style={[s.usageFill, { width: `${Math.min(100, usagePct * 100)}%` as any, backgroundColor: usagePct > 0.8 ? '#E05050' : '#66BB6A' }]} />
                </View>
              )}

              <View style={s.cardActions}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[2] }}>
                  <Text style={s.activeLabel}>{c.is_active ? 'Active' : 'Disabled'}</Text>
                  {toggling === c.id
                    ? <ActivityIndicator size="small" color={Palette.goldBright} />
                    : (
                      <Switch
                        value={c.is_active}
                        onValueChange={() => toggleActive(c)}
                        trackColor={{ false: '#2A3450', true: '#2A6040' }}
                        thumbColor={c.is_active ? '#66BB6A' : '#5A5040'}
                      />
                    )
                  }
                </View>
                <Pressable onPress={() => deleteCode(c)} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No promo codes found.</Text>}
        contentContainerStyle={s.list}
      />

      {/* Create Code Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={m.backdrop}>
          <ScrollView contentContainerStyle={m.sheet} keyboardShouldPersistTaps="handled">
            <Text style={m.title}>Create Promo Code</Text>

            <Field label="Code (e.g. SHAVUOT2026)" required>
              <TextInput
                style={m.input}
                value={form.code}
                onChangeText={v => setForm(f => ({ ...f, code: v.toUpperCase() }))}
                placeholder="LAUNCH2026"
                placeholderTextColor="#3A3028"
                autoCapitalize="characters"
              />
            </Field>

            <Field label="Subscription Tier">
              <View style={m.tierRow}>
                {(['monthly', 'annual', 'lifetime'] as Tier[]).map(t => (
                  <Pressable
                    key={t}
                    style={[m.tierBtn, form.tier === t && m.tierBtnActive]}
                    onPress={() => setForm(f => ({ ...f, tier: t }))}
                  >
                    <Text style={[m.tierBtnText, form.tier === t && { color: TIER_COLORS[t] }]}>
                      {TIER_LABELS[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Field label="Duration (days)">
              <TextInput
                style={m.input}
                value={form.duration_days}
                onChangeText={v => setForm(f => ({ ...f, duration_days: v }))}
                keyboardType="number-pad"
                placeholder="365"
                placeholderTextColor="#3A3028"
              />
            </Field>

            <Field label="Max Uses (blank = unlimited)">
              <TextInput
                style={m.input}
                value={form.max_uses}
                onChangeText={v => setForm(f => ({ ...f, max_uses: v }))}
                keyboardType="number-pad"
                placeholder="e.g. 100"
                placeholderTextColor="#3A3028"
              />
            </Field>

            <Field label="Expires At (blank = never, format: YYYY-MM-DD)">
              <TextInput
                style={m.input}
                value={form.expires_at}
                onChangeText={v => setForm(f => ({ ...f, expires_at: v }))}
                placeholder="2026-12-31"
                placeholderTextColor="#3A3028"
              />
            </Field>

            <Field label="Description (internal note)">
              <TextInput
                style={m.input}
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
                placeholder="Shavuot 2026 launch promotion"
                placeholderTextColor="#3A3028"
              />
            </Field>

            <View style={m.btns}>
              <Pressable style={m.cancelBtn} onPress={() => { setShowCreate(false); setForm(DEFAULT_FORM); }}>
                <Text style={m.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[m.createBtn, creating && { opacity: 0.6 }]} onPress={createCode} disabled={creating}>
                {creating
                  ? <ActivityIndicator color={Palette.navyDeep} />
                  : <Text style={m.createText}>Create Code</Text>
                }
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
    </AdminShell>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={m.field}>
      <Text style={m.label}>{label}{required && <Text style={{ color: '#E05050' }}> *</Text>}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0D1220' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  subHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    padding: Space[4],
    borderBottomWidth: 1, borderBottomColor: '#1A2340',
  },
  createBtn:    { backgroundColor: Palette.goldBright, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  createBtnText:{ fontFamily: Fonts.sansBold, fontSize: 14, color: Palette.navyDeep },

  statsBar:     { flexDirection: 'row', paddingHorizontal: Space[5], paddingVertical: Space[2], gap: Space[3] },
  statsText:    { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040' },
  statsDivider: { color: '#2A3040' },

  searchWrap:   { padding: Space[4], paddingBottom: Space[2] },
  search: {
    backgroundColor: '#141B30', borderRadius: Radius.md, borderWidth: 1, borderColor: '#1E2A40',
    paddingHorizontal: Space[4], paddingVertical: 10, fontFamily: Fonts.sansRegular, fontSize: 14, color: '#EDE8DD',
  },

  list: { padding: Space[4], gap: Space[3], paddingBottom: 60 },
  card: {
    backgroundColor: '#141B30', borderRadius: Radius.lg, padding: Space[4], gap: Space[3],
    borderWidth: 1, borderColor: '#1E2A40',
  },
  cardInactive: { opacity: 0.5 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: Space[3], flexWrap: 'wrap' },
  codeText:     { fontFamily: 'monospace', fontSize: 18, color: Palette.goldBright, flex: 1 },
  tierBadge:    { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  tierText:     { fontFamily: Fonts.sansMedium, fontSize: 11 },
  expiredBadge: { fontFamily: Fonts.sansMedium, fontSize: 10, color: '#E05050', backgroundColor: '#2A0808', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  description:  { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#8B8070' },
  cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: Space[2], flexWrap: 'wrap' },
  metaText:     { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040' },
  metaDot:      { color: '#2A3040' },
  usageBar:     { height: 4, backgroundColor: '#1A2340', borderRadius: 2, overflow: 'hidden' },
  usageFill:    { height: '100%', borderRadius: 2 },
  cardActions:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeLabel:  { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#5A5040' },
  deleteBtn:    { paddingHorizontal: Space[3], paddingVertical: Space[2] },
  deleteBtnText:{ fontFamily: Fonts.sansRegular, fontSize: 13, color: '#E05050' },
  empty:        { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#5A5040', textAlign: 'center', padding: 40 },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#0F1825', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Space[6], paddingBottom: 60 },
  title:    { fontFamily: Fonts.serifBold, fontSize: 22, color: '#EDE8DD', marginBottom: Space[5] },
  field:    { gap: Space[2], marginBottom: Space[4] },
  label:    { fontFamily: Fonts.sansMedium, fontSize: 12, color: '#8B8070', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#141B30', borderRadius: Radius.md, borderWidth: 1, borderColor: '#1E2A40',
    paddingHorizontal: Space[4], paddingVertical: 12, fontFamily: Fonts.sansRegular, fontSize: 15, color: '#EDE8DD',
  },
  tierRow:      { flexDirection: 'row', gap: Space[2] },
  tierBtn:      { flex: 1, backgroundColor: '#141B30', borderRadius: Radius.md, borderWidth: 1, borderColor: '#1E2A40', paddingVertical: 10, alignItems: 'center' },
  tierBtnActive:{ borderColor: Palette.goldMid, backgroundColor: '#1A2040' },
  tierBtnText:  { fontFamily: Fonts.sansMedium, fontSize: 13, color: '#8B8070' },
  btns:         { flexDirection: 'row', gap: Space[3], marginTop: Space[4] },
  cancelBtn:    { flex: 1, backgroundColor: '#141B30', borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E2A40' },
  cancelText:   { fontFamily: Fonts.sansMedium, fontSize: 15, color: '#8B8070' },
  createBtn:    { flex: 2, backgroundColor: Palette.goldBright, borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center' },
  createText:   { fontFamily: Fonts.sansBold, fontSize: 15, color: Palette.navyDeep },
});
