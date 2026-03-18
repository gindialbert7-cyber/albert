import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import {
  useSubscriptionStore,
  SUBSCRIPTION_PRICES,
  SubscriptionTier,
} from '@/store/useSubscriptionStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

const { width: SCREEN_W } = Dimensions.get('window');
const isTablet = SCREEN_W >= 768;

const PLANS: {
  tier:      Exclude<SubscriptionTier, 'free'>;
  label:     string;
  price:     string;
  period:    string;
  perMonth?: string;
  badge?:    string;
  highlight: boolean;
  features:  string[];
}[] = [
  {
    tier:     'monthly',
    label:    'Monthly',
    price:    '$9.99',
    period:   'per month',
    highlight: false,
    features: [
      'Full library access',
      'Hebrew-English bilingual layouts',
      'Highlights & bookmarks',
      'New titles every month',
    ],
  },
  {
    tier:      'annual',
    label:     'Annual',
    price:     '$79.99',
    period:    'per year',
    perMonth:  '$6.67 / month',
    badge:     'SAVE 33%',
    highlight: true,
    features: [
      'Everything in Monthly',
      'Priority access to new sefarim',
      'Downloadable for offline learning',
      'Study groups & chevrusa tools',
    ],
  },
  {
    tier:     'lifetime',
    label:    'Lifetime',
    price:    '$199.99',
    period:   'one time',
    badge:    'BEST VALUE',
    highlight: false,
    features: [
      'Everything in Annual',
      'All future library additions',
      'Family sharing (up to 5 members)',
      'Early access to new features',
    ],
  },
];

const FEATURE_LIST = [
  { icon: '📜', title: 'Every Classic Sefer',       body: 'Chumash with Rashi, Mishnah, Talmud, Shulchan Aruch, Tanya, and much more.' },
  { icon: '🔡', title: 'Bilingual Hebrew-English',  body: 'Side-by-side layouts so you can learn both languages simultaneously.' },
  { icon: '👶', title: "Children's Library",        body: 'Beautiful illustrated books that bring Jewish stories and holidays to life.' },
  { icon: '📚', title: 'Modern Jewish Books',       body: 'Rabbi Sacks, the Rav, Elie Wiesel, and dozens of contemporary authors.' },
  { icon: '🔖', title: 'Highlights & Notes',        body: 'Mark passages, add notes, and review your insights any time.' },
  { icon: '📱', title: 'Tablet-Optimised Layouts',  body: 'Every page is designed to look beautiful on iPad and Android tablets.' },
];

