import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type BadgeVariant = 'gold' | 'navy' | 'red' | 'green' | 'muted';

interface Props {
  label:     string;
  variant?:  BadgeVariant;
  size?:     'sm' | 'md';
}

const COLORS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  gold:  { bg: '#3A2800', text: '#E8C547', border: '#6A4800' },
  navy:  { bg: '#0F1A35', text: '#8BA8DC', border: '#1A2744' },
  red:   { bg: '#3A0A0A', text: '#E8756B', border: '#6A1A1A' },
  green: { bg: '#0A2A18', text: '#4ABA80', border: '#1A4A30' },
  muted: { bg: 'transparent', text: '#8B8070', border: '#4A4030' },
};

export default function Badge({ label, variant = 'gold', size = 'sm' }: Props) {
  const c = COLORS[variant];
  const isLg = size === 'md';
  return (
    <View style={[
      styles.badge,
      { backgroundColor: c.bg, borderColor: c.border },
      isLg && styles.badgeLg,
    ]}>
      <Text style={[styles.text, { color: c.text }, isLg && styles.textLg]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      99,
    borderWidth:       1,
    alignSelf:         'flex-start',
  },
  badgeLg: {
    paddingHorizontal: 12,
    paddingVertical:   5,
  },
  text: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textLg: {
    fontSize: 12,
  },
});
