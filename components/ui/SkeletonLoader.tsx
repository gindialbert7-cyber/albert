/**
 * SkeletonLoader — animated shimmer placeholder for loading states.
 *
 * Usage:
 *   <SkeletonLoader width={120} height={180} borderRadius={8} />
 *   <BookCardSkeleton />
 *   <BookShelfSkeleton count={4} />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Radius } from '@/constants/Spacing';

interface SkeletonProps {
  width:        number | string;
  height:       number;
  borderRadius?: number;
  style?:       ViewStyle;
}

export default function SkeletonLoader({ width, height, borderRadius = Radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7,  duration: 850, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 850, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        sk.base,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// ── Compound skeletons ────────────────────────────────────────────────────

interface BookCardSkeletonProps {
  width?: number;
}

export function BookCardSkeleton({ width = 130 }: BookCardSkeletonProps) {
  const coverH = Math.round(width * 1.5);
  return (
    <View style={{ width, gap: 6 }}>
      <SkeletonLoader width={width} height={coverH} borderRadius={Radius.md} />
      <SkeletonLoader width={width * 0.8} height={12} />
      <SkeletonLoader width={width * 0.6} height={10} />
    </View>
  );
}

interface BookShelfSkeletonProps {
  count?:     number;
  cardWidth?: number;
}

export function BookShelfSkeleton({ count = 4, cardWidth = 130 }: BookShelfSkeletonProps) {
  return (
    <View style={sk.shelf}>
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} width={cardWidth} />
      ))}
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={sk.page}>
      {/* Hero */}
      <SkeletonLoader width="100%" height={220} borderRadius={0} />
      {/* Shelf 1 */}
      <View style={sk.section}>
        <SkeletonLoader width={160} height={20} />
        <BookShelfSkeleton count={4} />
      </View>
      {/* Shelf 2 */}
      <View style={sk.section}>
        <SkeletonLoader width={140} height={20} />
        <BookShelfSkeleton count={3} cardWidth={150} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  base: {
    backgroundColor: '#1E2A40',
  },
  shelf: {
    flexDirection: 'row',
    gap:           12,
    paddingLeft:   20,
    marginTop:     8,
  },
  section: {
    gap:        8,
    marginTop:  24,
    paddingLeft: 20,
  },
  page: {
    flex: 1,
    gap:  0,
  },
});
