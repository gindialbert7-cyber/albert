import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Palette } from '@/constants/Colors';

interface Props {
  progress:   number;   // 0–1
  height?:    number;
  trackColor?: string;
  fillColor?:  string;
  borderRadius?: number;
}

export default function ProgressBar({
  progress,
  height      = 3,
  trackColor  = '#1E2A40',
  fillColor   = Palette.goldMid,
  borderRadius = 2,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius }]}>
      <View
        style={[
          styles.fill,
          {
            width:           `${clamped * 100}%`,
            backgroundColor: fillColor,
            borderRadius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width:    '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
