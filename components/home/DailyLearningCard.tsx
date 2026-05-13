import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import {
  getDailyMishna, getDailyQuote, getWeeklyParasha,
  getDafYomi, getShabbatInfo,
  ENGLISH_DAYS, HEBREW_DAYS,
} from '@/constants/DailyContent';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

type Mode = 'mishna' | 'daf' | 'quote';

export default function DailyLearningCard() {
  const [mode, setMode] = useState<Mode>('mishna');
  const mishna  = getDailyMishna();
  const quote   = getDailyQuote();
  const parasha = getWeeklyParasha();
  const daf     = getDafYomi();
  const shabbat = getShabbatInfo();

  const now        = new Date();
  const dayIdx     = now.getDay();
  const englishDay = ENGLISH_DAYS[dayIdx];
  const hebrewDay  = HEBREW_DAYS[dayIdx];

  const showShabbatChip = shabbat.status !== 'weekday' || shabbat.daysUntil <= 1;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#0F1E38', '#0A1428']}
        style={styles.card}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dayHeb}>{hebrewDay}</Text>
            <Text style={styles.dayEn}>{englishDay}</Text>
          </View>
          <View style={styles.headerRight}>
            {showShabbatChip && (
              <View style={[
                styles.shabbatChip,
                shabbat.status === 'shabbat' && styles.shabbatChipActive,
              ]}>
                <Text style={[
                  styles.shabbatHeb,
                  shabbat.status === 'shabbat' && { color: Palette.goldBright },
                ]}>
                  {shabbat.hebrewText}
                </Text>
                <Text style={[
                  styles.shabbatEn,
                  shabbat.status === 'shabbat' && { color: Palette.goldMid },
                ]}>
                  {shabbat.displayText}
                </Text>
              </View>
            )}
            {!showShabbatChip && (
              <View style={styles.parashaTag}>
                <Text style={styles.parashaHeb}>{parasha.heb}</Text>
                <Text style={styles.parashaEn}>Parshas {parasha.name}</Text>
              </View>
            )}
          </View>
        </View>

        <GoldDivider marginVertical={12} opacity={0.25} />

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {([
            { key: 'mishna', label: 'Mishna' },
            { key: 'daf',    label: 'Daf Yomi' },
            { key: 'quote',  label: 'Quote' },
          ] as const).map(m => (
            <Pressable
              key={m.key}
              style={[styles.modeBtn, mode === m.key && styles.modeBtnActive]}
              onPress={() => setMode(m.key)}
            >
              <Text style={[styles.modeBtnText, mode === m.key && styles.modeBtnTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {mode === 'mishna' && <MishnaContent mishna={mishna} />}
        {mode === 'daf'    && <DafContent daf={daf} />}
        {mode === 'quote'  && <QuoteContent quote={quote} />}

        {/* Read button */}
        {mode === 'mishna' && (
          <Pressable
            style={styles.readBtn}
            onPress={() => router.push({ pathname: '/book-detail/[id]', params: { id: 'pirkei-avos' } })}
          >
            <Text style={styles.readBtnText}>Read Pirkei Avos →</Text>
          </Pressable>
        )}
        {mode === 'daf' && (
          <Pressable
            style={styles.readBtn}
            onPress={() => router.push({ pathname: '/book-detail/[id]', params: { id: 'talmud-bavli' } })}
          >
            <Text style={styles.readBtnText}>Open {daf.tractate} →</Text>
          </Pressable>
        )}

        {/* Parasha link — always visible */}
        <Pressable
          style={[styles.readBtn, styles.parashaBtn]}
          onPress={() => router.push('/parasha')}
        >
          <Text style={styles.readBtnText}>Read This Week's Parasha →</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function MishnaContent({ mishna }: { mishna: ReturnType<typeof getDailyMishna> }) {
  return (
    <View style={styles.content}>
      <Text style={styles.sage}>
        {mishna.sagHeb}  ·  {mishna.sage}
      </Text>
      <Text style={styles.ref}>{mishna.ref}</Text>
      <Text style={styles.hebrew}>{mishna.hebrew}</Text>
      <Text style={styles.english}>{mishna.english}</Text>
      <View style={styles.lessonBox}>
        <Text style={styles.lessonLabel}>✦  Lesson</Text>
        <Text style={styles.lesson}>{mishna.lesson}</Text>
      </View>
    </View>
  );
}

function DafContent({ daf }: { daf: ReturnType<typeof getDafYomi> }) {
  return (
    <View style={styles.content}>
      {/* Seder label */}
      <Text style={styles.ref}>SEDER {daf.sedarName.toUpperCase()}  ·  DAY {daf.cycleDay} OF CYCLE</Text>

      {/* Tractate name */}
      <View style={styles.dafHeader}>
        <Text style={styles.dafHebrew}>{daf.tractateHeb}</Text>
        <View style={styles.dafNumBadge}>
          <Text style={styles.dafNumLabel}>דַּף</Text>
          <Text style={styles.dafNum}>{daf.dafDisplay}</Text>
        </View>
      </View>

      <Text style={styles.dafTractate}>{daf.tractate}</Text>

      <View style={styles.lessonBox}>
        <Text style={styles.lessonLabel}>✦  Today's Daf</Text>
        <Text style={styles.lesson}>
          {daf.tractate} {daf.dafDisplay} — learn this daf today to stay on track with the worldwide Daf Yomi cycle.
          It takes approximately 45–60 minutes to learn a full daf.
        </Text>
      </View>
    </View>
  );
}

function QuoteContent({ quote }: { quote: ReturnType<typeof getDailyQuote> }) {
  return (
    <View style={styles.content}>
      {quote.hebrew ? (
        <Text style={styles.hebrew}>{quote.hebrew}</Text>
      ) : null}
      <Text style={styles.quoteText}>"{quote.english}"</Text>
      <Text style={styles.quoteSource}>— {quote.source}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Space[5],
    marginBottom:     Space[6],
    borderRadius:     Radius.xl,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      Palette.goldMid + '25',
  },
  card: {
    padding: Space[5],
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dayHeb: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   18,
    color:      Palette.goldBright,
  },
  dayEn: {
    fontFamily: Fonts.serifItalic,
    fontSize:   12,
    color:      '#8B8070',
  },

  // Parasha tag
  parashaTag: {
    alignItems: 'flex-end',
  },
  parashaHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  parashaEn: {
    fontFamily:   Fonts.sansRegular,
    fontSize:     10,
    color:        '#5A5040',
    letterSpacing: 0.3,
  },

  // Shabbat chip
  shabbatChip: {
    alignItems:        'flex-end',
    paddingHorizontal: Space[3],
    paddingVertical:   Space[1],
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '30',
  },
  shabbatChipActive: {
    borderColor:     Palette.goldBright + '60',
    backgroundColor: Palette.goldMid + '15',
  },
  shabbatHeb: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  shabbatEn: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    color:      '#5A5040',
  },

  // Mode toggle
  modeRow: {
    flexDirection: 'row',
    gap:           6,
    marginBottom:  Space[4],
  },
  modeBtn: {
    flex:              1,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       '#1E2A40',
    alignItems:        'center',
  },
  modeBtnActive: {
    backgroundColor: Palette.navyMid,
    borderColor:     Palette.goldMid + '50',
  },
  modeBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   11,
    color:      '#3A4A60',
  },
  modeBtnTextActive: {
    color: '#EDE8DD',
  },

  // Shared content
  content: {
    gap:          Space[3],
    marginBottom: Space[4],
  },
  sage: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   13,
    color:      Palette.goldBright,
  },
  ref: {
    fontFamily:   Fonts.sansMedium,
    fontSize:     10,
    color:        '#5A5040',
    letterSpacing: 0.5,
  },
  hebrew: {
    fontFamily: Fonts.hebrewRegular,
    fontSize:   18,
    color:      '#DDD5C5',
    textAlign:  'right',
    lineHeight: 30,
  },
  english: {
    fontFamily: Fonts.serifRegular,
    fontSize:   14,
    color:      '#C8BFA8',
    lineHeight: 22,
    fontStyle:  'italic',
  },
  lessonBox: {
    backgroundColor: '#0A1428',
    borderRadius:    Radius.md,
    padding:         Space[4],
    borderLeftWidth: 2,
    borderLeftColor: Palette.goldMid + '60',
    gap:             4,
  },
  lessonLabel: {
    fontFamily:   Fonts.sansSemiBold,
    fontSize:     11,
    color:        Palette.goldMid,
    letterSpacing: 0.5,
  },
  lesson: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#8B8070',
    lineHeight: 20,
  },

  // Daf Yomi specific
  dafHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  dafHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   28,
    color:      '#DDD5C5',
    lineHeight: 36,
  },
  dafNumBadge: {
    alignItems:      'center',
    backgroundColor: Palette.navyMid,
    borderRadius:    Radius.md,
    paddingHorizontal: Space[4],
    paddingVertical:   Space[2],
    borderWidth:     1,
    borderColor:     Palette.goldMid + '40',
    gap:             2,
  },
  dafNumLabel: {
    fontFamily:   Fonts.hebrewMedium,
    fontSize:     10,
    color:        Palette.goldMid,
    letterSpacing: 0.3,
  },
  dafNum: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   22,
    color:      Palette.goldBright,
    lineHeight: 28,
  },
  dafTractate: {
    fontFamily: Fonts.serifSemiBold,
    fontSize:   18,
    color:      '#C8BFA8',
  },

  // Quote
  quoteText: {
    fontFamily: Fonts.serifBold,
    fontSize:   17,
    color:      '#EDE8DD',
    lineHeight: 26,
    fontStyle:  'italic',
  },
  quoteSource: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    color:      '#5A5040',
  },

  // Read button
  readBtn: {
    alignSelf:         'flex-start',
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Palette.goldMid + '40',
  },
  parashaBtn: {
    marginTop: 8,
  },
  readBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      Palette.goldBright,
  },
});
