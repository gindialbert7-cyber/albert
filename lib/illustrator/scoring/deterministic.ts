/**
 * Deterministic scorers — composition, color harmony, palette
 * restraint, structural lint. These run today without ML models and
 * produce stable scores across platforms.
 *
 * ML-dependent scorers (VILA-R, TOPIQ, CLIP-IQA, custom hand-drawn
 * classifier) live in scoring/ml.ts and are called by the scoring
 * service OUTSIDE the renderer purity boundary.
 */

import { linearToOklab, MAX_CHROMA_OKLAB } from '../colors/oklab';

// ─── Composition metrics from a placed-element manifest ────────────────────

export type PlacedElement = {
  kind: 'character' | 'prop' | 'text' | 'decoration';
  /** Bounding box in canvas coords. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Approximated saliency 0..1; characters & text → high, decorations → low. */
  saliency: number;
};

export type CanvasInfo = {
  width: number;
  height: number;
  /** Where on the page the gutter lives (0 = single-page, 0.5 = center spread). */
  gutterFraction?: number;
};

export type CompositionMetrics = {
  saliencyThirdsDistance: number;
  balanceLR: number;
  balanceTB: number;
  negativeSpaceRatio: number;
  focalPointCount: number;
};

/**
 * Compute composition metrics from a placed-element list. No image
 * inspection — this scores the layout solver's intent, not the
 * rendered pixels (which would require BASNet/saliency inference).
 *
 * For pixel-level saliency scoring, see scoring/ml.ts → BASNet integration.
 */
export function compositionMetrics(
  elements: PlacedElement[],
  canvas: CanvasInfo,
): CompositionMetrics {
  // Total visual mass (saliency × area).
  let totalMass = 0;
  let leftMass = 0;
  let rightMass = 0;
  let topMass = 0;
  let bottomMass = 0;
  const focalPoints: { x: number; y: number; mass: number }[] = [];

  for (const e of elements) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const mass = e.saliency * e.w * e.h;
    totalMass += mass;
    if (cx < canvas.width / 2) leftMass += mass;
    else rightMass += mass;
    if (cy < canvas.height / 2) topMass += mass;
    else bottomMass += mass;
    if (e.saliency > 0.55) focalPoints.push({ x: cx, y: cy, mass });
  }

  if (totalMass === 0) {
    return {
      saliencyThirdsDistance: 1,
      balanceLR: 0,
      balanceTB: 0,
      negativeSpaceRatio: 1,
      focalPointCount: 0,
    };
  }

  // Balance: ratio of (left - right)/total, etc.
  const balanceLR = (leftMass - rightMass) / totalMass;
  const balanceTB = (topMass - bottomMass) / totalMass;

  // Subject-on-thirds: weighted average distance from each focal point to the
  // nearest thirds-power-point.
  const tx = [canvas.width / 3, (canvas.width * 2) / 3];
  const ty = [canvas.height / 3, (canvas.height * 2) / 3];
  let weightedDist = 0;
  let weightTotal = 0;
  for (const fp of focalPoints) {
    let bestD = Infinity;
    for (const px of tx) {
      for (const py of ty) {
        const dx = fp.x - px;
        const dy = fp.y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) bestD = d;
      }
    }
    const normDist = bestD / Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    weightedDist += normDist * fp.mass;
    weightTotal += fp.mass;
  }
  const saliencyThirdsDistance = weightTotal > 0 ? weightedDist / weightTotal : 1;

  // Negative space: area covered by elements vs canvas area.
  let coveredArea = 0;
  for (const e of elements) coveredArea += e.w * e.h;
  const negativeSpaceRatio = Math.max(0, 1 - coveredArea / (canvas.width * canvas.height));

  return {
    saliencyThirdsDistance,
    balanceLR,
    balanceTB,
    negativeSpaceRatio,
    focalPointCount: focalPoints.length,
  };
}

// ─── Matsuda color harmony ─────────────────────────────────────────────────

