import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { initNotifications } from '@/services/notificationService';
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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
