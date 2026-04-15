import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { forgotPassword } from '@/services/authService';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

type ScreenState = 'idle' | 'loading' | 'sent' | 'error';

export default function ForgotPasswordScreen() {
  const [email,  setEmail]  = useState('');
  const [state,  setState]  = useState<ScreenState>('idle');
  const [errMsg, setErrMsg] = useState('');

  const isValid = email.trim().includes('@');

  async function handleSubmit() {
    if (!isValid) return;
    setState('loading');
    try {
      await forgotPassword(email.trim().toLowerCase());
      setState('sent');
    } catch {
      setErrMsg('Something went wrong. Please try again or contact support.');
      setState('error');
    }
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />

      <SafeAreaView edges={['top']} style={s.topBar}>
        <Pressable
          style={s.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/auth/sign-in')}
        >
          <Text style={s.backText}>← Back</Text>
        </Pressable>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.content}>
          {state === 'sent' ? (
            /* ── Success state ── */
            <View style={s.successCard}>
              <Text style={s.successIcon}>✉️</Text>
              <Text style={s.successTitle}>Check Your Email</Text>
              <Text style={s.successBody}>
                We've sent a password reset link to{'\n'}
                <Text style={s.successEmail}>{email}</Text>
              </Text>
              <Text style={s.successSub}>
                Didn't receive it? Check your spam folder or try again in a few minutes.
              </Text>
              <GoldDivider marginVertical={Space[4]} opacity={0.2} />
              <Pressable onPress={() => router.replace('/auth/sign-in')}>
                <Text style={s.returnLink}>Return to Sign In →</Text>
              </Pressable>
            </View>
          ) : (
            /* ── Form state ── */
            <>
              <View style={s.hero}>
                <Text style={s.heroHebrew}>שכחתי סיסמה</Text>
                <Text style={s.heroTitle}>Reset Your Password</Text>
                <Text style={s.heroSub}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
              </View>

              <GoldDivider marginVertical={0} opacity={0.15} />

              <View style={s.form}>
                {state === 'error' && (
                  <Pressable style={s.errorBanner} onPress={() => setState('idle')}>
                    <Text style={s.errorText}>{errMsg}</Text>
                  </Pressable>
                )}

                <View style={s.fieldWrap}>
                  <Text style={s.label}>Email Address</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor="#4A4030"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    editable={state !== 'loading'}
                  />
                </View>

                <Pressable
                  style={[s.submitBtn, (!isValid || state === 'loading') && s.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!isValid || state === 'loading'}
                >
                  <LinearGradient
                    colors={[Palette.goldBright, Palette.goldMid]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.submitGrad}
                  >
                    {state === 'loading'
                      ? <ActivityIndicator color={Palette.navyDeep} />
                      : <Text style={s.submitText}>Send Reset Link</Text>
                    }
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={s.signInRow}
                  onPress={() => router.replace('/auth/sign-in')}
                >
                  <Text style={s.signInText}>Back to Sign In</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0D1220',
  },
  topBar: {
    paddingHorizontal: Space[5],
  },
  backBtn: {
    paddingVertical: Space[3],
  },
  backText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  content: {
    flex:              1,
    paddingHorizontal: Space[6],
    paddingTop:        Space[4],
  },
  hero: {
    paddingVertical: Space[8],
    alignItems:      'center',
    gap:             Space[3],
  },
  heroHebrew: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   32,
    color:      Palette.goldBright,
  },
  heroTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   26,
    color:      '#FDFAF4',
  },
  heroSub: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#8B8070',
    textAlign:  'center',
    lineHeight: 22,
  },
  form: {
    gap:       Space[4],
    paddingTop:Space[6],
  },
  errorBanner: {
    backgroundColor: '#2A0808',
    borderRadius:    Radius.md,
    padding:         Space[4],
    borderWidth:     1,
    borderColor:     '#5A1010',
  },
  errorText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      '#E07070',
    textAlign:  'center',
  },
  fieldWrap: { gap: Space[2] },
  label: {
    fontFamily:    Fonts.sansMedium,
    fontSize:      13,
    color:         '#8B8070',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor:  '#141B30',
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Palette.goldMid + '30',
    paddingHorizontal:Space[4],
    paddingVertical:  14,
    fontFamily:       Fonts.sansRegular,
    fontSize:         15,
    color:            '#EDE8DD',
  },
  submitBtn: {
    borderRadius: Radius.pill,
    overflow:     'hidden',
    marginTop:    Space[2],
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitGrad: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  submitText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      17,
    color:         Palette.navyDeep,
    letterSpacing: 0.3,
  },
  signInRow: {
    alignItems: 'center',
    paddingVertical: Space[2],
  },
  signInText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },

  // Success state
  successCard: {
    flex:       1,
    alignItems: 'center',
    justifyContent: 'center',
    gap:        Space[4],
    paddingHorizontal: Space[4],
  },
  successIcon: {
    fontSize: 56,
  },
  successTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   26,
    color:      '#FDFAF4',
  },
  successBody: {
    fontFamily: Fonts.serifRegular,
    fontSize:   15,
    color:      '#8B8070',
    textAlign:  'center',
    lineHeight: 24,
  },
  successEmail: {
    fontFamily: Fonts.serifBold,
    color:      Palette.goldBright,
  },
  successSub: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#4A4030',
    textAlign:  'center',
    lineHeight: 18,
  },
  returnLink: {
    fontFamily: Fonts.sansMedium,
    fontSize:   15,
    color:      Palette.goldBright,
  },
});
