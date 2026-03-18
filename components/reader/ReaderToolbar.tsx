import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

interface Props {
  title:       string;
  hebrewTitle?: string;
  visible:     boolean;
  onSettingsPress: () => void;
  onBookmarkPress: () => void;
  isBookmarked:    boolean;
}

export default function ReaderToolbar({
  title, hebrewTitle, visible, onSettingsPress, onBookmarkPress, isBookmarked,
}: Props) {
  const animStyle = useAnimatedStyle(() => ({
    opacity:   withTiming(visible ? 1 : 0, { duration: 200 }),
    transform: [{ translateY: withTiming(visible ? 0 : -60, { duration: 200 }) }],
  }));

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Text style={styles.iconText}>←</Text>
        </Pressable>

        {/* Title */}
        <View style={styles.titleBlock}>
          {hebrewTitle ? (
            <Text style={styles.hebrewTitle} numberOfLines={1}>{hebrewTitle}</Text>
          ) : null}
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable onPress={onBookmarkPress} style={styles.iconBtn} hitSlop={8}>
            <Text style={[styles.iconText, isBookmarked && { color: Palette.goldBright }]}>
              {isBookmarked ? '🔖' : '🏷'}
            </Text>
          </Pressable>
          <Pressable onPress={onSettingsPress} style={styles.iconBtn} hitSlop={8}>
            <Text style={styles.iconText}>Aa</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    zIndex:   200,
    overflow: 'hidden',
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     52,
    paddingBottom:  12,
    paddingHorizontal: Space[5],
    gap:            12,
  },
  iconBtn: {
    width:         38,
    height:        38,
    borderRadius:  Radius.md,
    alignItems:    'center',
    justifyContent:'center',
    backgroundColor: '#FFFFFF10',
  },
  iconText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   16,
    color:      '#EDE8DD',
  },
  titleBlock: {
    flex:       1,
    alignItems: 'center',
    gap:        1,
  },
  hebrewTitle: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   12,
    color:      Palette.goldMid,
  },
  titleText: {
    fontFamily: Fonts.serifSemiBold,
    fontSize:   14,
    color:      '#EDE8DD',
  },
  actions: {
    flexDirection: 'row',
    gap:           8,
  },
});
