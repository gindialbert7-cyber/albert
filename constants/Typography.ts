/**
 * Typography system
 *
 * Hebrew: Frank Rühl Libre – the classic Ashkenazi typesetting font,
 *         used in virtually every printed sefer.
 * English body: Crimson Pro – a refined old-style serif optimised for
 *               long-form reading; feels like a fine press book.
 * UI sans: Inter – clean, legible, modern.
 */

export const Fonts = {
  // Hebrew
  hebrewRegular:  'FrankRuhlLibre_400Regular',
  hebrewMedium:   'FrankRuhlLibre_500Medium',
  hebrewBold:     'FrankRuhlLibre_700Bold',
  hebrewBlack:    'FrankRuhlLibre_900Black',

  // English serif (body / reader)
  serifRegular:   'CrimsonPro_400Regular',
  serifItalic:    'CrimsonPro_400Regular_Italic',
  serifSemiBold:  'CrimsonPro_600SemiBold',
  serifBold:      'CrimsonPro_700Bold',

  // Sans (UI)
  sansRegular:    'Inter_400Regular',
  sansMedium:     'Inter_500Medium',
  sansSemiBold:   'Inter_600SemiBold',
  sansBold:       'Inter_700Bold',
};

// Semantic type scale
export const TextStyles = {
  // Display (hero / splash titles)
  displayHero: {
    fontFamily: Fonts.hebrewBlack,
    fontSize:   52,
    lineHeight: 60,
    letterSpacing: -0.5,
  },
  displayLarge: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   40,
    lineHeight: 48,
    letterSpacing: -0.3,
  },

  // Hebrew headings
  hebrewH1: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   32,
    lineHeight: 44,
  },
  hebrewH2: {
    fontFamily: Fonts.hebrewMedium,
    fontSize:   26,
    lineHeight: 36,
  },
  hebrewBody: {
    fontFamily: Fonts.hebrewRegular,
    fontSize:   20,
    lineHeight: 34,
  },
  hebrewBodyLg: {
    fontFamily: Fonts.hebrewRegular,
    fontSize:   24,
    lineHeight: 40,
  },

  // English headings
  h1: {
    fontFamily: Fonts.serifBold,
    fontSize:   28,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: Fonts.serifSemiBold,
    fontSize:   22,
    lineHeight: 30,
  },
  h3: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   18,
    lineHeight: 24,
  },

  // Reader body text
  readerHebrew: {
    fontFamily: Fonts.hebrewRegular,
    fontSize:   22,
    lineHeight: 38,
    textAlign:  'right' as const,
  },
  readerEnglish: {
    fontFamily: Fonts.serifRegular,
    fontSize:   17,
    lineHeight: 28,
  },
  readerCommentary: {
    fontFamily: Fonts.serifItalic,
    fontSize:   15,
    lineHeight: 24,
  },

  // UI text
  labelLg: {
    fontFamily: Fonts.sansMedium,
    fontSize:   16,
    lineHeight: 22,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize:   14,
    lineHeight: 20,
  },
  labelSm: {
    fontFamily: Fonts.sansRegular,
    fontSize:   12,
    lineHeight: 16,
  },
  caption: {
    fontFamily: Fonts.sansRegular,
    fontSize:   11,
    lineHeight: 15,
    letterSpacing: 0.3,
  },

  // Book card
  bookTitle: {
    fontFamily: Fonts.serifBold,
    fontSize:   15,
    lineHeight: 20,
  },
  bookTitleHebrew: {
    fontFamily: Fonts.hebrewBold,
    fontSize:   18,
    lineHeight: 24,
    textAlign:  'right' as const,
  },
  bookAuthor: {
    fontFamily: Fonts.serifItalic,
    fontSize:   13,
    lineHeight: 18,
  },

  // Button
  buttonLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize:   15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  buttonLabelSm: {
    fontFamily: Fonts.sansMedium,
    fontSize:   13,
    lineHeight: 18,
  },

  // Tab bar
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize:   10,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
};
