import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/services/authService';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

type ScreenState = 'idle' | 'loading' | 'success' | 'error' | 'invalid';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    access_token?:  string;
    refresh_token?: string;
    type?:          string;
  }>();

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [state,       setState]       = useState<ScreenState>('idle');
  const [errMsg,      setErrMsg]      = useState('');
  const [sessionReady,setSessionReady]= useState(false);

  // Supabase sends tokens in the URL hash; expo-router exposes them as query params.
  // We need to set the session before calling updateUser.
  useEffect(() => {
    const access  = params.access_token;
    const refresh = params.refresh_token;
    if (!access || !refresh) {
      setState('invalid');
      return;
    }
    supabase.auth.setSession({ access_token: access, refresh_token: refresh })
      .then(({ error }) => {
        if (error) setState('invalid');
        else        setSessionReady(true);
      })
      .catch(() => setState('invalid'));
  }, [params.access_token]);

  const isValid =
    password.length >= 8 &&
    password === confirm &&
    sessionReady;

  async function handleReset() {
    if (!isValid) return;
    setState('loading');
    try {
      await updatePassword(password);
      setState('success');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Something went wrong. Please try again.');
      setState('error');
    }
  }

  if (state === 'invalid') {
    return (
      <View style={s.root}>
        <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.center}>
          <Text style={s.errorIcon}>✕</Text>
          <Text style={s.titleLg}>Link Expired</Text>
          <Text style={s.body}>
            This password reset link is no longer valid.{'\n'}
            Please request a new one.
          </Text>
          <Pressable style={s.btn} onPress={() => router.replace('/auth/forgot-password' as any)}>
            <Text style={s.btnText}>Request New Link</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <View style={s.root}>
        <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.center}>
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.hebrewTitle}>סִיַּמְתִּי</Text>
          <Text style={s.titleLg}>Password Updated</Text>
          <Text style={s.body}>
            Your password has been changed successfully.{'\n'}
            You can now sign in with your new password.
          </Text>
          <Pressable style={s.btn} onPress={() => router.replace('/auth/sign-in' as any)}>
            <Text style={s.btnText}>Sign In</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={[Palette.navyDeep, '#0A0E1A']} style={StyleSheet.absoluteFill} />

      <SafeAreaView edges={['top']} style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={22} color={Palette.goldMid} />
        </Pressable>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.kav}
      >
        <View style={s.content}>
          <Text style={s.hebrewTitle}>שִׁנּוּי סִיסְמָא</Text>
          <Text style={s.title}>Set New Password</Text>
          <Text style={s.subtitle}>Choose a strong password for your Albert account.</Text>

          <GoldDivider marginVertical={24} opacity={0.2} />

          {/* New password */}
          <Text style={s.label}>New Password</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="At least 8 characters"
              placeholderTextColor="#3A4A60"
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Pressable onPress={() => setShowPwd(v => !v)} style={s.eyeBtn} hitSlop={8}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#5A6880" />
            </Pressable>
          </View>

          {/* Confirm */}
          <Text style={[s.label, { marginTop: Space[4] }]}>Confirm Password</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Repeat new password"
              placeholderTextColor="#3A4A60"
              secureTextEntry={!showPwd}
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />
          </View>

          {/* Validation hint */}
          {password.length > 0 && password.length < 8 && (
            <Text style={s.hint}>Password must be at least 8 characters</Text>
          )}
          {confirm.length > 0 && password !== confirm && (
            <Text style={s.hint}>Passwords do not match</Text>
          )}

          {/* Error */}
          {state === 'error' && (
            <Text style={s.errorText}>{errMsg}</Text>
          )}

          {/* Loading wait — the 'invalid' branch already returned early above */}
          {!sessionReady && (
            <Text style={s.waiting}>Verifying reset link…</Text>
          )}

          {/* Submit */}
          <Pressable
            style={[s.btn, (!isValid || state === 'loading') && s.btnDisabled]}
            onPress={handleReset}
            disabled={!isValid || state === 'loading'}
          >
            {state === 'loading' ? (
              <ActivityIndicator color={Palette.navyDeep} />
            ) : (
              <Text style={s.btnText}>Update Password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Space[5],
    paddingTop:     Space[2],
  },
  closeBtn: {
    width:  40,
    height: 40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  kav:     { flex: 1 },
  content: {
    paddingHorizontal: Space[6],
    paddingTop:        Space[6],
    paddingBottom:     Space[10],
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Space[8],
    gap:            Space[4],
  },

  hebrewTitle: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   16,
    color:      Palette.goldMid,
    textAlign:  'center',
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    color:      '#EDE8DD',
    lineHeight: 36,
  },
  titleLg: {
    fontFamily: Fonts.serifBold,
    fontSize:   26,
    color:      '#EDE8DD',
    textAlign:  'center',
  },
  subtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
    color:      '#8B8070',
    lineHeight: 22,
    marginTop:  Space[2],
  },

  label: {
    fontFamily:   Fonts.sansMedium,
    fontSize:     12,
    color:        '#8B8070',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom:  Space[2],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Palette.goldMid + '25',
  },
  input: {
    flex:            1,
    paddingHorizontal: Space[4],
    paddingVertical:   Space[4],
    fontFamily:      Fonts.serifRegular,
    fontSize:        16,
    color:           '#EDE8DD',
  },
  eyeBtn: {
    paddingHorizontal: Space[4],
    paddingVertical:   Space[4],
  },

  hint: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#C9A84C',
    marginTop:  Space[2],
  },
  errorText: {
    fontFamily: Fonts.sansRegular,
    fontSize:   13,
    color:      Palette.error,
    marginTop:  Space[3],
    lineHeight: 18,
  },
  waiting: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#5A6880',
    marginTop:  Space[3],
    textAlign:  'center',
  },

  body: {
    fontFamily: Fonts.serifRegular,
    fontSize:   15,
    color:      '#8B8070',
    lineHeight: 22,
    textAlign:  'center',
  },
  errorIcon: {
    fontSize:  36,
    color:     Palette.error,
  },
  successIcon: {
    fontSize:  40,
    color:     Palette.success,
  },

  btn: {
    marginTop:       Space[6],
    backgroundColor: Palette.goldBright,
    paddingVertical: Space[4],
    borderRadius:    Radius.pill,
    alignItems:      'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      Palette.navyDeep,
    letterSpacing: 0.3,
  },
});
