import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

export default function ProfileScreen() {
  const { tier, isActive, isTrialing, trialDaysLeft, cancelSub } = useSubscriptionStore();
  const {
    myBooks, bookmarks, highlights, positions,
    fontSize, hebrewFontSize, lineHeight, theme,
    isDarkMode, usesSystemTheme,
    setDarkMode, setUsesSystem, setTheme, setFontSize,
  } = useLibraryStore();

  const systemScheme = useColorScheme();
  const hasActive = isActive || isTrialing;

  const booksRead = Object.values(positions).filter(p => p.progress > 0).length;

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
          <SettingsRow icon="🔔" label="Daily Learning Reminder" value={<ToggleSwitch />} />
          <SettingsRow icon="📥" label="Offline Downloads" value="Coming Soon" />
        </SettingsSection>

        <SettingsSection title="Account" hebrewTitle="חשבון">
          <SettingsRow icon="👤" label="Sign In / Register" value="→" onPress={() => {}} />
          <SettingsRow icon="☁️" label="Sync Across Devices" value="Coming Soon" />
          <SettingsRow icon="🎁" label="Gift a Subscription" value="→" onPress={() => {}} />
          <SettingsRow icon="🔒" label="Privacy Policy" value="→" onPress={() => {}} />
          <SettingsRow icon="📜" label="Terms of Service" value="→" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="Support" hebrewTitle="תמיכה">
          <SettingsRow icon="💬" label="Contact Support" value="→" onPress={() => {}} />
          <SettingsRow icon="⭐" label="Rate Albert" value="→" onPress={() => {}} />
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={styles.footerHebrew}>אַלְבֶּרְט</Text>
          <Text style={styles.footerTagline}>The Jewish Reading Library</Text>
          <Text style={styles.footerVersion}>Version 1.1.0</Text>
        </View>

        <View style={{ height: Space[8] }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

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
    <Row style={settingStyles.row} onPress={onPress}>
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
        onPress={() => onChange(Math.max(13, value - 1))}
        style={fontStyles.btn}
      >
        <Text style={fontStyles.btnText}>−</Text>
      </Pressable>
      <Text style={fontStyles.value}>{value}pt</Text>
      <Pressable
        onPress={() => onChange(Math.min(28, value + 1))}
        style={fontStyles.btn}
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

function ToggleSwitch() {
  const [on, setOn] = React.useState(false);
  return (
    <Switch
      value={on}
      onValueChange={setOn}
      trackColor={{ false: '#2A3450', true: Palette.goldMid }}
      thumbColor={on ? Palette.goldBright : '#5A5040'}
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
