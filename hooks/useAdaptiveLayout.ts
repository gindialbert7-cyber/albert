/**
 * useAdaptiveLayout — responsive layout tokens for every screen size.
 *
 * Three tiers:
 *   phone   — width <  430  (iPhone SE up to Pro Max)
 *   tablet  — width <  1024 (iPad Mini, small iPads)
 *   large   — width >= 1024 (iPad Pro, large tablets, desktops)
 *
 * Returns sizes, margins, and bilingual column strategy. Re-renders on
 * orientation changes via Dimensions 'change' subscription.
 */

import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export type LayoutTier = 'phone' | 'tablet' | 'large';

export interface AdaptiveLayout {
  /** Coarse device tier. */
  tier: LayoutTier;
  /** Raw window width in logical pixels. */
  width:  number;
  height: number;
  /** True when width > height. */
  isLandscape: boolean;

  // ── Typography ─────────────────────────────────────────────────────────────
  /** Recommended Hebrew (Frank Ruhl) font size. */
  hebrewFontSize:  number;
  /** Recommended English (Crimson Pro) font size. */
  englishFontSize: number;
  /** Line-height multiplier (lineHeight = fontSize * this). */
  lineHeightMultiplier: number;

  // ── Spacing ────────────────────────────────────────────────────────────────
  /** Horizontal page margin. */
  marginHorizontal: number;
  /** Max column width (text won't stretch beyond this). */
  maxContentWidth: number;

  // ── Reader ─────────────────────────────────────────────────────────────────
  /** Single-column or dual-column bilingual view. */
  columnMode: 'single' | 'dual';
  /** Whether to show the single/dual toggle button. */
  showDualToggle: boolean;
  /** TOC navigation mode: bottom drawer (phone) or sidebar (tablet+). */
  tocMode: 'drawer' | 'sidebar';
  /** Gutter between dual columns (in px). */
  columnGutter: number;
}

function pickTier(w: number): LayoutTier {
  if (w >= 1024) return 'large';
  if (w >= 430)  return 'tablet';
  return 'phone';
}

function computeLayout(w: number, h: number): AdaptiveLayout {
  const tier        = pickTier(w);
  const isLandscape = w > h;

  switch (tier) {
    case 'large':
      return {
        tier, width: w, height: h, isLandscape,
        hebrewFontSize:       28,
        englishFontSize:      21,
        lineHeightMultiplier: 1.7,
        marginHorizontal:     64,
        maxContentWidth:      900,
        columnMode:           'dual',
        showDualToggle:       true,
        tocMode:              'sidebar',
        columnGutter:         48,
      };

    case 'tablet':
      return {
        tier, width: w, height: h, isLandscape,
        hebrewFontSize:       25,
        englishFontSize:      19,
        lineHeightMultiplier: 1.65,
        marginHorizontal:     40,
        maxContentWidth:      780,
        columnMode:           isLandscape ? 'dual' : 'single',
        showDualToggle:       true,
        tocMode:              'sidebar',
        columnGutter:         32,
      };

    case 'phone':
    default:
      return {
        tier, width: w, height: h, isLandscape,
        hebrewFontSize:       22,
        englishFontSize:      17,
        lineHeightMultiplier: 1.6,
        marginHorizontal:     20,
        maxContentWidth:      w,
        columnMode:           'single',
        showDualToggle:       false,
        tocMode:              'drawer',
        columnGutter:         0,
      };
  }
}

/**
 * Reactive hook — returns a fresh `AdaptiveLayout` on every orientation or
 * window-size change. Safe to call in any component.
 */
export function useAdaptiveLayout(): AdaptiveLayout {
  const [layout, setLayout] = useState<AdaptiveLayout>(() => {
    const { width, height } = Dimensions.get('window');
    return computeLayout(width, height);
  });

  useEffect(() => {
    const handler = ({ window }: { window: ScaledSize }) => {
      setLayout(computeLayout(window.width, window.height));
    };
    const sub = Dimensions.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  return layout;
}

/**
 * Scale a base font-size for the current tier. Useful for one-off sizing
 * outside the reader (e.g. headings on Home).
 */
export function scaleFont(base: number, tier: LayoutTier): number {
  switch (tier) {
    case 'large':  return Math.round(base * 1.25);
    case 'tablet': return Math.round(base * 1.12);
    case 'phone':
    default:       return base;
  }
}
