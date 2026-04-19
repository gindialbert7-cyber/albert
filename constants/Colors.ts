/**
 * Albert – Jewish eReader
 * Design token: Colors
 *
 * Palette rooted in the aesthetic of illuminated manuscripts and
 * fine Judaica: deep navy, burnished gold, warm parchment.
 *
 * Extended April 2026 per the Bereshit Press design brief
 * (Albert.html master plan). New tokens are additive — existing
 * entries keep their original values so nothing downstream breaks.
 */

export const Palette = {
  // Core brand
  navyDeep:    '#0F1A35',
  navyMid:     '#1A2744',
  navyLight:   '#243558',
  navyInk:     '#2A3E55',

  // Gold hierarchy
  goldBright:  '#E8C547',
  goldMid:     '#C9A84C',
  goldSoft:    '#B8965A',
  goldMuted:   '#8B6914',
  goldWarm:    '#C9A14A',
  goldInk:     '#8A6A1C',
  goldLine:    '#A88C2C',

  // Parchment / paper
  parchment:    '#F5EFE0',
  parchmentPure:'#F4EFE4',      // Bereshit Press spec
  parchmentDeep:'#EAE2D0',
  parchmentWarm:'#EFE5CC',
  paper:        '#FBF8F1',
  ivoryLight:   '#FDFAF4',
  ivoryMid:     '#F8F3E8',
  snow:         '#FFFFFF',

  // Sepia (day reading)
  sepia:        '#EAD9B8',
  sepiaSurface: '#F2E4C5',
  sepiaInk:     '#3B2A14',

  // Night (reader)
  night:        '#1A1612',
  nightSurface: '#221C16',
  nightInk:     '#EDE2CC',
  nightMute:    '#D6C9AE',

  // Text
  inkDeep:     '#0E0902',
  inkDark:     '#1A1207',
  inkMid:      '#3D3020',
  inkSoft:     '#6B5B3E',
  inkMuted:    '#9B8B70',

  // UI
  divider:     '#DDD4C0',
  border:      '#C8BCA6',
  rule:        'rgba(14,9,2,0.12)',
  ruleStrong:  'rgba(14,9,2,0.22)',
  mute:        'rgba(14,9,2,0.55)',
  muteDeep:    'rgba(14,9,2,0.72)',
  overlay:     'rgba(15, 26, 53, 0.6)',
  overlayLight:'rgba(15, 26, 53, 0.3)',
  shadow:      'rgba(14,9,2,0.08)',

  // Semantic
  white:       '#FFFFFF',
  black:       '#000000',
  error:       '#C0392B',
  success:     '#27AE60',
  crimson:     '#9F3B2C',
  sage:        '#5C6F4E',

  // Highlight swatches
  highlightGold:  '#F5E1A0',
  highlightBlue:  '#BFD7EA',
  highlightRose:  '#F2C5C9',
  highlightMoss:  '#C9D6B7',
  highlightLilac: '#D4C7E4',

  // Category accents
  torah:       '#1A5276',   // deep sapphire
  parasha:     '#154360',
  talmud:      '#4A235A',   // royal purple
  halacha:     '#1B4F72',
  machzor:     '#6E2F0A',   // burnt sienna / festive
  mussar:      '#145A32',   // deep green
  chasidus:    '#512E5F',   // violet
  children:    '#C0392B',   // warm red
  modern:      '#1A3A4A',   // slate
};

// ─── Reading themes ─────────────────────────────────────────────────────────
//
// Four reader themes the user can switch between. Each is a full colour
// context — the reader root applies these values so every nested element
// inherits cleanly. Switching theme does not remount the page.

export interface ReadingTheme {
  name:      string;
  bg:        string;  // page background
  surface:   string;  // card / commentary block
  ink:       string;  // primary text
  mute:      string;  // secondary text
  navy:      string;  // ceremonial accent (pasuk numbers, headings)
  gold:      string;  // rule + kicker + mefaresh label
  rule:      string;  // hairline rule colour
  highlight: string;  // text-highlight swatch
}

