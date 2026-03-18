import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions,
  ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { track, Events } from '@/utils/analytics';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STEPS = [
  {
    id:       'welcome',
    hebrew:   'בְּרוּכִים הַבָּאִים',
    title:    'Welcome to Albert',
    subtitle: 'The Jewish Reading Library',
    body:     'Thousands of years of Jewish wisdom — Torah, Talmud, Halacha, Mussar, Chassidus, and modern Jewish books — all in one beautifully designed app.',
    icon:     '📖',
  },
  {
    id:       'learn',
    hebrew:   'לִמְדוּ וְהִתְחַדְּשׁוּ',
    title:    'Learn Every Day',
    subtitle: 'Daily learning built in',
    body:     'Start each day with a mishna from Pirkei Avos, a weekly parasha update, and a daily quote from the gedolim. Jewish wisdom, always at your fingertips.',
    icon:     '🕯️',
  },
  {
    id:       'read',
    hebrew:   'קִרְאוּ בְּנֹחַ',
    title:    'Read Beautifully',
    subtitle: 'Designed for serious learning',
    body:     'Hebrew and English side by side. Four reading themes. Adjustable fonts. Bookmark passages. Highlight text. Save your reading position across all your sefarim.',
    icon:     '✨',
  },
  {
    id:       'subscribe',
    hebrew:   'הִצְטָרְפוּ אֵלֵינוּ',
    title:    'Start for Free',
    subtitle: '7-day free trial included',
    body:     'Access every sefer, every day, on every device. Cancel anytime. Your learning, uninterrupted.',
    icon:     '✦',
  },
];

