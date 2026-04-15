/**
 * AudioSection — gold-accent inline audio player for a TextSection.
 *
 * Renders a compact pill with:
 *   ▶ play / ⏸ pause button (haptics)
 *   speaker name + clip title
 *   thin gold progress bar
 *   duration label (e.g. "1:23 / 3:05")
 *
 * Expects an AudioClip (from audioManifestService). Silently renders nothing
 * if no clip is provided — safe to drop into any section renderer.
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { AudioClip } from '@/services/audioManifestService';

interface Props {
  clip:       AudioClip | null;
  goldColor?: string;
  textColor?: string;
  mutedColor?:string;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioSection({
  clip, goldColor = Palette.goldMid, textColor = '#EDE8DD', mutedColor = '#8B8070',
}: Props) {
  // All hooks must run before any early return
  const source = clip?.url ?? null;
  const { state, progress, positionMs, durationMs, play, pause } = useAudioPlayer(source);

  const durSeconds = clip?.duration ?? 0;
  const totalMs    = durationMs > 0 ? durationMs : durSeconds * 1000;
  const timeLabel  = useMemo(() => {
    if (state === 'idle' && totalMs > 0) return formatTime(totalMs);
    if (totalMs > 0) return `${formatTime(positionMs)} / ${formatTime(totalMs)}`;
    return '—';
  }, [state, positionMs, totalMs]);

  if (!clip) return null;

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';

  const handlePress = async () => {
    Haptics.selectionAsync();
    if (isPlaying) await pause();
    else           await play();
  };

  return (
    <View style={[styles.wrap, { borderColor: goldColor + '40' }]}>
      <Pressable
        onPress={handlePress}
        style={[styles.playBtn, { backgroundColor: goldColor + '22', borderColor: goldColor + '60' }]}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause audio explainer' : 'Play audio explainer'}
        hitSlop={6}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={goldColor} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={14}
            color={goldColor}
            style={isPlaying ? undefined : { marginLeft: 2 }}
          />
        )}
      </Pressable>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Ionicons name="volume-medium-outline" size={12} color={goldColor} />
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {clip.title ?? 'Audio explainer'}
          </Text>
        </View>
        {clip.speaker && (
          <Text style={[styles.speaker, { color: mutedColor }]} numberOfLines={1}>
            {clip.speaker}
          </Text>
        )}
        {/* Progress bar */}
        <View style={[styles.trackBg, { backgroundColor: goldColor + '20' }]}>
          <View
            style={[
              styles.trackFill,
              {
                backgroundColor: goldColor,
                width:           `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.time, { color: mutedColor }]}>{timeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingVertical:   Space[2],
    paddingHorizontal: Space[3],
    borderRadius:      Radius.md,
    borderWidth:       1,
    marginVertical:    Space[2],
  },
  playBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
  info: {
    flex: 1,
    gap:  3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize:   13,
    flex:       1,
  },
  speaker: {
    fontFamily: Fonts.serifItalic,
    fontSize:   11,
  },
  trackBg: {
    height:       2,
    borderRadius: 1,
    marginTop:    4,
    overflow:     'hidden',
  },
  trackFill: {
    height:       2,
    borderRadius: 1,
  },
  time: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    letterSpacing: 0.3,
  },
});
