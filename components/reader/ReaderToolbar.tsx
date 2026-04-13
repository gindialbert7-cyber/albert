import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

interface Props {
  title:           string;
  hebrewTitle?:    string;
  visible:         boolean;
  isBookmarked:    boolean;
  chapterCount?:   number;
  onSettingsPress: () => void;
  onBookmarkPress: () => void;
  onTocPress?:     () => void;
}

export default function ReaderToolbar({
  title, hebrewTitle, visible,
  isBookmarked, chapterCount = 0,
  onSettingsPress, onBookmarkPress, onTocPress,
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
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color="#EDE8DD" />
        </Pressable>

        {/* Title — tappable to open TOC when multi-chapter */}
        <Pressable
          style={styles.titleBlock}
          onPress={chapterCount > 1 ? () => { Haptics.selectionAsync(); onTocPress?.(); } : undefined}
          accessibilityLabel={chapterCount > 1 ? 'Open table of contents' : title}
        >
          {hebrewTitle ? (
            <Text style={styles.hebrewTitle} numberOfLines={1}>{hebrewTitle}</Text>
          ) : null}
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
            {chapterCount > 1 && (
              <Ionicons name="list-outline" size={12} color={Palette.goldMid + '80'} />
            )}
          </View>
        </Pressable>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); onBookmarkPress(); }}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? Palette.goldBright : '#EDE8DD'}
            />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); onSettingsPress(); }}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityLabel="Reading settings"
            accessibilityRole="button"
          >
            <Text style={styles.aaText}>Aa</Text>
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
    flexDirection:     'row',
    alignItems:        'center',
    paddingTop:        52,
    paddingBottom:     12,
    paddingHorizontal: Space[5],
    gap:               12,
  },
  iconBtn: {
    width:           38,
    height:          38,
    borderRadius:    Radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#FFFFFF10',
  },
  titleBlock: {
    flex:       1,
    alignItems: 'center',
    gap:        1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
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
  aaText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   14,
    color:      '#EDE8DD',
  },
  actions: {
    flexDirection: 'row',
    gap:           8,
  },
});
