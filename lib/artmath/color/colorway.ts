/**
 * Colorway — generate harmonious palettes from a single key color.
 *
 * A "colorway" is the textile-industry term for a recolored variant of a
 * pattern: same motif, different palette. Producing 6-12 colorways for a
 * single pattern is standard practice — the same Liberty floral may ship
 * in "spring", "rust", "navy", "blush", etc.
 *
 * We work in OKLCh because it's the only widely-deployed perceptual color
 * space that gives equal hue-rotation steps a uniform visual feel. (Hue
 * rotation in HSL is the canonical AI-aesthetic mistake: equal angular
 * steps in HSL produce wildly unequal perceptual jumps and a "rainbow
 * vomit" effect.)
 *
 * Strategies provided:
 *   - 'monochrome'   single hue, varying lightness/chroma. Calm, modern.
 *   - 'analogous'    3 adjacent hues at ±30°. Floral wallpapers.
 *   - 'complementary' key + opposite hue. High contrast, sparse use.
 *   - 'split-complement' key + two hues at 150° / 210°. Stable triad.
 *   - 'triadic'      three hues at 120° apart. Bauhaus / playroom.
 *   - 'tetradic'     four hues at 90° apart. Rare; high energy.
 *   - 'shades'       single hue, 5 steps from deep to light at fixed C.
 *
 * Every output color is clamped to MAX_CHROMA_OKLAB to enforce the
 * anti-AI saturation rule.
 *
 * Sources:
 *   - Ottosson 2020, "A perceptual color space for image processing"
 *   - Itten, "The Art of Color" (1961) — classical harmony classes
 *   - Albers, "Interaction of Color" (1963)
 */

import {
  linearToOklab,
  oklabToLinear,
  MAX_CHROMA_OKLAB,
} from '../../illustrator/colors/oklab';
import { dCos, dSin, dAtan2 } from '../../illustrator/math/det-math';

export type Strategy =
  | 'monochrome'
  | 'analogous'
  | 'complementary'
  | 'split-complement'
  | 'triadic'
  | 'tetradic'
  | 'shades';

export type Colorway = {
  strategy: Strategy;
  /** Ordered palette: [background, primary, secondary, accent, ...]. */
  colors: string[];
  /** Suggested neutral/paper tone for backgrounds. */
  paper: string;
  /** Display name (e.g. "rust + sky + cream"). */
  name: string;
};

// ─── Hex ↔ OKLCh round trip ───────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}
function srgbToLinear(c: number): number {
  if (c <= 0.04045) return c / 12.92;
  const y = (c + 0.055) / 1.055;
  return y * y * y * (0.9479 - 0.9036 * y + 0.5557 * y * y) + 0.0103 * y;
}
function linearToSrgb(c: number): number {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * polyInv24(c) - 0.055;
}
function polyInv24(y: number): number {
  if (y <= 0) return 0;
  if (y >= 1) return 1;
  let x = Math.sqrt(y);
  for (let it = 0; it < 4; it++) {
    const x04 = polyPow04(x);
    const fx = x * x * x04 - y;
    const dfx = 2.4 * x * x04;
    x = x - fx / Math.max(1e-9, dfx);
    if (x < 0) x = 0;
    if (x > 1) x = 1;
  }
  return x;
}
function polyPow04(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * (1.7349 - 1.7146 * x + 1.5046 * x * x - 0.8042 * x * x * x + 0.2793 * x * x * x * x);
}

function hexToOklch(hex: string): { L: number; C: number; H: number } {
  const [r, g, b] = hexToRgb(hex);
  const lin: [number, number, number] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const [L, a, bb] = linearToOklab(lin);
  const C = Math.sqrt(a * a + bb * bb);
  const H = dAtan2(bb, a);
  return { L, C, H };
}

function oklchToHex(L: number, C: number, H: number): string {
  const cap = Math.min(C, MAX_CHROMA_OKLAB);
  const a = cap * dCos(H);
  const b = cap * dSin(H);
  const lin = oklabToLinear([L, a, b]);
  const cr = Math.max(0, Math.min(255, Math.round(linearToSrgb(lin[0]) * 255)));
  const cg = Math.max(0, Math.min(255, Math.round(linearToSrgb(lin[1]) * 255)));
  const cb = Math.max(0, Math.min(255, Math.round(linearToSrgb(lin[2]) * 255)));
  return `#${((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0')}`;
}

