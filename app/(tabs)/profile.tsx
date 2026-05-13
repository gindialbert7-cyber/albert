import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
  useColorScheme, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import GoldDivider from '@/components/ui/GoldDivider';
import { getNotifPrefs, toggleNotifications } from '@/services/notificationService';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { tier, isActive, isTrialing, trialDaysLeft, cancelSub } = useSubscriptionStore();
  const { user, signOut }  = useAuthStore();
  const {
    myBooks, bookmarks, highlights, positions,
    fontSize, hebrewFontSize, lineHeight, theme,
    isDarkMode, usesSystemTheme,
    setDarkMode, setUsesSystem, setTheme, setFontSize,
    streak, longestStreak, totalMinutesRead,
    dailyGoalMinutes, setDailyGoal,
    lastSyncedAt, syncNow,
  } = useLibraryStore();

  const [syncing, setSyncing] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const systemScheme = useColorScheme();
  const hasActive = isActive || isTrialing;

  // Check admin status whenever the logged-in user changes
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(data?.is_admin === true))
      .catch(() => {});
  }, [user?.id]);

  const booksRead = Object.values(positions).filter(p => p.progress > 0).length;
  const hoursRead  = Math.floor(totalMinutesRead / 60);
  const minsRead   = totalMinutesRead % 60;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerHebrew}>פרופיל</Text>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subscription card ─────────────────────────────────────── */}
        <View style={styles.subCardWrap}>
          <LinearGradient
            colors={hasActive ? [Palette.navyMid, Palette.navyDeep] : ['#1A1A1A', '#0A0A0A']}
            style={styles.subCard}
          >
            <View style={styles.subCardRow}>
              <View style={styles.subCardInfo}>
                <Text style={styles.subCardLabel}>
                  {hasActive ? (isTrialing ? 'Free Trial' : 'Albert Premium') : 'Free Plan'}
                </Text>
                {isTrialing && (
                  <Text style={styles.subCardSub}>
                    {trialDaysLeft} days remaining
                  </Text>
                )}
                {isActive && !isTrialing && (
                  <Text style={styles.subCardSub}>
                    {tier === 'lifetime' ? 'Lifetime access' : `${tier} subscription`}
                  </Text>
                )}
                {!hasActive && (
                  <Text style={styles.subCardSub}>Upgrade for full access</Text>
                )}
              </View>
              {hasActive && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeIndicatorText}>✦ ACTIVE</Text>
                </View>
              )}
            </View>
            <GoldDivider marginVertical={12} opacity={0.3} />
            {hasActive ? (
              <Pressable onPress={cancelSub}>
                <Text style={styles.cancelLink}>Cancel subscription</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.upgradeBtn}
                onPress={() => router.push('/subscribe')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Premium →</Text>
              </Pressable>
            )}
          </LinearGradient>
        </View>

        {/* ── Learning Streak ────────────────────────────────────────── */}
        <StreakCard streak={streak} longestStreak={longestStreak} totalMinutesRead={totalMinutesRead} />

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard value={myBooks.length}   label="Books"      hebrew="ספרים" />
          <StatCard value={booksRead}         label="Started"    hebrew="התחלתי" />
          <StatCard value={bookmarks.length}  label="Bookmarks"  hebrew="סימניות" />
          <StatCard value={highlights.length} label="Highlights" hebrew="הדגשות" />
        </View>

        {/* Notes shortcut */}
        <Pressable
          style={styles.notesShortcut}
          onPress={() => router.push('/notes')}
        >
          <Text style={styles.notesShortcutIcon}>🔖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.notesShortcutTitle}>My Notes & Highlights</Text>
            <Text style={styles.notesShortcutSub}>
              {bookmarks.length} bookmarks · {highlights.length} highlights
            </Text>
          </View>
          <Text style={styles.notesShortcutArrow}>→</Text>
        </Pressable>

        {/* ── Reader Settings ────────────────────────────────────────── */}
        <SettingsSection title="Reading" hebrewTitle="קריאה">
          <SettingsRow icon="🎯" label="Daily Learning Goal" value={
            <GoalSelector current={dailyGoalMinutes} onChange={setDailyGoal} />
          } />
          <SettingsRow icon="🎨" label="Reading Theme" value={
            <ThemeSelector current={theme} onChange={setTheme} />
          } />
          <SettingsRow icon="🔤" label="Font Size" value={
            <FontSizeControl value={fontSize} onChange={setFontSize} />
          } />
          <SettingsRow
            icon="🌙"
            label="Follow System Dark Mode"
            value={
              <Switch
                value={usesSystemTheme}
                onValueChange={setUsesSystem}
                trackColor={{ false: '#2A3450', true: Palette.goldMid }}
                thumbColor={usesSystemTheme ? Palette.goldBright : '#5A5040'}
              />
            }
          />
          {!usesSystemTheme && (
            <SettingsRow
              icon="💡"
              label="Dark Mode"
              value={
                <Switch
                  value={isDarkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#2A3450', true: Palette.goldMid }}
                  thumbColor={isDarkMode ? Palette.goldBright : '#5A5040'}
                />
              }
            />
          )}
        </SettingsSection>

        <SettingsSection title="Content" hebrewTitle="תוכן">
          <SettingsRow
            icon="📚"
            label="Notes & Highlights"
            value={`${bookmarks.length + highlights.length}`}
            onPress={() => router.push('/notes')}
          />
          <SettingsRow icon="🔔" label="Daily Learning Reminder" value={<NotificationToggle />} />
          <SettingsRow icon="📥" label="Offline Downloads" value="Coming Soon" />
        </SettingsSection>

        <SettingsSection title="Account" hebrewTitle="חשבון">
          {user ? (
            <>
              <SettingsRow icon="👤" label={user.displayName} value={user.email} />
              <SettingsRow icon="🚪" label="Sign Out" value="→" onPress={() => signOut()} />
            </>
          ) : (
            <SettingsRow icon="👤" label="Sign In / Register" value="→" onPress={() => router.push('/auth/sign-in')} />
          )}
          <SettingsRow
            icon="☁️"
            label="Cloud Sync"
            value={
              user ? (
                <SyncControl
                  lastSyncedAt={lastSyncedAt}
                  syncing={syncing}
                  onSync={async () => {
                    setSyncing(true);
                    await syncNow();
                    setSyncing(false);
                  }}
                />
              ) : (
                <Text style={{ fontFamily: Fonts.sansRegular, fontSize: 12, color: '#5A5040' }}>
                  Sign in to sync
                </Text>
              )
            }
          />
          {isAdmin && (
            <SettingsRow
              icon="⚙️"
              label="Admin Panel"
              value="→"
              onPress={() => router.push('/admin')}
            />
          )}
          <SettingsRow
            icon="🎟️"
            label="Redeem Promo Code"
            value="→"
            onPress={() => router.push('/promo')}
          />
          <SettingsRow
            icon="🎁"
            label="Gift a Subscription"
            value="→"
            onPress={() => Alert.alert(
              'Gift Albert Premium',
              'Gift subscriptions are coming soon! You\'ll be able to gift Monthly, Annual, or Lifetime access to anyone.',
              [{ text: 'Got it', style: 'default' }],
            )}
          />
          <SettingsRow icon="🔒" label="Privacy Policy" value="→" onPress={() => Linking.openURL(Config.PRIVACY_URL)} />
          <SettingsRow icon="📜" label="Terms of Service" value="→" onPress={() => Linking.openURL(Config.TERMS_URL)} />
        </SettingsSection>

        <SettingsSection title="Support" hebrewTitle="תמיכה">
          <SettingsRow
            icon="💬"
            label="Contact Support"
            value="→"
            onPress={() => Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}?subject=Albert App Support`)}
          />
          <SettingsRow
            icon="⭐"
            label="Rate Albert"
            value="→"
            onPress={() => {
              // Opens App Store on iOS, Google Play on Android
              Linking.openURL(
                'https://apps.apple.com/app/id0000000000?action=write-review'
              ).catch(() => {
                Linking.openURL('https://play.google.com/store/apps/details?id=com.albert.ereader');
              });
            }}
          />
          <SettingsRow
            icon="🐛"
            label="Report a Bug"
            value="→"
            onPress={() => Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}?subject=Albert App Bug Report`)}
          />
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={styles.footerHebrew}>אַלְבֶּרְט</Text>
          <Text style={styles.footerTagline}>The Jewish Reading Library</Text>
          <Text style={styles.footerVersion}>Version {Config.APP_VERSION} ({Config.BUILD_NUMBER})</Text>
        </View>

        <View style={{ height: Space[8] }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function StreakCard({
  streak, longestStreak, totalMinutesRead,
}: { streak: number; longestStreak: number; totalMinutesRead: number }) {
  const hours  = Math.floor(totalMinutesRead / 60);
  const mins   = totalMinutesRead % 60;
  const timeLabel = hours > 0
    ? `${hours}h ${mins}m`
    : `${mins}m`;

  const flameColor  = streak > 0 ? '#E8823A' : '#3A3028';
  const streakLabel = streak === 1 ? 'day streak' : 'day streak';

  return (
    <View style={streakStyles.wrap}>
      <LinearGradient
        colors={streak > 0 ? ['#2A1A08', '#1A0F05'] : ['#141B30', '#141B30']}
        style={streakStyles.card}
      >
        <View style={streakStyles.mainRow}>
          {/* Flame + count */}
          <View style={streakStyles.flameBlock}>
            <Text style={[streakStyles.flame, { color: flameColor }]}>
              {streak > 0 ? '🔥' : '✦'}
            </Text>
            <Text style={[streakStyles.count, { color: streak > 0 ? '#F5A050' : '#5A5040' }]}>
              {streak}
            </Text>
            <Text style={[streakStyles.streakLabel, { color: streak > 0 ? '#D4884A' : '#3A3028' }]}>
              {streakLabel}
            </Text>
          </View>

          {/* Divider */}
          <View style={streakStyles.vDivider} />

          {/* Stats */}
          <View style={streakStyles.statsBlock}>
            <View style={streakStyles.statRow}>
              <Text style={streakStyles.statIcon}>⏱</Text>
              <Text style={streakStyles.statValue}>{timeLabel}</Text>
              <Text style={streakStyles.statLabel}>total time</Text>
            </View>
            <View style={streakStyles.statRow}>
              <Text style={streakStyles.statIcon}>🏆</Text>
              <Text style={streakStyles.statValue}>{longestStreak}</Text>
              <Text style={streakStyles.statLabel}>best streak</Text>
            </View>
          </View>
        </View>

        {streak === 0 && (
          <Text style={streakStyles.nudge}>
            Open any book today to start your learning streak!
          </Text>
        )}
        {streak > 0 && streak < 7 && (
          <Text style={streakStyles.nudge}>
            Keep it up — {7 - streak} more {7 - streak === 1 ? 'day' : 'days'} to your first weekly streak 🎯
          </Text>
        )}
        {streak >= 7 && (
          <Text style={streakStyles.nudge}>
            Amazing! You've maintained a {streak}-day learning streak 🔥
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: Space[5],
    marginBottom:     Space[4],
    borderRadius:     Radius.lg,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      Palette.goldMid + '25',
  },
  card: {
    padding: Space[5],
    gap:     Space[3],
  },
  mainRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[4],
  },
  flameBlock: {
    alignItems:  'center',
    gap:         2,
    minWidth:    72,
  },
  flame: {
    fontSize: 32,
  },
  count: {
    fontFamily: Fonts.sansBold,
    fontSize:   36,
    lineHeight: 40,
    color:      '#F5A050',
  },
  streakLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#D4884A',
  },
  vDivider: {
    width:           1,
    height:          70,
    backgroundColor: '#FFFFFF12',
  },
  statsBlock: {
    flex: 1,
    gap:  Space[3],
  },
  statRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  statIcon: {
    fontSize: 14,
    width:    20,
  },
  statValue: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      '#EDE8DD',
    minWidth:   40,
  },
  statLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#5A5040',
  },
  nudge: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#7A6A50',
    textAlign:  'center',
    lineHeight: 18,
  },
});

