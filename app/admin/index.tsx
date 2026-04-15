/**
 * app/admin/index.tsx — Admin Dashboard
 *
 * Stats overview: users by tier, books, promo codes, recent signups.
 * Access at: /admin (web only — npx expo start --web)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, RefreshControl, useWindowDimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { AdminShell } from './components/AdminShell';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers:       number;
  freeUsers:        number;
  monthlyUsers:     number;
  annualUsers:      number;
  lifetimeUsers:    number;
  trialingUsers:    number;
  totalBooks:       number;
  publishedBooks:   number;
  draftBooks:       number;
  totalPromoCodes:  number;
  activePromoCodes: number;
  totalRedemptions: number;
  recentUsers: {
    id: string;
    display_name: string | null;
    subscription_tier: string;
    is_trialing: boolean;
    created_at: string;
  }[];
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Books',         icon: '📚', route: '/admin/books'         as const },
  { label: 'Upload',        icon: '⬆️', route: '/admin/upload'        as const },
  { label: 'Featured',      icon: '★',  route: '/admin/featured'      as const },
  { label: 'Audio',         icon: '♪',  route: '/admin/audio'         as const },
  { label: 'Users',         icon: '👥', route: '/admin/users'         as const },
  { label: 'Promo Codes',   icon: '🎟️', route: '/admin/promo'         as const },
  { label: 'Notifications', icon: '🔔', route: '/admin/notifications' as const },
  { label: 'Settings',      icon: '⚙️', route: '/admin/settings'      as const },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  const loadStats = useCallback(async () => {
    try {
      const [
        { count: totalUsers },
        { data: tiers },
        { count: totalBooks },
        { count: publishedBooks },
        { count: totalPromoCodes },
        { count: activePromoCodes },
        { count: totalRedemptions },
        { data: recentUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('subscription_tier, is_trialing'),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('promo_codes').select('*', { count: 'exact', head: true }),
        supabase.from('promo_codes').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('promo_redemptions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('id, display_name, subscription_tier, is_trialing, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      const tierCounts = { free: 0, monthly: 0, annual: 0, lifetime: 0, trialing: 0 };
      (tiers ?? []).forEach((p: any) => {
        if (p.is_trialing) tierCounts.trialing++;
        if (p.subscription_tier in tierCounts) {
          tierCounts[p.subscription_tier as keyof typeof tierCounts]++;
        }
      });

      setStats({
        totalUsers:       totalUsers     ?? 0,
        freeUsers:        tierCounts.free,
        monthlyUsers:     tierCounts.monthly,
        annualUsers:      tierCounts.annual,
        lifetimeUsers:    tierCounts.lifetime,
        trialingUsers:    tierCounts.trialing,
        totalBooks:       totalBooks     ?? 0,
        publishedBooks:   publishedBooks ?? 0,
        draftBooks:       (totalBooks ?? 0) - (publishedBooks ?? 0),
        totalPromoCodes:  totalPromoCodes  ?? 0,
        activePromoCodes: activePromoCodes ?? 0,
        totalRedemptions: totalRedemptions ?? 0,
        recentUsers:      recentUsers ?? [],
      });
    } catch (e) {
      console.warn('[Admin] stats load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadStats(); };

  if (loading) {
    return (
      <AdminShell title="Dashboard">
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Palette.goldBright} />
        </View>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Dashboard">
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Palette.goldBright} />}
      >
        {/* Mobile-only nav grid (sidebar covers this on web) */}
        {!isWide && (
          <>
            <View style={s.header}>
              <Text style={s.headerHebrew}>ניהול</Text>
              <Text style={s.headerTitle}>Dashboard</Text>
            </View>
            <View style={s.navGrid}>
              {NAV_ITEMS.map(item => (
                <Pressable
                  key={item.route}
                  style={s.navCard}
                  onPress={() => router.push(item.route)}
                >
                  <Text style={s.navCardIcon}>{item.icon}</Text>
                  <Text style={s.navCardLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

      {stats && (
        <>
          {/* Users stats */}
          <SectionHeader title="Users" />
          <View style={s.statsGrid}>
            <StatCard value={stats.totalUsers}    label="Total Users"    color="#4A9EFF" />
            <StatCard value={stats.freeUsers}     label="Free"           color="#8B8070" />
            <StatCard value={stats.trialingUsers} label="Trialing"       color="#E8C547" />
            <StatCard value={stats.monthlyUsers}  label="Monthly"        color="#66BB6A" />
            <StatCard value={stats.annualUsers}   label="Annual"         color="#42A5F5" />
            <StatCard value={stats.lifetimeUsers} label="Lifetime"       color="#CE93D8" />
          </View>

          {/* Books stats */}
          <SectionHeader title="Books" />
          <View style={s.statsGrid}>
            <StatCard value={stats.totalBooks}     label="Total Books"    color="#4A9EFF" />
            <StatCard value={stats.publishedBooks} label="Published"      color="#66BB6A" />
            <StatCard value={stats.draftBooks}     label="Drafts"         color="#FFA726" />
          </View>

          {/* Promo stats */}
          <SectionHeader title="Promo Codes" />
          <View style={s.statsGrid}>
            <StatCard value={stats.totalPromoCodes}  label="Total Codes"   color="#4A9EFF" />
            <StatCard value={stats.activePromoCodes} label="Active"        color="#66BB6A" />
            <StatCard value={stats.totalRedemptions} label="Redemptions"   color="#E8C547" />
          </View>

          {/* Recent signups */}
          <SectionHeader title="Recent Sign-ups" />
          <View style={s.tableCard}>
            <View style={s.tableHeader}>
              <Text style={[s.tableCell, s.tableHeadText, { flex: 2 }]}>User</Text>
              <Text style={[s.tableCell, s.tableHeadText, { flex: 1 }]}>Plan</Text>
              <Text style={[s.tableCell, s.tableHeadText, { flex: 1 }]}>Joined</Text>
            </View>
            {stats.recentUsers.map(u => (
              <View key={u.id} style={s.tableRow}>
                <Text style={[s.tableCell, s.tableCellText, { flex: 2 }]} numberOfLines={1}>
                  {u.display_name ?? u.id.slice(0, 8)}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>
                  <TierBadge tier={u.subscription_tier} trialing={u.is_trialing} />
                </Text>
                <Text style={[s.tableCell, s.tableMutedText, { flex: 1 }]}>
                  {new Date(u.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </AdminShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Text style={[s.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function TierBadge({ tier, trialing }: { tier: string; trialing: boolean }) {
  const label = trialing ? 'Trial' : tier;
  const color =
    tier === 'lifetime' ? '#CE93D8' :
    tier === 'annual'   ? '#42A5F5' :
    tier === 'monthly'  ? '#66BB6A' :
    trialing            ? '#E8C547' : '#8B8070';
  return <Text style={{ color, fontFamily: Fonts.sansMedium, fontSize: 12 }}>{label}</Text>;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1220' },
  content: { padding: Space[5], maxWidth: 960, alignSelf: 'center', width: '100%' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D1220' },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    paddingTop:     Space[8],
    paddingBottom:  Space[5],
  },
  headerHebrew: { fontFamily: Fonts.hebrewBlack, fontSize: 14, color: Palette.goldBright, letterSpacing: 1 },
  headerTitle:  { fontFamily: Fonts.serifBold,   fontSize: 28, color: '#EDE8DD', marginTop: 4 },
  backBtn:  { backgroundColor: '#1A2340', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  backBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Palette.goldMid },

  navGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            Space[3],
    marginBottom:   Space[6],
  },
  navCard: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[5],
    alignItems:      'center',
    gap:             Space[2],
    minWidth:        100,
    flex:            1,
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  navCardIcon:  { fontSize: 28 },
  navCardLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: '#A09080', textAlign: 'center' },

  sectionHeader: {
    fontFamily:    Fonts.sansSemiBold ?? Fonts.sansMedium,
    fontSize:      11,
    color:         '#5A5040',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom:  Space[3],
    marginTop:     Space[5],
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Space[3],
    marginBottom:  Space[2],
  },
  statCard: {
    flex:            1,
    minWidth:        100,
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[4],
    borderTopWidth:  3,
    borderTopColor:  Palette.goldMid,
    borderWidth:     1,
    borderColor:     '#1E2A40',
    gap:             Space[1],
  },
  statValue: { fontFamily: Fonts.serifBold, fontSize: 28, color: '#EDE8DD' },
  statLabel: { fontFamily: Fonts.sansRegular, fontSize: 12, color: '#8B8070' },

  tableCard: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: '#0F1825',
    paddingVertical: Space[3],
    paddingHorizontal: Space[4],
  },
  tableRow: {
    flexDirection:   'row',
    paddingVertical: Space[3],
    paddingHorizontal: Space[4],
    borderTopWidth:  1,
    borderTopColor:  '#1A2340',
    alignItems:      'center',
  },
  tableCell:     { paddingRight: Space[3] },
  tableHeadText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: '#5A5040', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableCellText: { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#C0B090' },
  tableMutedText:{ fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040' },
});
