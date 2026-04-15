/**
 * app/admin/_layout.tsx
 *
 * Admin area layout + auth gate.
 * Checks that the current user has is_admin = true in their profile.
 * Redirects to sign-in if not authenticated, shows "Access Denied" if authenticated but not admin.
 *
 * Access: open the app on web (npx expo start --web) and navigate to /admin
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type AdminStatus = 'checking' | 'ok' | 'not-authed' | 'not-admin';

export default function AdminLayout() {
  const [status, setStatus] = useState<AdminStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setStatus('not-authed');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!cancelled) {
        setStatus(profile?.is_admin ? 'ok' : 'not-admin');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status === 'checking') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Palette.goldBright} />
        <Text style={s.checkingText}>Verifying admin access…</Text>
      </View>
    );
  }

  if (status === 'not-authed') {
    return (
      <View style={s.center}>
        <Text style={s.icon}>🔒</Text>
        <Text style={s.title}>Sign in required</Text>
        <Text style={s.body}>You must be signed in to access the admin panel.</Text>
        <Pressable style={s.btn} onPress={() => router.replace('/auth/sign-in')}>
          <Text style={s.btnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'not-admin') {
    return (
      <View style={s.center}>
        <Text style={s.icon}>⛔</Text>
        <Text style={s.title}>Access Denied</Text>
        <Text style={s.body}>Your account does not have admin privileges.</Text>
        <Text style={s.hint}>
          To grant admin access, run this in Supabase SQL Editor:{'\n\n'}
          <Text style={s.code}>UPDATE profiles SET is_admin = true{'\n'}WHERE id = '&lt;your-user-id&gt;';</Text>
        </Text>
        <Pressable style={s.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.btnText}>← Back to App</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"         />
      <Stack.Screen name="books"         />
      <Stack.Screen name="promo"         />
      <Stack.Screen name="users"         />
      <Stack.Screen name="upload"        />
      <Stack.Screen name="featured"      />
      <Stack.Screen name="audio"         />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings"      />
    </Stack>
  );
}

const s = StyleSheet.create({
  center: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#0D1220',
    padding:         40,
    gap:             16,
  },
  icon:  { fontSize: 56 },
  title: { fontFamily: Fonts.serifBold,    fontSize: 22, color: '#EDE8DD', textAlign: 'center' },
  body:  { fontFamily: Fonts.sansRegular,  fontSize: 14, color: '#8B8070', textAlign: 'center', lineHeight: 22 },
  hint:  { fontFamily: Fonts.sansRegular,  fontSize: 13, color: '#6B6050', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  code:  { fontFamily: 'monospace',        fontSize: 12, color: Palette.goldMid },
  checkingText: { fontFamily: Fonts.sansRegular, fontSize: 14, color: '#8B8070', marginTop: 12 },
  btn: {
    backgroundColor:  Palette.goldBright,
    paddingHorizontal: 28,
    paddingVertical:   12,
    borderRadius:      24,
    marginTop:         8,
  },
  btnText: { fontFamily: Fonts.sansBold, fontSize: 15, color: Palette.navyDeep },
});