function StatCard({ value, label, hebrew }: { value: number; label: string; hebrew: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.hebrew}>{hebrew}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function SettingsSection({
  title, hebrewTitle, children,
}: { title: string; hebrewTitle: string; children: React.ReactNode }) {
  return (
    <View style={settingStyles.section}>
      <View style={settingStyles.sectionHeader}>
        <Text style={settingStyles.sectionHebrew}>{hebrewTitle}</Text>
        <Text style={settingStyles.sectionTitle}>{title}</Text>
      </View>
      <View style={settingStyles.sectionRows}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon, label, value, onPress,
}: { icon: string; label: string; value: string | React.ReactNode; onPress?: () => void }) {
  const Row = onPress ? Pressable : View;
  return (
    <Row
      style={settingStyles.row}
      onPress={onPress ? () => { Haptics.selectionAsync(); onPress(); } : undefined}
      accessibilityLabel={label}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <Text style={settingStyles.rowIcon}>{icon}</Text>
      <Text style={settingStyles.rowLabel}>{label}</Text>
      <View style={settingStyles.rowValue}>
        {typeof value === 'string' ? (
          <Text style={settingStyles.rowValueText}>{value}</Text>
        ) : value}
      </View>
    </Row>
  );
}

function ThemeSelector({
  current,
  onChange,
}: { current: string; onChange: (t: any) => void }) {
  const options = [
    { value: 'parchment', label: '🟡', bg: '#F5EFE0' },
    { value: 'sepia',     label: '🟤', bg: '#EAE0CC' },
    { value: 'white',     label: '⚪', bg: '#FFFFFF' },
    { value: 'night',     label: '🌙', bg: '#0F1825' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map(o => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[
            themeStyles.dot,
            { backgroundColor: o.bg },
            current === o.value && themeStyles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const themeStyles = StyleSheet.create({
  dot: {
    width:       22,
    height:      22,
    borderRadius: 11,
    borderWidth:  1,
    borderColor:  '#3A4050',
  },
  dotActive: {
    borderColor:  Palette.goldBright,
    borderWidth:  2,
  },
});

function FontSizeControl({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onChange(Math.max(13, value - 1)); }}
        style={fontStyles.btn}
        accessibilityLabel="Decrease font size"
        accessibilityRole="button"
      >
        <Text style={fontStyles.btnText}>−</Text>
      </Pressable>
      <Text style={fontStyles.value}>{value}pt</Text>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onChange(Math.min(28, value + 1)); }}
        style={fontStyles.btn}
        accessibilityLabel="Increase font size"
        accessibilityRole="button"
      >
        <Text style={fontStyles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const fontStyles = StyleSheet.create({
  btn: {
    width:          26,
    height:         26,
    borderRadius:   13,
    backgroundColor:'#1E2A40',
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      '#EDE8DD',
    lineHeight: 20,
  },
  value: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    color:      '#8B8070',
    minWidth:   32,
    textAlign:  'center',
  },
});

function NotificationToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    getNotifPrefs().then(p => setEnabled(p.enabled));
  }, []);

  async function handleToggle(val: boolean) {
    Haptics.selectionAsync();
    setEnabled(val);
    await toggleNotifications(val);
  }

  return (
    <Switch
      value={enabled}
      onValueChange={handleToggle}
      trackColor={{ false: '#2A3450', true: Palette.goldMid }}
      thumbColor={enabled ? Palette.goldBright : '#5A5040'}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  header: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[4],
    paddingBottom:     Space[3],
    gap:               2,
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
  scrollContent: {
    paddingBottom: Space[10],
  },

  // Subscription card
  subCardWrap: {
    marginHorizontal: Space[5],
    marginBottom:     Space[5],
    borderRadius:     Radius.lg,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      Palette.goldMid + '30',
  },
  subCard: {
    padding: Space[5],
  },
  subCardRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  subCardInfo: { gap: 4 },
  subCardLabel: {
    fontFamily: Fonts.serifBold,
    fontSize:   18,
    color:      '#EDE8DD',
  },
  subCardSub: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#8B8070',
  },
  activeIndicator: {
    backgroundColor:  Palette.goldBright + '20',
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Palette.goldBright + '60',
    paddingHorizontal:10,
    paddingVertical:   5,
  },
  activeIndicatorText: {
    fontFamily: Fonts.sansBold,
    fontSize:   11,
    color:      Palette.goldBright,
    letterSpacing: 0.5,
  },
  cancelLink: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#5A5040',
    textAlign:  'center',
  },
  upgradeBtn: {
    alignItems: 'center',
    paddingVertical: Space[2],
  },
  upgradeBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   14,
    color:      Palette.goldBright,
  },

  // Stats
  statsRow: {
    flexDirection:    'row',
    paddingHorizontal:Space[5],
    gap:              Space[3],
    marginBottom:     Space[4],
  },

  // Notes shortcut
  notesShortcut: {
    flexDirection:   'row',
    alignItems:      'center',
    marginHorizontal: Space[5],
    marginBottom:    Space[5],
    backgroundColor: '#141B30',
    borderRadius:    Radius.md,
    padding:         Space[4],
    gap:             Space[3],
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  notesShortcutIcon: {
    fontSize: 22,
  },
  notesShortcutTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   14,
    color:      '#EDE8DD',
  },
  notesShortcutSub: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#5A5040',
  },
  notesShortcutArrow: {
    fontFamily: Fonts.sansRegular,
    fontSize:   18,
    color:      Palette.goldMid,
  },

  // Footer
  footer: {
    alignItems:        'center',
    paddingVertical:   Space[8],
    paddingHorizontal: Space[5],
    gap:               6,
    borderTopWidth:    1,
    borderTopColor:    '#1E2A40',
  },
  footerHebrew: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   28,
    color:      Palette.goldMid + '60',
  },
  footerTagline: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#4A4030',
  },
  footerVersion: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#2A2A2A',
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex:           1,
    backgroundColor:'#141B30',
    borderRadius:   Radius.md,
    padding:        Space[3],
    alignItems:     'center',
    gap:            1,
    borderWidth:    1,
    borderColor:    '#1E2A40',
  },
  hebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   11,
    color:      Palette.goldMid + '80',
  },
  value: {
    fontFamily: Fonts.sansBold,
    fontSize:   22,
    color:      '#EDE8DD',
  },
  label: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    color:      '#5A5040',
  },
});