export const ReadingThemes: Record<'parchment' | 'sepia' | 'paper' | 'night', ReadingTheme> = {
  parchment: {
    name:      'Parchment',
    bg:        Palette.parchmentPure,
    surface:   Palette.paper,
    ink:       Palette.inkDeep,
    mute:      Palette.mute,
    navy:      Palette.navyMid,
    gold:      Palette.goldLine,
    rule:      Palette.rule,
    highlight: Palette.highlightGold,
  },
  sepia: {
    name:      'Sepia',
    bg:        Palette.sepia,
    surface:   Palette.sepiaSurface,
    ink:       Palette.sepiaInk,
    mute:      'rgba(59,42,20,0.6)',
    navy:      Palette.navyInk,
    gold:      Palette.goldInk,
    rule:      'rgba(59,42,20,0.18)',
    highlight: Palette.highlightGold,
  },
  paper: {
    name:      'Paper',
    bg:        Palette.snow,
    surface:   '#F7F7F7',
    ink:       '#111111',
    mute:      'rgba(0,0,0,0.55)',
    navy:      Palette.navyMid,
    gold:      Palette.goldLine,
    rule:      'rgba(0,0,0,0.08)',
    highlight: '#FFE9A8',
  },
  night: {
    name:      'Night',
    bg:        Palette.night,
    surface:   Palette.nightSurface,
    ink:       Palette.nightInk,
    mute:      'rgba(237,226,204,0.55)',
    navy:      Palette.goldWarm,
    gold:      Palette.goldWarm,
    rule:      'rgba(237,226,204,0.12)',
    highlight: 'rgba(201,161,74,0.35)',
  },
};

export type ReadingThemeKey = keyof typeof ReadingThemes;

export const Colors = {
  light: {
    // Backgrounds
    bg:           Palette.ivoryLight,
    bgCard:       Palette.ivoryMid,
    bgElevated:   Palette.white,
    bgReader:     Palette.parchment,
    bgReaderWarm: Palette.parchmentWarm,

    // Text
    text:         Palette.inkDark,
    textSecondary:Palette.inkMid,
    textMuted:    Palette.inkSoft,
    textDisabled: Palette.inkMuted,

    // Brand
    tint:         Palette.navyMid,
    tintDark:     Palette.navyDeep,
    gold:         Palette.goldMid,
    goldBright:   Palette.goldBright,

    // UI chrome
    tabBar:       Palette.navyDeep,
    tabBarIcon:   Palette.goldMid,
    tabBarInactive:Palette.navyLight,
    header:       Palette.navyMid,
    headerText:   Palette.goldBright,
    border:       Palette.border,
    divider:      Palette.divider,
    overlay:      Palette.overlay,

    // Reader
    readerBg:     Palette.parchment,
    readerText:   Palette.inkDark,
    readerHeading:Palette.navyMid,
    readerGold:   Palette.goldMid,
    readerDivider:Palette.divider,

    icon:         Palette.inkMid,
    iconMuted:    Palette.inkMuted,
  },

  dark: {
    bg:           '#0D1220',
    bgCard:       '#141B30',
    bgElevated:   '#1A2340',
    bgReader:     '#0F1825',
    bgReaderWarm: '#111C2A',

    text:         '#EDE8DD',
    textSecondary:'#C8BFA8',
    textMuted:    '#8B8070',
    textDisabled: '#5A5040',

    tint:         Palette.goldBright,
    tintDark:     Palette.goldMid,
    gold:         Palette.goldBright,
    goldBright:   Palette.goldBright,

    tabBar:       '#0A1020',
    tabBarIcon:   Palette.goldBright,
    tabBarInactive:'#3A4560',
    header:       '#0A1020',
    headerText:   Palette.goldBright,
    border:       '#2A3450',
    divider:      '#1E2A40',
    overlay:      Palette.overlay,

    readerBg:     '#0F1825',
    readerText:   '#DDD5C5',
    readerHeading: Palette.goldBright,
    readerGold:   Palette.goldMid,
    readerDivider:'#1E2A40',

    icon:         '#C0B090',
    iconMuted:    '#5A5040',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
