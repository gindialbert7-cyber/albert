import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/Colors';
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
  const theme = useLibraryStore(s => s.theme);
  const isDark = useColorScheme() === 'dark';

  const READER_THEMES = {
    parchment: {
      bg:      '#F5EFE0',
      bgWarm:  '#EFE5CC',
      text:    '#1A1207',
      heading: '#1A2744',
      gold:    '#C9A84C',
      divider: '#DDD4C0',
      muted:   '#6B5B3E',
    },
    sepia: {
      bg:      '#EAE0CC',
      bgWarm:  '#DDD4BA',
      text:    '#2A1E10',
      heading: '#1A2744',
      gold:    '#C9A84C',
      divider: '#C8BCA0',
      muted:   '#7A6B50',
    },
    white: {
      bg:      '#FFFFFF',
      bgWarm:  '#F9F9F9',
      text:    '#111111',
      heading: '#1A2744',
      gold:    '#C9A84C',
      divider: '#E0E0E0',
      muted:   '#666666',
    },
    night: {
      bg:      '#0F1825',
      bgWarm:  '#111C2A',
      text:    '#DDD5C5',
      heading: '#E8C547',
      gold:    '#E8C547',
      divider: '#1E2A40',
      muted:   '#8B8070',
    },
  };

  return READER_THEMES[theme] ?? READER_THEMES.parchment;
}