export default function OnboardingScreen() {
  const [step,     setStep]     = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { markOnboardingDone, startTrial } = useSubscriptionStore();

  const currentStep = STEPS[step];
  const isLast      = step === STEPS.length - 1;

  React.useEffect(() => {
    track(Events.ONBOARDING_START);
  }, []);

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      finish(false);
    } else {
      const nextStep = step + 1;
      track(Events.ONBOARDING_STEP, { step: nextStep, stepId: STEPS[nextStep].id });
      setStep(nextStep);
    }
  }

  function finish(withTrial: boolean) {
    track(Events.ONBOARDING_COMPLETE, { withTrial });
    markOnboardingDone();
    if (withTrial) startTrial(7);
    router.replace('/(tabs)');
  }

  function skip() {
    track(Events.ONBOARDING_SKIP, { atStep: step });
    markOnboardingDone();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#060D1A', Palette.navyDeep, '#0A1428']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Skip button */}
        <View style={styles.skipRow}>
          {step < STEPS.length - 1 && (
            <Pressable onPress={skip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={[Palette.navyMid, '#1A2744']}
            style={styles.iconCircle}
          >
            <Text style={styles.icon}>{currentStep.icon}</Text>
          </LinearGradient>
        </View>

        {/* Hebrew label */}
        <Text style={styles.hebrew}>{currentStep.hebrew}</Text>
        <GoldDivider marginVertical={12} opacity={0.4} />

        {/* Title */}
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

        {/* Body */}
        <Text style={styles.body}>{currentStep.body}</Text>

        {/* Feature list on step 2 */}
        {step === 2 && (
          <View style={styles.featureList}>
            {[
              { icon: '📍', text: 'Save your reading position' },
              { icon: '🔖', text: 'Bookmark important passages' },
              { icon: '✏️', text: 'Highlight text in 5 colors' },
              { icon: '🌙', text: 'Night mode for late-night learning' },
            ].map(f => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pricing on last step */}
        {isLast && (
          <View style={styles.pricingRow}>
            {[
              { label: 'Monthly', price: '$9.99', sub: '/month' },
              { label: 'Annual',  price: '$79.99', sub: '/year · Save 33%', highlighted: true },
              { label: 'Lifetime', price: '$199.99', sub: 'once' },
            ].map(p => (
              <View key={p.label} style={[styles.priceCard, p.highlighted && styles.priceCardHL]}>
                <Text style={[styles.priceLabel, p.highlighted && styles.priceLabelHL]}>{p.label}</Text>
                <Text style={[styles.priceAmount, p.highlighted && styles.priceAmountHL]}>{p.price}</Text>
                <Text style={[styles.priceSub, p.highlighted && styles.priceSubHL]}>{p.sub}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <Pressable key={i} onPress={() => setStep(i)}>
              <View style={[styles.dot, i === step && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* CTA buttons */}
        <View style={styles.btnArea}>
          {isLast ? (
            <>
              <Pressable style={styles.trialBtn} onPress={() => finish(true)}>
                <LinearGradient
                  colors={[Palette.goldBright, Palette.goldMid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.trialBtnGrad}
                >
                  <Text style={styles.trialBtnText}>Start Free 7-Day Trial</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => finish(false)}>
                <Text style={styles.maybeLater}>Maybe later — browse free books</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.nextBtn} onPress={goNext}>
              <LinearGradient
                colors={[Palette.navyMid, '#1A2744']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGrad}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060D1A',
  },
  safe: {
    flex:              1,
    paddingHorizontal: Space[7],
    alignItems:        'center',
    justifyContent:    'center',
  },
  skipRow: {
    position:  'absolute',
    top:       Space[4],
    right:     Space[5],
    alignSelf: 'flex-end',
  },
  skipBtn: {
    paddingHorizontal: Space[4],
    paddingVertical:   Space[2],
  },
  skipText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#3A4A60',
  },

  // Icon
  iconWrap: {
    marginBottom: Space[6],
  },
  iconCircle: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    Palette.goldMid + '30',
  },
  icon: {
    fontSize: 36,
  },

  // Text
  hebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   20,
    color:      Palette.goldBright,
    textAlign:  'center',
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
    textAlign:  'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize:   16,
    color:      '#8B8070',
    textAlign:  'center',
    marginBottom: Space[5],
  },
  body: {
    fontFamily: Fonts.serifRegular,
    fontSize:   16,
    color:      '#C8BFA8',
    textAlign:  'center',
    lineHeight: 25,
    marginBottom: Space[5],
  },

  // Feature list
  featureList: {
    alignSelf:    'stretch',
    gap:          Space[3],
    marginBottom: Space[5],
    backgroundColor: '#0A1428',
    borderRadius: Radius.lg,
    padding:      Space[5],
    borderWidth:  1,
    borderColor:  Palette.goldMid + '20',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
  },
  featureIcon: {
    fontSize: 18,
    width:    28,
    textAlign: 'center',
  },
  featureText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   14,
    color:      '#C8BFA8',
    flex:       1,
  },

  // Pricing
  pricingRow: {
    flexDirection: 'row',
    gap:           Space[3],
    alignSelf:     'stretch',
    marginBottom:  Space[5],
  },
  priceCard: {
    flex:           1,
    backgroundColor:'#0A1428',
    borderRadius:   Radius.md,
    padding:        Space[3],
    alignItems:     'center',
    borderWidth:    1,
    borderColor:    '#1E2A40',
    gap:            2,
  },
  priceCardHL: {
    backgroundColor: Palette.navyMid,
    borderColor:     Palette.goldMid + '60',
  },
  priceLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   11,
    color:      '#5A5040',
    letterSpacing: 0.3,
  },
  priceLabelHL: {
    color: Palette.goldMid,
  },
  priceAmount: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      '#EDE8DD',
  },
  priceAmountHL: {
    color: Palette.goldBright,
  },
  priceSub: {
    fontFamily: Fonts.sansRegular,
    fontSize:   9,
    color:      '#3A4050',
    textAlign:  'center',
  },
  priceSubHL: {
    color: Palette.goldMid + '90',
  },

  // Dots
  dotsRow: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   Space[6],
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: '#1E2A40',
  },
  dotActive: {
    backgroundColor: Palette.goldBright,
    width:           20,
  },

  // Buttons
  btnArea: {
    alignSelf:     'stretch',
    gap:           Space[3],
    alignItems:    'center',
  },
  nextBtn: {
    width:        '100%',
    borderRadius: Radius.pill,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  Palette.goldMid + '40',
  },
  nextBtnGrad: {
    paddingVertical:   16,
    alignItems:        'center',
    borderRadius:      Radius.pill,
  },
  nextBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   16,
    color:      '#EDE8DD',
    letterSpacing: 0.3,
  },
  trialBtn: {
    width:        '100%',
    borderRadius: Radius.pill,
    overflow:     'hidden',
  },
  trialBtnGrad: {
    paddingVertical: 16,
    alignItems:      'center',
    borderRadius:    Radius.pill,
  },
  trialBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },
  maybeLater: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#3A4050',
  },
});
