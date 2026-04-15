/**
 * Promo code redemption screen.
 *
 * Flow:
 *   1. User enters a code
 *   2. We POST to /v1/promo/redeem (or validate locally for known codes)
 *   3. On success: activate subscription via useSubscriptionStore + show confetti
 *
 * Revenue Cat note: on iOS, Apple gift cards / offer codes are redeemed via
 * Purchases.presentCodeRedemptionSheet() — we surface that as a separate button.
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, Keyboard, Alert, Platform,
  Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import GoldDivider from '@/components/ui/GoldDivider';
import { track, Events } from '@/utils/analytics';

// ── Types ────────────────────────────────────────────────────────────────────

type RedeemResult =
  | { success: true;  tier: 'monthly' | 'annual' | 'lifetime'; days: number; message: string }
  | { success: false; error: string };

// ── Redeem logic ─────────────────────────────────────────────────────────────

async function redeemCode(code: string): Promise<RedeemResult> {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return { success: false, error: 'Please enter a promo code.' };

  try {
    const resp = await fetch(`${Config.API_BASE_URL}/promo/redeem`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: normalised }),
      signal:  AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return { success: false, error: body?.message ?? `Error ${resp.status}` };
    }
    const data = await resp.json();
    return {
      success: true,
      tier:    data.tier ?? 'monthly',
      days:    data.durationDays ?? 30,
      message: data.message ?? 'Promo code redeemed!',
    };
  } catch (e: any) {
    // Network error — fail gracefully
    return {
      success: false,
      error:   e?.name === 'TimeoutError' ? 'Request timed out. Check your connection.' : (e?.message ?? 'Could not connect to server.'),
    };
  }
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function PromoScreen() {
  const [code,    setCode]    = useState('');
  const [busy,    setBusy]    = useState(false);
  const [success, setSuccess] = useState(false);

  const { syncFromPurchase } = useSubscriptionStore();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function triggerShake() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  }

  async function handleRedeem() {
    if (busy) return;
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setBusy(true);
    track(Events.SUBSCRIBE_TAP, { tier: 'promo' });
    try {
      const result = await redeemCode(code);
      if (result.success) {
        // Activate subscription — promo grants 'monthly' tier for `days` days
        const expiresAt = new Date(Date.now() + result.days * 24 * 3600 * 1000).toISOString();
        syncFromPurchase(result.tier, expiresAt);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        track(Events.SUBSCRIBE_SUCCESS, { tier: 'promo' });
        setSuccess(true);
      } else {
        triggerShake();
        Alert.alert('Code not accepted', result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAppleOfferCode() {
    if (Platform.OS !== 'ios') return;
    try {
      const SDK = (await import('react-native-purchases')).default;
      await SDK.presentCodeRedemptionSheet();
    } catch {
      Alert.alert('Not available', 'Please visit the App Store to redeem a gift card.');
    }
  }

  if (success) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={Palette.goldBright} />
          </View>
          <Text style={styles.successHeb}>מַזָּל טוֹב!</Text>
          <Text style={styles.successTitle}>Code redeemed!</Text>
          <Text style={styles.successBody}>
            Your Albert subscription is now active. Enjoy unlimited access to every sefer in the library.
          </Text>
          <Pressable
            style={styles.doneBtn}
            onPress={() => { Haptics.selectionAsync(); router.replace('/(tabs)'); }}
          >
            <LinearGradient
              colors={[Palette.goldBright, Palette.goldMid]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.doneBtnGrad}
            >
              <Text style={styles.doneBtnText}>Start Reading</Text>
            </LinearGradient>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Palette.goldMid} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </SafeAreaView>

      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.headerHeb}>קוד מבצע</Text>
        <GoldDivider marginVertical={10} opacity={0.4} />
        <Text style={styles.headerTitle}>Redeem a Code</Text>
        <Text style={styles.headerSub}>
          Enter a promo code, gift code, or institutional access code below.
        </Text>

        {/* Input */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TextInput
            style={[styles.input, code.length > 0 && styles.inputActive]}
            placeholder="e.g. ALBERT2026"
            placeholderTextColor="#3A4050"
            value={code}
            onChangeText={t => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleRedeem}
            maxLength={32}
          />
        </Animated.View>

        {/* Redeem button */}
        <Pressable style={styles.redeemBtn} onPress={handleRedeem} disabled={busy || !code.trim()}>
          <LinearGradient
            colors={code.trim() ? [Palette.goldBright, Palette.goldMid] : ['#2A3450', '#1A2440']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.redeemBtnGrad}
          >
            {busy
              ? <ActivityIndicator color={Palette.navyDeep} />
              : <Text style={[styles.redeemBtnText, !code.trim() && { color: '#4A5060' }]}>
                  Redeem Code
                </Text>}
          </LinearGradient>
        </Pressable>

        <GoldDivider marginVertical={Space[6]} opacity={0.15} />

        {/* Apple offer codes (iOS only) */}
        {Platform.OS === 'ios' && (
          <Pressable style={styles.secondaryBtn} onPress={handleAppleOfferCode}>
            <Ionicons name="gift-outline" size={18} color={Palette.goldMid} />
            <Text style={styles.secondaryBtnText}>Redeem App Store Gift Card</Text>
          </Pressable>
        )}

        {/* Help link */}
        <Text style={styles.helpText}>
          Codes are case-insensitive and single-use.{'\n'}
          Contact{' '}
          <Text style={styles.helpLink}>{Config.SUPPORT_EMAIL}</Text>
          {' '}if you need assistance.
        </Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Palette.navyDeep,
  },
  safeTop: {
    paddingHorizontal: Space[4],
    paddingTop:        Space[2],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingVertical: Space[2],
  },
  backText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   15,
    color:      Palette.goldMid,
  },
  content: {
    flex:              1,
    paddingHorizontal: Space[6],
    paddingTop:        Space[6],
    alignItems:        'center',
  },
  headerHeb: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   28,
    color:      Palette.goldBright,
    textAlign:  'center',
  },
  headerTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#FDFAF4',
    textAlign:  'center',
  },
  headerSub: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
    color:      '#7A6A50',
    textAlign:  'center',
    lineHeight: 22,
    marginTop:  Space[2],
    marginBottom: Space[6],
    maxWidth:   320,
  },
  input: {
    width:             320,
    backgroundColor:   '#141B30',
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       '#243558',
    color:             '#EDE8DD',
    fontFamily:        Fonts.sansBold,
    fontSize:          22,
    letterSpacing:     4,
    textAlign:         'center',
    paddingVertical:   Space[5],
    paddingHorizontal: Space[5],
    marginBottom:      Space[4],
  },
  inputActive: {
    borderColor: Palette.goldMid + '80',
  },
  redeemBtn: {
    width:        320,
    borderRadius: Radius.pill,
    overflow:     'hidden',
  },
  redeemBtnGrad: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  redeemBtnText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      16,
    color:         Palette.navyDeep,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    paddingVertical: Space[4],
    paddingHorizontal: Space[6],
    borderRadius:    Radius.pill,
    borderWidth:     1,
    borderColor:     Palette.goldMid + '35',
    marginBottom:    Space[5],
  },
  secondaryBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  helpText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#4A4030',
    textAlign:  'center',
    lineHeight: 19,
    maxWidth:   280,
  },
  helpLink: {
    color:              Palette.goldMid,
    textDecorationLine: 'underline',
  },

  // Success state
  successWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Space[8],
    gap:            Space[4],
  },
  successIcon: {
    marginBottom: Space[3],
  },
  successHeb: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   32,
    color:      Palette.goldBright,
  },
  successTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#FDFAF4',
    textAlign:  'center',
  },
  successBody: {
    fontFamily: Fonts.serifItalic,
    fontSize:   16,
    color:      '#8B8070',
    textAlign:  'center',
    lineHeight: 24,
    maxWidth:   300,
  },
  doneBtn: {
    width:        280,
    borderRadius: Radius.pill,
    overflow:     'hidden',
    marginTop:    Space[4],
  },
  doneBtnGrad: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  doneBtnText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      17,
    color:         Palette.navyDeep,
    letterSpacing: 0.3,
  },
});
