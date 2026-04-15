import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { initNotifications } from '@/services/notificationService';
import { configurePurchases, getCustomerInfo, isSubscriptionActive, inferTier } from '@/services/purchaseService';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { getCurrentSession } from '@/services/authService';
import { syncService } from '@/services/syncService';
import { initAnalytics, identify } from '@/utils/analytics';
import { initSentry, setUser as setSentryUser } from '@/utils/sentry';

// Init observability as early as possible — before any render
initSentry();
initAnalytics();
import {
  FrankRuhlLibre_400Regular,
  FrankRuhlLibre_500Medium,
  FrankRuhlLibre_700Bold,
  FrankRuhlLibre_900Black,
} from '@expo-google-fonts/frank-ruhl-libre';

import {
  CrimsonPro_400Regular,
  CrimsonPro_400Regular_Italic,
  CrimsonPro_600SemiBold,
  CrimsonPro_700Bold,
} from '@expo-google-fonts/crimson-pro';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    FrankRuhlLibre_400Regular,
    FrankRuhlLibre_500Medium,
    FrankRuhlLibre_700Bold,
    FrankRuhlLibre_900Black,
    CrimsonPro_400Regular,
    CrimsonPro_400Regular_Italic,
    CrimsonPro_600SemiBold,
    CrimsonPro_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    initNotifications();
  }, []);

  // Configure RevenueCat once fonts load (auth-resolution hook).
  // In stub mode (SDK not installed) this no-ops safely.
  // Supabase auth state listener — keeps useAuthStore in sync with Supabase session
  useEffect(() => {
    // Restore persisted session on launch
    getCurrentSession()
      .then(result => useAuthStore.getState().setSession(result))
      .catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const result = await getCurrentSession();
          useAuthStore.getState().setSession(result);
          identify(session.user.id);
          setSentryUser(session.user.id);
          // Pull remote user data on first sign-in / token refresh
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            syncService.pullAll(session.user.id).catch(() => {});
          }
        } catch {}
      } else {
        useAuthStore.getState().setSession(null);
        setSentryUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Configure RevenueCat once fonts load (auth-resolution hook).
  // In stub mode (SDK not installed) this no-ops safely.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      try {
        await configurePurchases();
        const info = await getCustomerInfo();
        if (cancelled) return;
        if (isSubscriptionActive(info)) {
          const tier = inferTier(info);
          if (tier) useSubscriptionStore.getState().syncFromPurchase(tier, info.latestExpirationDate);
        }
      } catch (e) {
        console.warn('[Albert] purchases init failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
          <Stack.Screen name="book/[id]"         options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="book-detail/[id]"  options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="notes"             options={{ headerShown: false }} />
          <Stack.Screen name="onboarding"        options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="auth/sign-in"      options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="auth/sign-up"      options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="collection/[id]"   options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen
            name="subscribe"
            options={{
              headerShown:  false,
              presentation: 'modal',
              animation:    'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="promo"
            options={{
              headerShown:  false,
              presentation: 'modal',
              animation:    'slide_from_bottom',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
