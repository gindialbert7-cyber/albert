import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getWeeklyParashaDetail } from '@/constants/DailyContent';
import { Palette } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import GoldDivider from '@/components/ui/GoldDivider';

const ALIYAH_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז'];

const BOOK_COLORS: Record<string, string> = {
  Bereishis: '#4A7C59',
  Shemos:    '#6B4C8A',
  Vayikra:   '#B85C3A',
  Bamidbar:  '#3A6B8A',
  Devarim:   '#8A6B3A',
};

export default function ParashaScreen() {
  const detail = getWeeklyParashaDetail();

  if (!detail) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={s.errorText}>Parasha data unavailable.</Text>
      </SafeAreaView>
    );
  }

  const bookColor = BOOK_COLORS[detail.book] ?? Palette.navyMid;

  return (
    <LinearGradient colors={[Palette.navyDeep, Palette.navyMid]} style={s.root}>
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={16} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Palette.goldBright} />
          </Pressable>
          <View style={s.headerTitle}>
            <Text style={s.titleHeb}>{detail.heb}</Text>
            <Text style={s.titleEn}>{detail.name}</Text>
          </View>
          <View style={s.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Book badge */}
          <View style={[s.bookBadge, { backgroundColor: bookColor + '33' }]}>
            <View style={[s.bookDot, { backgroundColor: bookColor }]} />
            <Text style={[s.bookLabel, { color: bookColor === '#4A7C59' ? '#7EC89A' : '#D4A0FF' }]}>
              {detail.book}
            </Text>
          </View>

          {/* Summary */}
          <Text style={s.summary}>{detail.summary}</Text>

          <GoldDivider />

          {/* Aliyot */}
          <Text style={s.sectionHeading}>Seven Aliyot</Text>
          <View style={s.aliyotList}>
            {detail.aliyot.map((range, i) => (
              <View key={i} style={s.aliyahRow}>
                <View style={s.aliyahLetterBox}>
                  <Text style={s.aliyahLetter}>{ALIYAH_LETTERS[i]}</Text>
                </View>
                <Text style={s.aliyahRange}>{range}</Text>
              </View>
            ))}
          </View>

          <GoldDivider />

          {/* Haftarah */}
          <View style={s.haftarahRow}>
            <Text style={s.haftarahLabel}>Haftarah</Text>
            <Text style={s.haftarahText}>{detail.haftarah}</Text>
          </View>

          <GoldDivider />

          {/* CTA */}
          <Pressable
            style={s.chumashBtn}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: 'chumash-rashi' } })}
          >
            <LinearGradient
              colors={[Palette.goldBright, Palette.goldMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.chumashBtnGradient}
            >
              <Text style={s.chumashBtnText}>Read in Chumash</Text>
              <Ionicons name="book-outline" size={18} color={Palette.navyDeep} />
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  safeArea:   { flex: 1 },
  errorText:  { color: '#fff', textAlign: 'center', marginTop: 40, fontFamily: Fonts.sansRegular },

  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingTop:     Space.md,
    paddingBottom:  Space.sm,
  },
  backBtn:    { width: 40 },
  headerTitle: { flex: 1, alignItems: 'center' },
  titleHeb: {
    fontFamily: Fonts.hebrewDisplay,
    fontSize:   28,
    color:      Palette.goldBright,
    textAlign:  'center',
  },
  titleEn: {
    fontFamily: Fonts.serifBold,
    fontSize:   13,
    color:      '#FFFFFF99',
    textAlign:  'center',
    marginTop:  2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  content: { padding: Space.lg, paddingBottom: Space.xl * 2 },

  bookBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    paddingHorizontal: Space.md,
    paddingVertical:   Space.xs,
    borderRadius:   Radius.pill,
    marginBottom:   Space.md,
    borderWidth:    1,
    borderColor:    '#FFFFFF22',
  },
  bookDot: {
    width: 8, height: 8,
    borderRadius: 4,
    marginRight: Space.xs,
  },
  bookLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   12,
    letterSpacing: 0.5,
  },

  summary: {
    fontFamily: Fonts.serifRegular,
    fontSize:   16,
    lineHeight: 26,
    color:      '#FFFFFFCC',
    marginBottom: Space.lg,
  },

  sectionHeading: {
    fontFamily: Fonts.serifBold,
    fontSize:   14,
    color:      Palette.goldBright,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Space.md,
  },

  aliyotList: { marginBottom: Space.lg },
  aliyahRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Space.sm,
  },
  aliyahLetterBox: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF15',
    borderWidth:  1,
    borderColor:  Palette.goldMid + '66',
    alignItems:   'center',
    justifyContent: 'center',
    marginRight: Space.md,
  },
  aliyahLetter: {
    fontFamily: Fonts.hebrewDisplay,
    fontSize:   16,
    color:      Palette.goldBright,
  },
  aliyahRange: {
    fontFamily: Fonts.sansRegular,
    fontSize:   15,
    color:      '#FFFFFFCC',
  },

  haftarahRow: { marginBottom: Space.lg },
  haftarahLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   12,
    color:      Palette.goldBright,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Space.xs,
  },
  haftarahText: {
    fontFamily: Fonts.serifRegular,
    fontSize:   15,
    color:      '#FFFFFFCC',
  },

  chumashBtn: { marginTop: Space.md },
  chumashBtnGradient: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingVertical: 14,
    borderRadius:   Radius.lg,
  },
  chumashBtnText: {
    fontFamily: Fonts.serifBold,
    fontSize:   16,
    color:      Palette.navyDeep,
  },
});