// ─── Colorway generators ───────────────────────────────────────────────

function rotated(L: number, C: number, H: number, dDeg: number): string {
  const dRad = (dDeg * Math.PI) / 180;
  return oklchToHex(L, C, H + dRad);
}

function paperFor(L: number, H: number): string {
  // Warm cream → cool ivory, biased toward the key hue at very low chroma.
  return oklchToHex(0.94, 0.018, H);
}

/** Build a colorway from a single key color and strategy. */
export function colorway(keyHex: string, strategy: Strategy): Colorway {
  const { L, C, H } = hexToOklch(keyHex);
  const Lmid = Math.max(0.35, Math.min(0.75, L));
  // For most strategies we anchor on a "main" lightness near 0.55.
  let palette: string[] = [];
  let name = '';
  switch (strategy) {
    case 'monochrome': {
      palette = [
        oklchToHex(Math.max(0.18, L - 0.32), C * 0.85, H),
        oklchToHex(Math.max(0.30, L - 0.16), C, H),
        oklchToHex(L, C, H),
        oklchToHex(Math.min(0.85, L + 0.16), C * 0.85, H),
        oklchToHex(Math.min(0.95, L + 0.30), C * 0.55, H),
      ];
      name = 'mono';
      break;
    }
    case 'analogous': {
      palette = [
        rotated(L - 0.14, C, H, -30),
        rotated(L, C, H, -15),
        oklchToHex(L, C, H),
        rotated(L, C, H, +15),
        rotated(L + 0.08, C * 0.8, H, +30),
      ];
      name = 'analogous';
      break;
    }
    case 'complementary': {
      palette = [
        oklchToHex(L - 0.22, C * 0.9, H),
        oklchToHex(L, C, H),
        oklchToHex(L + 0.12, C * 0.6, H),
        rotated(L, C, H, 180),
        rotated(L + 0.18, C * 0.5, H, 180),
      ];
      name = 'complement';
      break;
    }
    case 'split-complement': {
      palette = [
        oklchToHex(L - 0.18, C * 0.85, H),
        oklchToHex(L, C, H),
        rotated(L, C * 0.85, H, 150),
        rotated(L, C * 0.85, H, 210),
        rotated(L + 0.18, C * 0.6, H, 180),
      ];
      name = 'split';
      break;
    }
    case 'triadic': {
      palette = [
        oklchToHex(Math.max(0.25, L - 0.20), C * 0.85, H),
        oklchToHex(L, C, H),
        rotated(L, C, H, 120),
        rotated(L, C, H, 240),
        oklchToHex(Math.min(0.85, L + 0.20), C * 0.55, H),
      ];
      name = 'triad';
      break;
    }
    case 'tetradic': {
      palette = [
        oklchToHex(L, C, H),
        rotated(L, C, H, 90),
        rotated(L, C, H, 180),
        rotated(L, C, H, 270),
        oklchToHex(Math.min(0.90, L + 0.25), C * 0.4, H),
      ];
      name = 'tetrad';
      break;
    }
    case 'shades': {
      palette = [
        oklchToHex(0.15, C * 0.9, H),
        oklchToHex(0.30, C * 0.95, H),
        oklchToHex(0.50, C, H),
        oklchToHex(0.70, C * 0.9, H),
        oklchToHex(0.90, C * 0.5, H),
      ];
      name = 'shades';
      break;
    }
  }
  void Lmid;
  return {
    strategy,
    colors: palette,
    paper: paperFor(L, H),
    name,
  };
}

/** Generate a "standard 6-pack" of colorways for one base color —
 *  the spec sheet a textile buyer expects to see. */
export function colorwayPack(keyHex: string): Colorway[] {
  return [
    colorway(keyHex, 'monochrome'),
    colorway(keyHex, 'analogous'),
    colorway(keyHex, 'complementary'),
    colorway(keyHex, 'split-complement'),
    colorway(keyHex, 'triadic'),
    colorway(keyHex, 'shades'),
  ];
}
