import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
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
  const { myBooks, bookmarks, highlights } = useLibraryStore();

  const hasActive = isActive || isTrialing;

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
          <StatCard value={myBooks.length} label="Books" hebrew="ספרים" />
          <StatCard value={bookmarks.length} label="Bookmarks" hebrew="סימניות" />
          <StatCard value={highlights.length} label="Highlights" hebrew="הדגשות" />
        </View>

        {/* ── Settings rows ─────────────────────────────────────────── */}
        <SettingsSection title="Reading" hebrewTitle="קריאה">
          <SettingsRow icon="📖" label="Default Reading Theme" value="Parchment" />
          <SettingsRow icon="🔤" label="Default Font Size" value="18pt" />
          <SettingsRow icon="🌙" label="Use System Dark Mode" value={<ToggleSwitch />} />
        </SettingsSection>

        <SettingsSection title="Content" hebrewTitle="תוכן">
          <SettingsRow icon="📥" label="Offline Downloads" value="Manage" onPress={() => {}} />
          <SettingsRow icon="📚" label="Reading History" value="View" onPress={() => {}} />
          <SettingsRow icon="🔔" label="Daily Learning Reminders" value={<ToggleSwitch />} />
        </SettingsSection>

        <SettingsSection title="Account" hebrewTitle="חשבון">
          <SettingsRow icon="👤" label="Sign In / Register" value="→" onPress={() => {}} />
          <SettingsRow icon="☁️" label="Sync Across Devices" value="Coming Soon" />
          <SettingsRow icon="🔒" label="Privacy Policy" value="→" onPress={() => {}} />
          <SettingsRow icon="📜" label="Terms of Service" value="→" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="Support" hebrewTitle="תמיכה">
          <SettingsRow icon="💬" label="Contact Support" value="→" onPress={() => {}} />
          <SettingsRow icon="⭐" label="Rate Albert" value="→" onPress={() => {}} />
          <SettingsRow icon="🎁" label="Gift a Subscription" value="→" onPress={() => {}} />
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={styles.footerHebrew}>אַלְבֶּרְט</Text>
          <Text style={styles.footerTagline}>The Jewish Reading Library</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
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
    gap:              Space[4],
    marginBottom:     Space[6],
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
    padding:        Space[4],
    alignItems:     'center',
    gap:            2,
    borderWidth:    1,
    borderColor:    '#1E2A40',
  },
  hebrew: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
    color:      Palette.goldMid + '80',
  },
  value: {
    fontFamily: Fonts.sansBold,
    fontSize:   26,
    color:      '#EDE8DD',
  },
  label: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
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
    paddingVertical: 14,
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