export default function SubscribeScreen() {
  const [selected, setSelected] = useState<Exclude<SubscriptionTier, 'free'>>('annual');
  const { subscribe, startTrial } = useSubscriptionStore();

  function handleSubscribe() {
    subscribe(selected);
    router.replace('/(tabs)');
  }

  function handleTrial() {
    startTrial(7);
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Palette.navyDeep, '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Close button */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroHebrew}>בֵּית הַמִּדְרָשׁ שֶׁלְּךָ</Text>
          <GoldDivider marginVertical={10} opacity={0.5} />
          <Text style={styles.heroTitle}>Your Personal{'\n'}Jewish Library</Text>
          <Text style={styles.heroSubtitle}>
            Every sefer. Every classic. Every story.{'\n'}
            Beautifully formatted for the way you learn.
          </Text>
        </View>

        {/* ── Trial banner ──────────────────────────────────────────── */}
        <View style={styles.trialBanner}>
          <LinearGradient
            colors={[Palette.goldBright + '20', Palette.goldMid + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trialBannerGrad}
          >
            <Text style={styles.trialBannerText}>
              ✦  Start your{' '}
              <Text style={styles.trialBannerBold}>7-day free trial</Text>
              {' '}— no charge until your trial ends  ✦
            </Text>
          </LinearGradient>
        </View>

        {/* ── Plan cards ────────────────────────────────────────────── */}
        <View style={[styles.plansRow, isTablet && styles.plansRowTablet]}>
          {PLANS.map(plan => (
            <Pressable
              key={plan.tier}
              style={[
                styles.planCard,
                isTablet && styles.planCardTablet,
                selected === plan.tier && styles.planCardSelected,
                plan.highlight && styles.planCardHighlight,
              ]}
              onPress={() => setSelected(plan.tier)}
            >
              {plan.badge && (
                <View style={[styles.planBadge, plan.highlight && styles.planBadgeGold]}>
                  <Text style={[styles.planBadgeText, plan.highlight && styles.planBadgeTextGold]}>
                    {plan.badge}
                  </Text>
                </View>
              )}

              <Text style={[styles.planLabel, plan.highlight && styles.planLabelGold]}>
                {plan.label}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>

              {plan.perMonth && (
                <Text style={styles.planPerMonth}>{plan.perMonth}</Text>
              )}

              <GoldDivider marginVertical={10} opacity={0.2} />

              <View style={styles.planFeatures}>
                {plan.features.map(f => (
                  <Text key={f} style={styles.planFeatureText}>✓  {f}</Text>
                ))}
              </View>

              {selected === plan.tier && (
                <View style={styles.planCheck}>
                  <Text style={styles.planCheckText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <View style={styles.ctaBlock}>
          <Pressable style={styles.trialBtn} onPress={handleTrial}>
            <LinearGradient
              colors={[Palette.goldBright, Palette.goldMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trialBtnGrad}
            >
              <Text style={styles.trialBtnText}>Start 7-Day Free Trial</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.subBtn} onPress={handleSubscribe}>
            <Text style={styles.subBtnText}>
              Subscribe Now — {SUBSCRIPTION_PRICES[selected].price}{' '}
              {selected === 'lifetime' ? 'one time' : `/ ${SUBSCRIPTION_PRICES[selected].period}`}
            </Text>
          </Pressable>

          <Text style={styles.legalText}>
            Cancel anytime. Subscriptions auto-renew until cancelled.
            By subscribing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        {/* ── Feature grid ──────────────────────────────────────────── */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Everything You Need to Learn</Text>
          <GoldDivider marginVertical={12} opacity={0.3} />

          <View style={[styles.featuresGrid, isTablet && styles.featuresGridTablet]}>
            {FEATURE_LIST.map(f => (
              <View key={f.title} style={[styles.featureItem, isTablet && styles.featureItemTablet]}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Testimonials ──────────────────────────────────────────── */}
        <View style={styles.testimonials}>
          <GoldDivider marginVertical={0} opacity={0.2} />
          <View style={styles.testimonialInner}>
            <Text style={styles.testimonialQuote}>
              "Albert has completely transformed the way I learn. Having the Chumash with Rashi, the Tanya, and Pirkei Avos all beautifully formatted in one place is extraordinary."
            </Text>
            <Text style={styles.testimonialAuthor}>— Avraham S., Bnei Brak</Text>
          </View>
          <GoldDivider marginVertical={0} opacity={0.2} />
        </View>

        <View style={{ height: Space[10] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1220',
  },
  safeTop: {
    position: 'absolute',
    top:      0,
    right:    0,
    zIndex:   100,
  },
  closeBtn: {
    margin:          Space[5],
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: '#FFFFFF15',
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   16,
    color:      '#EDE8DD',
  },

  scrollContent: {
    paddingTop:       Platform.OS === 'ios' ? 60 : 40,
    paddingBottom:    Space[10],
  },

  // Hero
  hero: {
    alignItems:        'center',
    paddingHorizontal: Space[6],
    paddingVertical:   Space[8],
    gap:               Space[3],
  },
  heroHebrew: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   isTablet ? 42 : 34,
    color:      Palette.goldBright,
    textAlign:  'center',
  },
  heroTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   isTablet ? 36 : 30,
    color:      '#FDFAF4',
    textAlign:  'center',
    lineHeight: isTablet ? 44 : 38,
  },
  heroSubtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize:   16,
    color:      '#A89880',
    textAlign:  'center',
    lineHeight: 24,
  },

  // Trial banner
  trialBanner: {
    marginHorizontal: Space[5],
    marginBottom:     Space[6],
    borderRadius:     Radius.md,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      Palette.goldMid + '40',
  },
  trialBannerGrad: {
    paddingVertical:   12,
    paddingHorizontal: Space[5],
  },
  trialBannerText: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      Palette.goldBright,
    textAlign:  'center',
  },
  trialBannerBold: {
    fontFamily: Fonts.serifBold,
  },

  // Plan cards
  plansRow: {
    paddingHorizontal: Space[5],
    gap:               Space[4],
    marginBottom:      Space[6],
  },
  plansRowTablet: {
    flexDirection: 'row',
  },
  planCard: {
    backgroundColor: '#141B30',
    borderRadius:    Radius.lg,
    padding:         Space[5],
    borderWidth:     2,
    borderColor:     '#243558',
    position:        'relative',
    overflow:        'hidden',
  },
  planCardTablet: {
    flex: 1,
  },
  planCardSelected: {
    borderColor: Palette.goldMid,
  },
  planCardHighlight: {
    borderColor: Palette.goldBright + '60',
  },

  planBadge: {
    position:         'absolute',
    top:              12,
    right:            12,
    backgroundColor:  '#243558',
    paddingHorizontal:8,
    paddingVertical:  4,
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      '#3A4560',
  },
  planBadgeGold: {
    backgroundColor: Palette.goldBright + '20',
    borderColor:     Palette.goldBright + '60',
  },
  planBadgeText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      10,
    letterSpacing: 0.8,
    color:         '#8B8070',
  },
  planBadgeTextGold: {
    color: Palette.goldBright,
  },

  planLabel: {
    fontFamily: Fonts.serifBold,
    fontSize:   17,
    color:      '#EDE8DD',
    marginBottom: 4,
  },
  planLabelGold: {
    color: Palette.goldBright,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           6,
    marginTop:     4,
  },
  planPrice: {
    fontFamily: Fonts.sansBold,
    fontSize:   28,
    color:      '#FDFAF4',
  },
  planPeriod: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#5A5040',
  },
  planPerMonth: {
    fontFamily: Fonts.serifItalic,
    fontSize:   12,
    color:      Palette.goldMid,
    marginTop:  2,
  },

  planFeatures: {
    gap: 6,
  },
  planFeatureText: {
    fontFamily: Fonts.serifRegular,
    fontSize:   13,
    color:      '#A89880',
    lineHeight: 20,
  },

  planCheck: {
    position:         'absolute',
    bottom:           Space[4],
    right:            Space[4],
    width:            24,
    height:           24,
    borderRadius:     12,
    backgroundColor:  Palette.goldBright,
    alignItems:       'center',
    justifyContent:   'center',
  },
  planCheckText: {
    fontFamily: Fonts.sansBold,
    fontSize:   12,
    color:      Palette.navyDeep,
  },

  // CTA
  ctaBlock: {
    paddingHorizontal: Space[5],
    gap:               Space[3],
    marginBottom:      Space[8],
  },
  trialBtn: {
    borderRadius: Radius.pill,
    overflow:     'hidden',
  },
  trialBtnGrad: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  trialBtnText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      17,
    color:         Palette.navyDeep,
    letterSpacing: 0.3,
  },
  subBtn: {
    paddingVertical:   14,
    borderRadius:      Radius.pill,
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       Palette.goldMid + '50',
    backgroundColor:   '#FFFFFF08',
  },
  subBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   15,
    color:      '#C8BFA8',
  },
  legalText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#4A4030',
    textAlign:  'center',
    lineHeight: 17,
  },

  // Features section
  featuresSection: {
    paddingHorizontal: Space[5],
    marginBottom:      Space[8],
    gap:               Space[3],
  },
  featuresSectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   22,
    color:      '#EDE8DD',
    textAlign:  'center',
  },
  featuresGrid: {
    gap: Space[4],
  },
  featuresGridTablet: {
    flexDirection:  'row',
    flexWrap:       'wrap',
  },
  featureItem: {
    gap:             4,
    backgroundColor: '#141B30',
    borderRadius:    Radius.md,
    padding:         Space[5],
    borderWidth:     1,
    borderColor:     '#1E2A40',
  },
  featureItemTablet: {
    width: '48%',
    flexGrow: 1,
  },
  featureIcon: {
    fontSize:     28,
    marginBottom: 4,
  },
  featureTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   16,
    color:      '#EDE8DD',
  },
  featureBody: {
    fontFamily: Fonts.serifRegular,
    fontSize:   13,
    color:      '#8B8070',
    lineHeight: 20,
  },

  // Testimonials
  testimonials: {
    paddingHorizontal: Space[5],
    marginBottom:      Space[8],
  },
  testimonialInner: {
    paddingVertical:   Space[6],
    paddingHorizontal: Space[4],
    alignItems:        'center',
    gap:               Space[3],
  },
  testimonialQuote: {
    fontFamily: Fonts.serifItalic,
    fontSize:   16,
    color:      '#C8BFA8',
    textAlign:  'center',
    lineHeight: 26,
  },
  testimonialAuthor: {
    fontFamily: Fonts.serifRegular,
    fontSize:   13,
    color:      Palette.goldMid,
  },
});
