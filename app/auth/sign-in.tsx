import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useAuthStore } from '@/store/useAuthStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';
import { track, Events } from '@/utils/analytics';

const { width: SCREEN_W } = Dimensions.get('window');

export default function SignInScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const { signIn, status, errorMessage, clearError } = useAuthStore();
  const passRef = useRef<TextInput>(null);
  const isLoading = status === 'loading';

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) return;
    track(Events.SIGN_IN_TAP);
    const ok = await signIn(email.trim().toLowerCase(), password);
    if (ok) {
      track(Events.SIGN_IN_SUCCESS);
      router.replace('/(tabs)');
    } else {
      track(Events.SIGN_IN_FAIL);
    }
  }

  function handleForgotPassword() {
    router.push('/auth/forgot-password' as any);
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />

      {/* Close */}
      <SafeAreaView edges={['top']} style={s.topBar}>
        <Pressable
          style={s.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <Text style={s.backText}>← Back</Text>
        </Pressable>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.heroHebrew}>שלום</Text>
            <Text style={s.heroTitle}>Welcome Back</Text>
            <Text style={s.heroSub}>Sign in to sync your library across all your devices.</Text>
          </View>

          <GoldDivider marginVertical={0} opacity={0.2} />

          {/* Form */}
          <View style={s.form}>
            {errorMessage && (
              <Pressable style={s.errorBanner} onPress={clearError}>
                <Text style={s.errorText}>{errorMessage}</Text>
              </Pressable>
            )}

            <View style={s.fieldWrap}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#4A4030"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                editable={!isLoading}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Password</Text>
              <View style={s.passwordRow}>
                <TextInput
                  ref={passRef}
                  style={[s.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#4A4030"
                  secureTextEntry={!showPwd}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  editable={!isLoading}
                />
                <Pressable
                  style={s.eyeBtn}
                  onPress={() => setShowPwd(p => !p)}
                >
                  <Text style={s.eyeText}>{showPwd ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={s.forgotRow} onPress={handleForgotPassword}>
              <Text style={s.forgotText}>Forgot your password?</Text>
            </Pressable>

            {/* Sign in CTA */}
            <Pressable
              style={[s.signInBtn, (isLoading || !email || !password) && s.signInBtnDisabled]}
              onPress={handleSignIn}
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              <LinearGradient
                colors={[Palette.goldBright, Palette.goldMid]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.signInGrad}
              >
                {isLoading
                  ? <ActivityIndicator color={Palette.navyDeep} />
                  : <Text style={s.signInText}>Sign In</Text>
                }
              </LinearGradient>
            </Pressable>

            <GoldDivider marginVertical={Space[4]} opacity={0.15} />

            {/* Sign up link */}
            <View style={s.signUpRow}>
              <Text style={s.signUpLabel}>Don't have an account?</Text>
              <Pressable onPress={() => router.replace('/auth/sign-up' as any)}>
                <Text style={s.signUpLink}> Create one →</Text>
              </Pressable>
            </View>

            {/* Guest note */}
            <Text style={s.guestNote}>
              You can use Albert without signing in. Your progress is saved locally on this device.
            </Text>
          </View>
        </ScrollView>
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

  scroll: {
    paddingHorizontal: Space[6],
    paddingBottom:     Space[12],
    gap:               0,
  },

  hero: {
    paddingVertical:   Space[8],
    alignItems:        'center',
    gap:               Space[3],
  },
  heroHebrew: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   40,
    color:      Palette.goldBright,
  },
  heroTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#FDFAF4',
  },
  heroSub: {
    fontFamily: Fonts.serifItalic,
    fontSize:   14,
    color:      '#8B8070',
    textAlign:  'center',
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

  passwordRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  eyeBtn: {
    backgroundColor:       '#141B30',
    borderWidth:           1,
    borderColor:           Palette.goldMid + '30',
    borderTopRightRadius:  Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal:     14,
    paddingVertical:       14,
  },
  eyeText: { fontSize: 16 },

  forgotRow: { alignItems: 'flex-end', marginTop: -Space[2] },
  forgotText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      Palette.goldMid,
  },

  signInBtn: {
    borderRadius: Radius.pill,
    overflow:     'hidden',
    marginTop:    Space[2],
  },
  signInBtnDisabled: { opacity: 0.5 },
  signInGrad: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  signInText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      17,
    color:         Palette.navyDeep,
    letterSpacing: 0.3,
  },

  signUpRow: {
    flexDirection:  'row',
    justifyContent: 'center',
  },
  signUpLabel: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#8B8070',
  },
  signUpLink: {
    fontFamily: Fonts.serifBold,
    fontSize:   14,
    color:      Palette.goldBright,
  },

  guestNote: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#3A3028',
    textAlign:  'center',
    lineHeight: 17,
  },
});
