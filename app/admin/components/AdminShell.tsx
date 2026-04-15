/**
 * app/admin/components/AdminShell.tsx
 *
 * Unified shell for every admin screen.
 * - Web (width ≥ 768px): fixed 220px sidebar + scrollable main area
 * - Mobile: header with back button + optional title
 *
 * Usage:
 *   <AdminShell title="Books" back="/admin">
 *     {children}
 *   </AdminShell>
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  useWindowDimensions, Platform, Modal,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';

// ─── Nav tree ─────────────────────────────────────────────────────────────────

interface NavItem {
  label:  string;
  icon:   string;
  path:   string;
}

interface NavSection {
  section: string;
  items:   NavItem[];
}

const NAV: NavSection[] = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard',     icon: '◈', path: '/admin' },
    ],
  },
  {
    section: 'CONTENT',
    items: [
      { label: 'Books',         icon: '📚', path: '/admin/books' },
      { label: 'Upload Book',   icon: '⬆',  path: '/admin/upload' },
      { label: 'Featured',      icon: '★',  path: '/admin/featured' },
      { label: 'Audio',         icon: '♪',  path: '/admin/audio' },
    ],
  },
  {
    section: 'USERS',
    items: [
      { label: 'Users',         icon: '👤', path: '/admin/users' },
      { label: 'Promo Codes',   icon: '🎟', path: '/admin/promo' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Notifications', icon: '🔔', path: '/admin/notifications' },
      { label: 'Settings',      icon: '⚙', path: '/admin/settings' },
    ],
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ currentPath, onClose }: { currentPath: string; onClose?: () => void }) {
  return (
    <View style={sb.root}>
      <View style={sb.brand}>
        <Text style={sb.brandMark}>✦</Text>
        <Text style={sb.brandText}>Albert Admin</Text>
        {onClose && (
          <Pressable onPress={onClose} style={sb.closeBtn} hitSlop={12}>
            <Text style={sb.closeBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {NAV.map(({ section, items }) => (
          <View key={section} style={sb.section}>
            <Text style={sb.sectionLabel}>{section}</Text>
            {items.map(item => {
              const active = currentPath === item.path ||
                (item.path !== '/admin' && currentPath.startsWith(item.path));
              return (
                <Pressable
                  key={item.path}
                  style={[sb.navItem, active && sb.navItemActive]}
                  onPress={() => {
                    onClose?.();
                    router.push(item.path as any);
                  }}
                >
                  <Text style={sb.navIcon}>{item.icon}</Text>
                  <Text style={[sb.navLabel, active && sb.navLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Back to app */}
      <Pressable style={sb.backToApp} onPress={() => router.replace('/(tabs)')}>
        <Text style={sb.backToAppText}>← Back to App</Text>
      </Pressable>
    </View>
  );
}

// ─── Mobile header ────────────────────────────────────────────────────────────

