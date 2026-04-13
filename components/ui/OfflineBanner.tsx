/**
 * OfflineBanner — shows a dismissible banner when the device has no network.
 *
 * Uses a polling approach (no extra native dependency required).
 * Checks connectivity every 5 seconds via a lightweight fetch to a tiny endpoint.
 *
 * Usage:  <OfflineBanner />  — drop anywhere above content in a screen.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fonts } from '@/constants/Typography';
import { Space } from '@/constants/Spacing';

const CHECK_INTERVAL_MS = 5_000;
const CHECK_URL         = 'https://clients3.google.com/generate_204';

async function checkOnline(): Promise<boolean> {
  try {
    const resp = await fetch(CHECK_URL, { method: 'HEAD', cache: 'no-store' });
    return resp.status === 204 || resp.ok;
  } catch {
    return false;
  }
}

export default function OfflineBanner() {
  const [isOffline,   setIsOffline]   = useState(false);
  const [dismissed,   setDismissed]   = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const show = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [slideAnim]);

  const hide = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -60,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      const online = await checkOnline();
      if (!mounted) return;
      if (!online && !isOffline) {
        setIsOffline(true);
        setDismissed(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (online && isOffline) {
        setIsOffline(false);
        setDismissed(false);
      }
    }

    // Initial check
    poll();
    intervalRef.current = setInterval(poll, CHECK_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOffline]);

  useEffect(() => {
    if (isOffline && !dismissed) {
      show();
    } else {
      hide();
    }
  }, [isOffline, dismissed, show, hide]);

  if (!isOffline || dismissed) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.inner}>
        <Ionicons name="cloud-offline-outline" size={16} color="#FDFAF4" />
        <Text style={styles.text}>No internet connection</Text>
        <Text style={styles.sub}>Reading from cache</Text>
      </View>
      <Pressable
        onPress={() => setDismissed(true)}
        style={styles.closeBtn}
        hitSlop={8}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={14} color="rgba(255,255,255,0.6)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A1A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#D4884A40',
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: Space[5],
    paddingVertical:   10,
    gap:             Space[3],
    ...(Platform.OS === 'ios' ? {} : { elevation: 4 }),
  },
  inner: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  text: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   13,
    color:      '#FDFAF4',
  },
  sub: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      'rgba(255,255,255,0.5)',
  },
  closeBtn: {
    width:           24,
    height:          24,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
