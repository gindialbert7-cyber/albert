import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
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

export default function SignUpScreen() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const { signUp, status, errorMessage, clearError } = useAuthStore();
  const emailRef = useRef<TextInput>(null);
  const passRef  = useRef<TextInput>(null);
  const isLoading = status === 'loading';

  const isValid = name.trim().length >= 2
    && email.trim().includes('@')
    && password.length >= 8;

  async function handleSignUp() {
    if (!isValid) return;
    track(Events.SIGN_UP_TAP);
    const ok = await signUp(email.trim().toLowerCase(), password, name.trim());
    if (ok) {
      track(Events.SIGN_UP_SUCCESS);
      router.replace('/(tabs)');
    } else {
      track(Events.SIGN_UP_FAIL);
    }
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />

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
            <Text style={s.heroHebrew}>ברוכים הבאים</Text>
            <Text style={s.heroTitle}>Create Your Account</Text>
            <Text style={s.heroSub}>
              Join 12,400+ learners and access your library on any device.
            </Text>
          </View>

          <GoldDivider marginVertical={0} opacity={0.2} />

          <View style={s.form}>
            {errorMessage && (
              <Pressable style={s.errorBanner} onPress={clearError}>
                <Text style={s.errorText}>{errorMessage}</Text>
              </Pressable>
            )}

            <View style={s.fieldWrap}>
              <Text style={s.label}>Your Name</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Avraham"
                placeholderTextColor="#4A4030"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!isLoading}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Email</Text>
              <TextInput
                ref={emailRef}
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
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#4A4030"
                  secureTextEntry={!showPwd}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  editable={!isLoading}
                />
                <Pressable style={s.eyeBtn} onPress={() => setShowPwd(p => !p)}>
                  <Text style={s.eyeText}>{showPwd ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>
              {password.length > 0 && password.length < 8 && (
                <Text style={s.hint}>Password must be at least 8 characters</Text>
              )}
            </View>

            {/* Sign up CTA */}
            <Pressable
              style={[s.signUpBtn, (!isValid || isLoading) && s.btnDisabled]}
              onPress={handleSignUp}
              disabled={!isValid || isLoading}
            >
              <LinearGradient
                colors={[Palette.goldBright, Palette.goldMid]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.signUpGrad}
              >
                {isLoading
                  ? <ActivityIndicator color={Palette.navyDeep} />
                  : <Text style={s.signUpText}>Create Account</Text>
                }
              </LinearGradient>
            </Pressable>

            <Text style={s.legal}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>

            <GoldDivider marginVertical={Space[2]} opacity={0.15} />

            <View style={s.signInRow}>
              <Text style={s.signInLabel}>Already have an account?</Text>
              <Pressable onPress={() => router.replace('/auth/sign-in' as any)}>
                <Text style={s.signInLink}> Sign in →</Text>
              </Pressable>
            </View>
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
  },
  hero: {
    paddingVertical: Space[8],
    alignItems:      'center',
    gap:             Space[3],
  },
  heroHebrew: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   36,
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
  hint: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#E08050',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  eyeBtn: {
    backgroundColor:         '#141B30',
    borderWidth:             1,
    borderColor:             Palette.goldMid + '30',
    borderTopRightRadius:    Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal:       14,
    paddingVertical:         14,
  },
  eyeText: { fontSize: 16 },
  signUpBtn: {
    borderRadius: Radius.pill,
    overflow:     'hidden',
    marginTop:    Space[2],
  },
  btnDisabled: { opacity: 0.5 },
  signUpGrad: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  signUpText: {
    fontFamily:    Fonts.sansBold,
    fontSize:      17,
    color:         Palette.navyDeep,
    letterSpacing: 0.3,
  },
  legal: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    color:      '#3A3028',
    textAlign:  'center',
    lineHeight: 17,
  },
  signInRow: {
    flexDirection:  'row',
    justifyContent: 'center',
  },
  signInLabel: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#8B8070',
  },
  signInLink: {
    fontFamily: Fonts.serifBold,
    fontSize:   14,
    color:      Palette.goldBright,
  },
});
