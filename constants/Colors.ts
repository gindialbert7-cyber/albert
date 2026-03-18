/**
 * Albert – Jewish eReader
 * Design token: Colors
 *
 * Palette rooted in the aesthetic of illuminated manuscripts and
 * fine Judaica: deep navy, burnished gold, warm parchment.
 */

export const Palette = {
  // Core brand
  navyDeep:    '#0F1A35',
  navyMid:     '#1A2744',
  navyLight:   '#243558',

  // Gold hierarchy
  goldBright:  '#E8C547',
  goldMid:     '#C9A84C',
  goldSoft:    '#B8965A',
  goldMuted:   '#8B6914',

  // Parchment / paper
  parchment:   '#F5EFE0',
  parchmentWarm: '#EFE5CC',
  ivoryLight:  '#FDFAF4',
  ivoryMid:    '#F8F3E8',

  // Text
  inkDark:     '#1A1207',
  inkMid:      '#3D3020',
  inkSoft:     '#6B5B3E',
  inkMuted:    '#9B8B70',

  // UI
  divider:     '#DDD4C0',
  border:      '#C8BCA6',
  overlay:     'rgba(15, 26, 53, 0.6)',
  overlayLight:'rgba(15, 26, 53, 0.3)',

  // Semantic
  white:       '#FFFFFF',
  black:       '#000000',
  error:       '#C0392B',
  success:     '#27AE60',

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