/** Matsuda's 8 harmonic hue templates as central hues + arc widths (radians). */
type HarmonicTemplate = { name: string; arcs: { center: number; width: number }[] };

const TWO_PI = 6.283185307179586;

const HARMONIC_TEMPLATES: HarmonicTemplate[] = [
  // i: monochromatic — a narrow single-hue arc
  { name: 'i', arcs: [{ center: 0, width: 0.31 }] },
  // V: small + medium adjacent hues
  { name: 'V', arcs: [{ center: 0, width: 0.16 }] },
  // L: 90°-separated
  { name: 'L', arcs: [{ center: 0, width: 0.16 }, { center: Math.PI / 2, width: 0.31 }] },
  // I: complementary (180° apart)
  { name: 'I', arcs: [{ center: 0, width: 0.16 }, { center: Math.PI, width: 0.16 }] },
  // T: half-circle wide
  { name: 'T', arcs: [{ center: 0, width: Math.PI }] },
  // Y: dominant + two analogous
  { name: 'Y', arcs: [{ center: 0, width: 0.16 }, { center: Math.PI, width: Math.PI / 2 - 0.4 }] },
  // X: two pairs at 180°
  { name: 'X', arcs: [{ center: 0, width: 0.5 }, { center: Math.PI, width: 0.5 }] },
];

