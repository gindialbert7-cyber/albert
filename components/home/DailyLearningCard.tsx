import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { getDailyMishna, getDailyQuote, getWeeklyParasha, ENGLISH_DAYS, HEBREW_DAYS } from '@/constants/DailyContent';
import { Fonts } from '@/constants/Typography';
import { Space, Radius } from '@/constants/Spacing';
import { Palette } from '@/constants/Colors';
import GoldDivider from '@/components/ui/GoldDivider';

type Mode = 'mishna' | 'quote';

export default function DailyLearningCard() {
  const [mode, setMode] = useState<Mode>('mishna');
  const mishna  = getDailyMishna();
  const quote   = getDailyQuote();
  const parasha = getWeeklyParasha();

  const now        = new Date();
  const dayIdx     = now.getDay();
  const englishDay = ENGLISH_DAYS[dayIdx];
  const hebrewDay  = HEBREW_DAYS[dayIdx];

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
          <View style={styles.parashaTag}>
            <Text style={styles.parashaHeb}>{parasha.heb}</Text>
            <Text style={styles.parashaEn}>Parshas {parasha.name}</Text>
          </View>
        </View>

        <GoldDivider marginVertical={12} opacity={0.25} />

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, mode === 'mishna' && styles.modeBtnActive]}
            onPress={() => setMode('mishna')}
          >
            <Text style={[styles.modeBtnText, mode === 'mishna' && styles.modeBtnTextActive]}>
              Daily Mishna
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'quote' && styles.modeBtnActive]}
            onPress={() => setMode('quote')}
          >
            <Text style={[styles.modeBtnText, mode === 'quote' && styles.modeBtnTextActive]}>
              Daily Quote
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {mode === 'mishna' ? (
          <MishnaContent mishna={mishna} />
        ) : (
          <QuoteContent quote={quote} />
        )}

        {/* Read button */}
        <Pressable
          style={styles.readBtn}
          onPress={() => router.push({ pathname: '/book-detail/[id]', params: { id: 'pirkei-avos' } })}
        >
          <Text style={styles.readBtnText}>Read Pirkei Avos →</Text>
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
  parashaTag: {
    alignItems: 'flex-end',
  },
  parashaHeb: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   14,
    color:      Palette.goldMid,
  },
  parashaEn: {
    fontFamily: Fonts.sansRegular,
    fontSize:   10,
    color:      '#5A5040',
    letterSpacing: 0.3,
  },

  // Mode toggle
  modeRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  Space[4],
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       '#1E2A40',
  },
  modeBtnActive: {
    backgroundColor: Palette.navyMid,
    borderColor:     Palette.goldMid + '50',
  },
  modeBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      '#3A4A60',
  },
  modeBtnTextActive: {
    color: '#EDE8DD',
  },

  // Content
  content: {
    gap: Space[3],
    marginBottom: Space[4],
  },
  sage: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   13,
    color:      Palette.goldBright,
  },
  ref: {
    fontFamily: Fonts.sansMedium,
    fontSize:   10,
    color:      '#5A5040',
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
    fontFamily: Fonts.sansSemiBold,
    fontSize:   11,
    color:      Palette.goldMid,
    letterSpacing: 0.5,
  },
  lesson: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    color:      '#8B8070',
    lineHeight: 20,
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
    alignSelf:   'flex-start',
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth:  1,
    borderColor:  Palette.goldMid + '40',
  },
  readBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize:   12,
    color:      Palette.goldBright,
  },
});
