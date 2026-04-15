/**
 * app/admin/users.tsx — User Management
 *
 * List all users, view subscription tier, search, and manually override subscriptions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  ActivityIndicator, RefreshControl, Alert, Modal, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell } from './components/AdminShell';

type Tier = 'free' | 'monthly' | 'annual' | 'lifetime';

interface UserRow {
  id:                      string;
  display_name:            string | null;
  subscription_tier:       Tier;
  subscription_expires_at: string | null;
  is_trialing:             boolean;
  is_admin:                boolean;
  created_at:              string;
  updated_at:              string;
}

const TIER_COLORS: Record<Tier, string> = {
  free:     '#8B8070',
  monthly:  '#66BB6A',
  annual:   '#42A5F5',
  lifetime: '#CE93D8',
};

export default function AdminUsers() {
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [filtered,   setFiltered]   = useState<UserRow[]>([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState<UserRow | null>(null);
  const [overriding, setOverriding] = useState(false);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, subscription_tier, subscription_expires_at, is_trialing, is_admin, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
      setFiltered(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? users.filter(u =>
      (u.display_name ?? '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.subscription_tier.includes(q)
    ) : users);
  }, [search, users]);

  async function setTier(user: UserRow, tier: Tier) {
    setOverriding(true);
    const expiresAt = tier === 'free' || tier === 'lifetime' ? null
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier:       tier,
        subscription_expires_at: expiresAt,
        is_trialing:             false,
        updated_at:              new Date().toISOString(),
      })
      .eq('id', user.id);

    setOverriding(false);
    if (error) { Alert.alert('Error', error.message); return; }

    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_tier: tier, subscription_expires_at: expiresAt, is_trialing: false } : u));
    setSelected(null);
  }

  async function toggleAdmin(user: UserRow) {
    const newVal = !user.is_admin;
    Alert.alert(
      newVal ? 'Grant Admin' : 'Revoke Admin',
      `${newVal ? 'Grant' : 'Revoke'} admin access for ${user.display_name ?? user.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          const { error } = await supabase.from('profiles').update({ is_admin: newVal }).eq('id', user.id);
          if (error) Alert.alert('Error', error.message);
          else setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: newVal } : u));
        }},
      ],
    );
  }

  if (loading) return (
    <AdminShell title="Users">
      <View style={s.loading}><ActivityIndicator size="large" color={Palette.goldBright} /></View>
    </AdminShell>
  );

  const tierCounts = users.reduce((acc, u) => {
    acc[u.subscription_tier] = (acc[u.subscription_tier] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminShell title={`Users (${users.length})`} back="/admin" noScroll>
    <View style={s.root}>

      {/* Tier breakdown */}
      <View style={s.tierRow}>
        {(['free', 'monthly', 'annual', 'lifetime'] as Tier[]).map(t => (
          <View key={t} style={s.tierCard}>
            <Text style={[s.tierCount, { color: TIER_COLORS[t] }]}>{tierCounts[t] ?? 0}</Text>
            <Text style={s.tierLabel}>{t}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or user ID…"
          placeholderTextColor="#3A3028"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} tintColor={Palette.goldBright} />}
        renderItem={({ item: u }) => (
          <Pressable style={s.row} onPress={() => setSelected(u)}>
            <View style={s.rowLeft}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{(u.display_name ?? '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.name} numberOfLines={1}>{u.display_name ?? 'Anonymous'}</Text>
                  {u.is_admin && <Text style={s.adminBadge}>ADMIN</Text>}
                </View>
                <Text style={s.userId} numberOfLines={1}>{u.id}</Text>
              </View>
            </View>
            <View style={s.rowRight}>
              <Text style={[s.tier, { color: TIER_COLORS[u.subscription_tier] }]}>
                {u.is_trialing ? 'trial' : u.subscription_tier}
              </Text>
              <Text style={s.date}>{new Date(u.created_at).toLocaleDateString()}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>No users found.</Text>}
        contentContainerStyle={s.list}
      />

      {/* User detail / override modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={m.backdrop}>
            <ScrollView contentContainerStyle={m.sheet} keyboardShouldPersistTaps="handled">
              <Text style={m.title}>{selected.display_name ?? 'User'}</Text>
              <Text style={m.uid}>{selected.id}</Text>

              <Text style={m.sectionLabel}>SUBSCRIPTION</Text>
              <View style={m.infoRow}>
                <Text style={m.infoLabel}>Current tier</Text>
                <Text style={[m.infoValue, { color: TIER_COLORS[selected.subscription_tier] }]}>
                  {selected.is_trialing ? 'trialing' : selected.subscription_tier}
                </Text>
              </View>
              {selected.subscription_expires_at && (
                <View style={m.infoRow}>
                  <Text style={m.infoLabel}>Expires</Text>
                  <Text style={m.infoValue}>{new Date(selected.subscription_expires_at).toLocaleDateString()}</Text>
                </View>
              )}
              <View style={m.infoRow}>
                <Text style={m.infoLabel}>Joined</Text>
                <Text style={m.infoValue}>{new Date(selected.created_at).toLocaleDateString()}</Text>
              </View>

              <Text style={m.sectionLabel}>OVERRIDE SUBSCRIPTION</Text>
              <Text style={m.overrideNote}>Use for support cases, gifts, or corrections. This bypasses RevenueCat.</Text>
              <View style={m.tierGrid}>
                {(['free', 'monthly', 'annual', 'lifetime'] as Tier[]).map(t => (
                  <Pressable
                    key={t}
                    style={[m.tierBtn, selected.subscription_tier === t && { borderColor: TIER_COLORS[t], backgroundColor: TIER_COLORS[t] + '18' }]}
                    onPress={() => setTier(selected, t)}
                    disabled={overriding}
                  >
                    {overriding && selected.subscription_tier !== t
                      ? <ActivityIndicator size="small" color={TIER_COLORS[t]} />
                      : <Text style={[m.tierBtnText, { color: TIER_COLORS[t] }]}>{t}</Text>
                    }
                  </Pressable>
                ))}
              </View>

              <Text style={m.sectionLabel}>ADMIN</Text>
              <Pressable style={[m.adminBtn, selected.is_admin && m.adminBtnActive]} onPress={() => toggleAdmin(selected)}>
                <Text style={[m.adminBtnText, selected.is_admin && { color: '#E05050' }]}>
                  {selected.is_admin ? 'Revoke Admin Access' : 'Grant Admin Access'}
                </Text>
              </Pressable>

              <Pressable style={m.closeBtn} onPress={() => setSelected(null)}>
                <Text style={m.closeBtnText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
    </AdminShell>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0D1220' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  tierRow:   { flexDirection: 'row', padding: Space[4], gap: Space[3] },
  tierCard:  { flex: 1, backgroundColor: '#141B30', borderRadius: Radius.md, padding: Space[3], alignItems: 'center', borderWidth: 1, borderColor: '#1E2A40' },
  tierCount: { fontFamily: Fonts.serifBold, fontSize: 22 },
  tierLabel: { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#5A5040', marginTop: 2 },

  searchWrap: { paddingHorizontal: Space[4], paddingBottom: Space[2] },
  search: {
    backgroundColor: '#141B30', borderRadius: Radius.md, borderWidth: 1, borderColor: '#1E2A40',
    paddingHorizontal: Space[4], paddingVertical: 10, fontFamily: Fonts.sansRegular, fontSize: 14, color: '#EDE8DD',
  },

  list: { paddingBottom: 60 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space[5], paddingVertical: Space[4],
    borderBottomWidth: 1, borderBottomColor: '#141B2A',
  },
  rowLeft:   { flexDirection: 'row', alignItems: 'center', gap: Space[3], flex: 1 },
  rowRight:  { alignItems: 'flex-end', gap: 4 },
  avatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A2A4A', alignItems: 'center', justifyContent: 'center' },
  avatarText:{ fontFamily: Fonts.serifBold, fontSize: 16, color: Palette.goldMid },
  name:      { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#C0B090' },
  adminBadge:{ fontFamily: Fonts.sansMedium, fontSize: 9, color: Palette.goldBright, backgroundColor: '#1A2030', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  userId:    { fontFamily: 'monospace', fontSize: 10, color: '#3A3028', marginTop: 2 },
  tier:      { fontFamily: Fonts.sansMedium, fontSize: 12 },
  date:      { fontFamily: Fonts.sansRegular, fontSize: 11, color: '#3A3028' },
  empty:     { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#5A5040', textAlign: 'center', padding: 40 },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#0F1825', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Space[6], paddingBottom: 60, gap: Space[3] },
  title:    { fontFamily: Fonts.serifBold, fontSize: 22, color: '#EDE8DD' },
  uid:      { fontFamily: 'monospace', fontSize: 11, color: '#3A3028' },
  sectionLabel: { fontFamily: Fonts.sansMedium, fontSize: 10, color: '#3A3028', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: Space[2] },
  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Space[2], borderBottomWidth: 1, borderBottomColor: '#141B2A' },
  infoLabel:{ fontFamily: Fonts.sansRegular, fontSize: 13, color: '#5A5040' },
  infoValue:{ fontFamily: Fonts.sansMedium,  fontSize: 13, color: '#A09080' },
  overrideNote: { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040', lineHeight: 18 },
  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  tierBtn:  { flex: 1, minWidth: 80, borderWidth: 1, borderColor: '#1E2A40', borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', backgroundColor: '#141B30' },
  tierBtnText:{ fontFamily: Fonts.sansMedium, fontSize: 13 },
  adminBtn: { borderWidth: 1, borderColor: '#1E2A40', borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', backgroundColor: '#141B30' },
  adminBtnActive: { borderColor: '#E0505055', backgroundColor: '#200808' },
  adminBtnText:   { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#5A5040' },
  closeBtn: { backgroundColor: '#1A2340', borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: Space[4] },
  closeBtnText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: '#8B8070' },
});