function hueOfHex(hex: string): { hue: number; chroma: number; lightness: number } {
  // Parse hex → sRGB → linear → OKLab → polar.
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { hue: 0, chroma: 0, lightness: 0 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  // Simple sRGB → linear via Remez-friendly approx (already in oklab.ts);
  // we duplicate a tiny version here to avoid an import cycle.
  const lin = (c: number) => {
    if (c <= 0.04045) return c / 12.92;
    const y = (c + 0.055) / 1.055;
    // y^2.4 polynomial fit (same as oklab.ts srgbToLinear).
    return y * y * y * (0.9479 - 0.9036 * y + 0.5557 * y * y) + 0.0103 * y;
  };
  const [L, a, bC] = linearToOklab([lin(r), lin(g), lin(b)]);
  const chroma = Math.sqrt(a * a + bC * bC);
  // Hue via atan2 — but we banned Math.atan2. Use a simple polynomial:
  // Approximation valid to ~3 degrees; for harmony scoring this is fine.
  let hue: number;
  if (chroma < 1e-6) hue = 0;
  else hue = polyAtan2(bC, a);
  return { hue, chroma, lightness: L };
}

function polyAtan2(y: number, x: number): number {
  if (x === 0 && y === 0) return 0;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const r = ax > ay ? ay / ax : ax / ay;
  // atan(r) for r in [0,1]: minimax polynomial.
  const r2 = r * r;
  let a = r * (1 - r2 * 0.33 + r2 * r2 * 0.18 - r2 * r2 * r2 * 0.07);
  if (ax <= ay) a = Math.PI / 2 - a;
  if (x < 0) a = Math.PI - a;
  if (y < 0) a = -a;
  return a;
}

/** Score a palette's fit to its best Matsuda template, 0..1 (1 = perfect). */
export function harmonyScore(palette: string[]): { score: number; template: string } {
  if (palette.length === 0) return { score: 0, template: 'none' };
  const samples = palette
    .map((c) => hueOfHex(c))
    .filter((s) => s.chroma > 0.02); // ignore near-neutrals
  if (samples.length === 0) return { score: 0.8, template: 'neutral' };

  let bestScore = 0;
  let bestTemplate = HARMONIC_TEMPLATES[0].name;
  for (const tpl of HARMONIC_TEMPLATES) {
    // Find best rotation of the template that minimizes outliers.
    let best = 0;
    const N = 12;
    for (let i = 0; i < N; i++) {
      const rotation = (i / N) * TWO_PI;
      // For each sample, find distance to nearest arc.
      let totalDist = 0;
      for (const s of samples) {
        let minD = Math.PI;
        for (const arc of tpl.arcs) {
          const center = (arc.center + rotation) % TWO_PI;
          const d = arcDistance(s.hue, center, arc.width);
          if (d < minD) minD = d;
        }
        totalDist += minD;
      }
      const avg = totalDist / samples.length;
      const sc = Math.max(0, 1 - avg / (Math.PI / 2)); // 90° avg deviation = 0
      if (sc > best) best = sc;
    }
    if (best > bestScore) {
      bestScore = best;
      bestTemplate = tpl.name;
    }
  }
  return { score: bestScore, template: bestTemplate };
}

function arcDistance(hue: number, center: number, halfWidth: number): number {
  let d = Math.abs(hue - center);
  if (d > Math.PI) d = TWO_PI - d;
  return Math.max(0, d - halfWidth);
}

// ─── Palette restraint (anti-AI signature) ────────────────────────────────

export function paletteRestraint(palette: string[]): { maxChroma: number; capViolations: number } {
  let maxChroma = 0;
  let violations = 0;
  for (const c of palette) {
    const { chroma } = hueOfHex(c);
    if (chroma > maxChroma) maxChroma = chroma;
    if (chroma > MAX_CHROMA_OKLAB) violations++;
  }
  return { maxChroma, capViolations: violations };
}

// ─── Structural lint (book-craft rules) ───────────────────────────────────

export type BookCraftIssue =
  | 'page-count-not-multiple-of-8'
  | 'climax-not-on-24-27'
  | 'face-in-gutter'
  | 'body-font-not-allowlisted'
  | 'body-font-size-wrong-for-age'
  | 'word-count-over-age-band-cap'
  | 'text-on-wrong-page-of-spread';

export type BookCraftReport = {
  issues: BookCraftIssue[];
  pageBlockers: number;
};

export type BookContext = {
  pageCount: number;
  climaxPageIndex?: number;
  ageBand: 'board' | 'picture-3-5' | 'picture-5-7' | 'early-reader' | 'chapter';
  bodyFont: string;
  bodyFontSizePt: number;
  perPageWordCounts: number[];
};

const ALLOWED_BODY_FONTS = [
  'EB Garamond',
  'Bembo Book',
  'Mrs Eaves OT',
  'Sabon',
  'Georgia',
  'Atkinson Hyperlegible',
  'Cormorant Garamond',
  'Source Serif Pro',
];

const AGE_BAND_FONT_SIZE: Record<BookContext['ageBand'], { min: number; max: number; wordCap: number; perPageCap: number }> = {
  board: { min: 22, max: 28, wordCap: 50, perPageCap: 10 },
  'picture-3-5': { min: 20, max: 24, wordCap: 300, perPageCap: 25 },
  'picture-5-7': { min: 18, max: 22, wordCap: 600, perPageCap: 60 },
  'early-reader': { min: 16, max: 18, wordCap: 2500, perPageCap: 80 },
  chapter: { min: 14, max: 16, wordCap: 12000, perPageCap: 200 },
};

export function lintBookCraft(ctx: BookContext): BookCraftReport {
  const issues: BookCraftIssue[] = [];
  if (ctx.pageCount % 8 !== 0) issues.push('page-count-not-multiple-of-8');
  if (ctx.climaxPageIndex !== undefined && (ctx.climaxPageIndex < 23 || ctx.climaxPageIndex > 26)) {
    issues.push('climax-not-on-24-27');
  }
  if (!ALLOWED_BODY_FONTS.includes(ctx.bodyFont)) issues.push('body-font-not-allowlisted');
  const band = AGE_BAND_FONT_SIZE[ctx.ageBand];
  if (ctx.bodyFontSizePt < band.min || ctx.bodyFontSizePt > band.max) {
    issues.push('body-font-size-wrong-for-age');
  }
  const totalWords = ctx.perPageWordCounts.reduce((a, b) => a + b, 0);
  if (totalWords > band.wordCap) issues.push('word-count-over-age-band-cap');
  let pageBlockers = 0;
  for (const wc of ctx.perPageWordCounts) {
    if (wc > band.perPageCap) pageBlockers++;
  }
  return { issues, pageBlockers };
}