const settingStyles = StyleSheet.create({
  section: {
    marginHorizontal: Space[5],
    marginBottom:     Space[5],
    gap:              8,
  },
  sectionHeader: {
    gap: 1,
    paddingLeft: 2,
  },
  sectionHebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   11,
    color:      Palette.goldMid + '70',
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   13,
    color:      '#5A5040',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionRows: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     '#1E2A40',
    overflow:        'hidden',
  },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
    paddingHorizontal:Space[4],
    gap:             12,
    borderBottomWidth:1,
    borderBottomColor:'#1E2A40',
  },
  rowIcon: {
    fontSize: 18,
    width:    28,
    textAlign:'center',
  },
  rowLabel: {
    flex:       1,
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#C8BFA8',
  },
  rowValue: {},
  rowValueText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#5A5040',
  },
});

// ── GoalSelector ──────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [10, 15, 30, 45, 60] as const;

function GoalSelector({ current, onChange }: { current: number; onChange: (m: number) => void }) {
  return (
    <View style={gStyles.row}>
      {GOAL_OPTIONS.map(m => (
        <Pressable
          key={m}
          style={[gStyles.pill, current === m && gStyles.pillActive]}
          onPress={() => onChange(m)}
        >
          <Text style={[gStyles.pillText, current === m && gStyles.pillTextActive]}>
            {m}m
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const gStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       '#1E2A40',
  },
  pillActive: {
    backgroundColor: Palette.navyMid,
    borderColor:     Palette.goldMid,
  },
  pillText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      '#3A4A60',
  },
  pillTextActive: {
    color: Palette.goldBright,
  },
});

// ── SyncControl ───────────────────────────────────────────────────────────────

function SyncControl({
  lastSyncedAt, syncing, onSync,
}: { lastSyncedAt: number | null; syncing: boolean; onSync: () => void }) {
  function label() {
    if (!lastSyncedAt) return 'Never synced';
    const mins = Math.floor((Date.now() - lastSyncedAt) / 60_000);
    if (mins < 1) return 'Synced just now';
    if (mins < 60) return `Synced ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `Synced ${hrs}h ago`;
  }

  return (
    <View style={scStyles.row}>
      <Text style={scStyles.label}>{label()}</Text>
      <Pressable
        style={[scStyles.btn, syncing && scStyles.btnLoading]}
        onPress={onSync}
        disabled={syncing}
      >
        {syncing
          ? <ActivityIndicator size="small" color={Palette.navyDeep} />
          : <Text style={scStyles.btnText}>Sync Now</Text>
        }
      </Pressable>
    </View>
  );
}

const scStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#5A5040',
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      Radius.pill,
    backgroundColor:   Palette.goldBright,
    minWidth:          70,
    alignItems:        'center',
  },
  btnLoading: {
    opacity: 0.7,
  },
  btnText: {
    fontFamily:   Fonts.sansBold,
    fontSize:     11,
    color:        Palette.navyDeep,
    letterSpacing: 0.2,
  },
});