function MobileHeader({ title, back, onMenuPress }: {
  title?: string;
  back?:  string;
  onMenuPress: () => void;
}) {
  return (
    <View style={mh.root}>
      {back ? (
        <Pressable onPress={() => router.push(back as any)} style={mh.backBtn} hitSlop={8}>
          <Text style={mh.backBtnText}>←</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onMenuPress} style={mh.backBtn} hitSlop={8}>
          <Text style={mh.backBtnText}>☰</Text>
        </Pressable>
      )}
      <Text style={mh.title} numberOfLines={1}>{title ?? 'Admin'}</Text>
      {/* right action placeholder for balance */}
      <View style={{ width: 36 }} />
    </View>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

interface AdminShellProps {
  children:  React.ReactNode;
  title?:    string;
  /** Path to navigate back — only shown on mobile header */
  back?:     string;
  /** Disable the built-in scroll so the child can manage its own FlatList etc. */
  noScroll?: boolean;
}

export function AdminShell({ children, title, back, noScroll }: AdminShellProps) {
  const { width }      = useWindowDimensions();
  const currentPath    = usePathname();
  const isWide         = Platform.OS === 'web' && width >= 768;
  const [menuOpen, setMenuOpen] = useState(false);

  if (isWide) {
    return (
      <View style={sh.wideRoot}>
        <Sidebar currentPath={currentPath} />
        <View style={sh.wideMain}>
          {noScroll
            ? <View style={{ flex: 1 }}>{children}</View>
            : (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={sh.wideContent}
                showsVerticalScrollIndicator={false}
              >
                {title && <Text style={sh.wideTitle}>{title}</Text>}
                {children}
              </ScrollView>
            )
          }
        </View>
      </View>
    );
  }

  // Mobile layout
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1220' }}>
      <MobileHeader title={title} back={back} onMenuPress={() => setMenuOpen(true)} />

      {noScroll
        ? <View style={{ flex: 1 }}>{children}</View>
        : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )
      }

      {/* Mobile slide-in drawer */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={sh.drawerBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={sh.drawerPanel} onPress={() => {}}>
            <Sidebar currentPath={currentPath} onClose={() => setMenuOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Shared subcomponents ─────────────────────────────────────────────────────

/** Section header used inside screen content */
export function AdminSection({ title, action, onAction }: {
  title:     string;
  action?:   string;
  onAction?: () => void;
}) {
  return (
    <View style={ac.sectionRow}>
      <Text style={ac.sectionTitle}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} style={ac.sectionAction}>
          <Text style={ac.sectionActionText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Stat card shown in grids */
export function StatCard({ label, value, color }: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View style={ac.statCard}>
      <Text style={[ac.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={ac.statLabel}>{label}</Text>
    </View>
  );
}

/** Inline row with label + value */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={ac.infoRow}>
      <Text style={ac.infoLabel}>{label}</Text>
      <Text style={ac.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SIDEBAR_W = 220;
const BG_DEEP   = '#0D1220';
const BG_PANEL  = '#0A1018';
const BORDER    = '#1A2340';
const TEXT_DIM  = '#8B8070';
const TEXT_DIMMER = '#3A3028';

const sb = StyleSheet.create({
  root: {
    width:           SIDEBAR_W,
    backgroundColor: BG_PANEL,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    paddingTop:       Space[6],
    flexShrink:       0,
  },
  brand: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Space[5],
    paddingBottom:  Space[5],
    gap:            Space[2],
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom:   Space[4],
  },
  brandMark: { fontSize: 18, color: Palette.goldBright },
  brandText: { fontFamily: Fonts.serifBold, fontSize: 16, color: '#EDE8DD', flex: 1 },
  closeBtn:  { padding: 4 },
  closeBtnText: { fontSize: 16, color: TEXT_DIM },

  section:      { marginBottom: Space[2], paddingHorizontal: Space[3] },
  sectionLabel: { fontFamily: Fonts.sansMedium, fontSize: 9, color: TEXT_DIMMER, letterSpacing: 1.4, marginBottom: Space[1], paddingHorizontal: Space[2] },

  navItem: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:  8,
    paddingHorizontal: Space[2],
    borderRadius:   Radius.md,
    gap:            Space[2],
  },
  navItemActive: { backgroundColor: '#141B30' },
  navIcon:  { fontSize: 14, width: 20, textAlign: 'center' },
  navLabel: { fontFamily: Fonts.sansRegular, fontSize: 13, color: TEXT_DIM },
  navLabelActive: { color: Palette.goldBright, fontFamily: Fonts.sansMedium },

  backToApp: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    padding:        Space[4],
  },
  backToAppText: { fontFamily: Fonts.sansRegular, fontSize: 13, color: TEXT_DIMMER },
});

const mh = StyleSheet.create({
  root: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: BG_PANEL,
    paddingTop:     Space[8],
    paddingHorizontal: Space[4],
    paddingBottom:  Space[3],
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontFamily: Fonts.sansMedium, fontSize: 20, color: Palette.goldMid },
  title:       { fontFamily: Fonts.serifBold, fontSize: 18, color: '#EDE8DD', flex: 1, textAlign: 'center' },
});

const sh = StyleSheet.create({
  wideRoot: { flex: 1, flexDirection: 'row', backgroundColor: BG_DEEP },
  wideMain: { flex: 1, backgroundColor: BG_DEEP },
  wideContent: { padding: Space[6], maxWidth: 960, alignSelf: 'center', width: '100%', paddingBottom: 80 },
  wideTitle: { fontFamily: Fonts.serifBold, fontSize: 26, color: '#EDE8DD', marginBottom: Space[6] },

  drawerBackdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-start' },
  drawerPanel: { width: SIDEBAR_W + 16, height: '100%' },
});

const ac = StyleSheet.create({
  sectionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[3],
    marginTop:      Space[2],
  },
  sectionTitle: { fontFamily: Fonts.sansMedium, fontSize: 11, color: TEXT_DIMMER, letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionAction: { backgroundColor: Palette.goldBright, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.md },
  sectionActionText: { fontFamily: Fonts.sansBold, fontSize: 12, color: Palette.navyDeep },

  statCard: {
    flex:            1,
    backgroundColor: '#141B30',
    borderRadius:    Radius.md,
    padding:         Space[4],
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     BORDER,
    minWidth:        80,
  },
  statValue: { fontFamily: Fonts.serifBold, fontSize: 24, color: '#EDE8DD' },
  statLabel: { fontFamily: Fonts.sansRegular, fontSize: 11, color: TEXT_DIM, marginTop: 4 },

  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingVertical: Space[2],
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoLabel: { fontFamily: Fonts.sansRegular, fontSize: 13, color: '#5A5040' },
  infoValue: { fontFamily: Fonts.sansMedium,  fontSize: 13, color: '#A09080' },
});
