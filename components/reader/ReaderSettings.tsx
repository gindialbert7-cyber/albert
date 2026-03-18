import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

const THEMES: { key: 'parchment' | 'sepia' | 'white' | 'night'; label: string; bg: string; text: string }[] = [
  { key: 'parchment', label: 'Parchment', bg: '#F5EFE0', text: '#1A1207' },
  { key: 'sepia',     label: 'Sepia',     bg: '#EAE0CC', text: '#2A1E10' },
  { key: 'white',     label: 'White',     bg: '#FFFFFF', text: '#111111' },
  { key: 'night',     label: 'Night',     bg: '#0F1825', text: '#DDD5C5' },
];

export default function ReaderSettings({ visible, onClose }: Props) {
  const {
    fontSize, hebrewFontSize, lineHeight, theme,
    setFontSize, setHebrewSize, setLineHeight, setTheme,
  } = useLibraryStore();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.sheetInner}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Reading Settings</Text>

          {/* Theme */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Page Theme</Text>
            <View style={styles.themeRow}>
              {THEMES.map(t => (
                <Pressable
                  key={t.key}
                  style={[
                    styles.themeChip,
                    { backgroundColor: t.bg },
                    theme === t.key && styles.themeChipActive,
                  ]}
                  onPress={() => setTheme(t.key)}
                >
                  <Text style={[styles.themeChipText, { color: t.text }]}>
                    {t.label}
                  </Text>
                  {theme === t.key && (
                    <Text style={[styles.themeCheck, { color: t.text }]}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Font size */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>English Font Size  ({fontSize}pt)</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setFontSize(Math.max(13, fontSize - 1))}
              >
                <Text style={styles.stepBtnText}>A−</Text>
              </Pressable>
              <View style={styles.stepTrack}>
                {[14, 16, 18, 20, 22, 24, 26].map(s => (
                  <Pressable
                    key={s}
                    style={[styles.stepDot, fontSize >= s && styles.stepDotActive]}
                    onPress={() => setFontSize(s)}
                  />
                ))}
              </View>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setFontSize(Math.min(28, fontSize + 1))}
              >
                <Text style={styles.stepBtnText}>A+</Text>
              </Pressable>
            </View>
          </View>

          {/* Hebrew font size */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Hebrew Font Size  ({hebrewFontSize}pt)</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setHebrewSize(Math.max(16, hebrewFontSize - 1))}
              >
                <Text style={styles.stepBtnText}>א−</Text>
              </Pressable>
              <View style={styles.stepTrack}>
                {[18, 20, 22, 24, 26, 28, 30].map(s => (
                  <Pressable
                    key={s}
                    style={[styles.stepDot, hebrewFontSize >= s && styles.stepDotActive]}
                    onPress={() => setHebrewSize(s)}
                  />
                ))}
              </View>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setHebrewSize(Math.min(34, hebrewFontSize + 1))}
              >
                <Text style={styles.stepBtnText}>א+</Text>
              </Pressable>
            </View>
          </View>

          {/* Line height */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Line Spacing</Text>
            <View style={styles.lineHeightRow}>
              {[1.4, 1.6, 1.75, 2.0, 2.2].map(lh => (
                <Pressable
                  key={lh}
                  style={[styles.lhBtn, lineHeight === lh && styles.lhBtnActive]}
                  onPress={() => setLineHeight(lh)}
                >
                  <Text style={[styles.lhBtnText, lineHeight === lh && styles.lhBtnTextActive]}>
                    {lh === 1.4 ? 'Tight' : lh === 1.6 ? 'Compact' : lh === 1.75 ? 'Normal' : lh === 2.0 ? 'Relaxed' : 'Airy'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    overflow:             'hidden',
    backgroundColor:      '#141B30E0',
  },
  sheetInner: {
    padding: Space[6],
    gap:     Space[5],
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#FFFFFF30',
    alignSelf:       'center',
    marginBottom:    Space[2],
  },
  sheetTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   18,
    color:      '#EDE8DD',
    textAlign:  'center',
  },

  // Sections
  section: { gap: Space[3] },
  sectionLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      '#8B8070',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Theme
  themeRow: {
    flexDirection: 'row',
    gap:           8,
  },
  themeChip: {
    flex:             1,
    paddingVertical:  10,
    borderRadius:     Radius.md,
    alignItems:       'center',
    borderWidth:      2,
    borderColor:      'transparent',
    gap:              2,
  },
  themeChipActive: {
    borderColor: Palette.goldBright,
  },
  themeChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
  },
  themeCheck: {
    fontFamily: Fonts.sansBold,
    fontSize:   10,
  },

  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  stepBtn: {
    width:          44,
    height:         44,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor:'#FFFFFF12',
    borderWidth:    1,
    borderColor:    Palette.goldMid + '30',
  },
  stepBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   14,
    color:      '#EDE8DD',
  },
  stepTrack: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'space-between',
    gap:           4,
  },
  stepDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF20',
    borderWidth:  1,
    borderColor:  '#FFFFFF30',
  },
  stepDotActive: {
    backgroundColor: Palette.goldBright,
    borderColor:     Palette.goldBright,
  },

  // Line height
  lineHeightRow: {
    flexDirection: 'row',
    gap:           8,
  },
  lhBtn: {
    flex:             1,
    paddingVertical:  8,
    borderRadius:     Radius.md,
    alignItems:       'center',
    backgroundColor:  '#FFFFFF0A',
    borderWidth:      1,
    borderColor:      '#FFFFFF15',
  },
  lhBtnActive: {
    backgroundColor: '#243558',
    borderColor:     Palette.goldMid,
  },
  lhBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   11,
    color:      '#5A5040',
  },
  lhBtnTextActive: {
    color: Palette.goldBright,
  },

  // Done
  doneBtn: {
    backgroundColor: Palette.goldBright,
    paddingVertical: Space[4],
    borderRadius:    Radius.pill,
    alignItems:      'center',
    marginTop:       Space[2],
  },
  doneBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize:   16,
    color:      Palette.navyDeep,
  },
});
