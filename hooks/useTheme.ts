import { useColorScheme } from 'react-native';
import { Colors, ThemeColors, ReadingThemes } from '@/constants/Colors';
import { useLibraryStore } from '@/store/useLibraryStore';

/**
 * Returns the current theme colors based on the device's colour scheme.
 * In reader contexts the store's reader theme overrides system dark mode.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

export function useReaderColors() {
  const storeTheme = useLibraryStore(s => s.theme);

  // 'white' is the legacy store key — map it to 'paper'
  const themeKey = storeTheme === 'white' ? 'paper' : storeTheme as 'parchment' | 'sepia' | 'paper' | 'night';
  const t = ReadingThemes[themeKey] ?? ReadingThemes.parchment;

  return {
    bg:      t.bg,
    bgWarm:  t.surface,
    text:    t.ink,
    heading: t.navy,
    gold:    t.gold,
    divider: t.rule,
    muted:   t.mute,
    surface: t.surface,
    highlight: t.highlight,
  };
}
