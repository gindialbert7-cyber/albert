/**
 * Notan — value-mass composition.
 *
 * Notan (Japanese: light-dark composition) is the foundational
 * composition principle that says masterpieces work as 3-value
 * grayscale thumbnails. Andrew Loomis taught it as the FIRST step,
 * before color or detail. Edgar Payne enumerated 16 named patterns
 * (steelyard, Big T, group mass, etc.) in "Composition of Outdoor
 * Painting" (1941).
 *
 * Hard rules from the research:
 *   - Dominant value should occupy > 50% of canvas area
 *   - Subordinate value ~30%
 *   - Accent value < 20%
 *   - Maximum value contrast at the intended focal point
 *
 * This module exposes the two highest-leverage Payne operators:
 *   - bigT(...) — connected dark mass forming a T across the canvas
 *   - steelyard(...) — large mass + small mass + fulcrum law
 *
 * Each returns a *target mask* (function (x,y) → value bin) that
 * downstream renderers can use to constrain their value choices.
 *
 * Sources:
 *   - Edgar Payne, *Composition of Outdoor Painting* (1941)
 *   - Andrew Loomis, *Creative Illustration* (1947)
 *   - Powell, *The Big T* — value-pattern teaching essay
 *   - Arthur Wesley Dow, *Composition* (1899)
 */

import type { Pt } from '../../illustrator/geometry';
import { fmt2 } from '../../illustrator/math/det-format';

/** Value bins on the 5-value scale: 1=black, 5=white. */
export type ValueBin = 1 | 2 | 3 | 4 | 5;

export type ValueMask = {
  /** Value bin at a (x,y) coordinate in canvas units. */
  at(x: number, y: number): ValueBin;
  /** Pre-computed area share by bin (sums to 1.0). */
  shares: Record<ValueBin, number>;
  /** Human-readable pattern name. */
  pattern: string;
};

// ─── Big T ──────────────────────────────────────────────────────────────

export type BigTOptions = {
  /** Where the T's stem hits the bar, normalized 0..1 in canvas width. */
  stemX?: number;
  /** Y-position of the bar, normalized 0..1 in canvas height. */
  barY?: number;
  /** Bar thickness as fraction of canvas height. */
  barThickness?: number;
  /** Stem thickness as fraction of canvas width. */
  stemThickness?: number;
  /** Value bin of the dark T mass. */
  darkBin?: ValueBin;
  /** Value bin of the light surround. */
  lightBin?: ValueBin;
};

/**
 * Powell's "Big T" pattern. A connected dark mass forms a T (or
 * inverted T, or rotated) across the picture. Strong because:
 *   - Groups disparate darks into one shape (Gestalt closure)
 *   - The stem of the T points at the focal area
 *   - The bar anchors the composition
 */
export function bigT(canvasW: number, canvasH: number, opt: BigTOptions = {}): ValueMask {
  const stemX = (opt.stemX ?? 0.5) * canvasW;
  const barY = (opt.barY ?? 0.35) * canvasH;
  const barThick = (opt.barThickness ?? 0.18) * canvasH;
  const stemThick = (opt.stemThickness ?? 0.16) * canvasW;
  const darkBin = opt.darkBin ?? 2;
  const lightBin = opt.lightBin ?? 4;

  const at = (x: number, y: number): ValueBin => {
    // Bar: horizontal slab at barY ± barThick/2
    const inBar = Math.abs(y - barY) <= barThick / 2;
    // Stem: vertical slab at stemX ± stemThick/2, below the bar
    const inStem = Math.abs(x - stemX) <= stemThick / 2 && y >= barY;
    return inBar || inStem ? darkBin : lightBin;
  };

  // Compute shares analytically.
  const barArea = canvasW * barThick;
  const stemArea = stemThick * (canvasH - barY);
  // Subtract the overlap (already counted in bar)
  const overlap = stemThick * Math.min(barThick / 2, barY + barThick / 2 - barY);
  const darkArea = barArea + stemArea - overlap;
  const totalArea = canvasW * canvasH;
  const darkShare = darkArea / totalArea;
  const shares: Record<ValueBin, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  shares[darkBin] = darkShare;
  shares[lightBin] = 1 - darkShare;

  return { at, shares, pattern: 'big-T' };
}

// ─── Steelyard ──────────────────────────────────────────────────────────

export type SteelyardOptions = {
  /** Position of the fulcrum, normalized 0..1 in canvas width. */
  fulcrumX?: number;
  /** Position of the large mass center, normalized 0..1. */
  bigMassX?: number;
  /** Position of the small mass center, normalized 0..1. */
  smallMassX?: number;
  /** Vertical position of both masses, normalized 0..1. */
  massY?: number;
  /** Big mass radius, in canvas-width fraction. */
  bigRadius?: number;
  /** Small mass radius, in canvas-width fraction. */
  smallRadius?: number;
  /** Value bin of dark masses. */
  darkBin?: ValueBin;
  /** Value bin of light surround. */
  lightBin?: ValueBin;
};

/**
 * Edgar Payne's "Steelyard" — large dark mass on one side, small dark
 * accent on the opposite side, balanced around a fulcrum.
 *
 * The classical balance law: area_big × distance_big = area_small ×
 * distance_small (a Roman steelyard scale). This module enforces it
 * by default, computing the small mass's position from the big mass's
 * size and position.
 */
export function steelyard(canvasW: number, canvasH: number, opt: SteelyardOptions = {}): ValueMask {
  const fulcrumX = (opt.fulcrumX ?? 0.5) * canvasW;
  const bigMassX = (opt.bigMassX ?? 0.30) * canvasW;
  const massY = (opt.massY ?? 0.6) * canvasH;
  const bigRadius = (opt.bigRadius ?? 0.18) * canvasW;
  const smallRadius = (opt.smallRadius ?? 0.06) * canvasW;
  const darkBin = opt.darkBin ?? 2;
  const lightBin = opt.lightBin ?? 4;

  // Enforce steelyard law if smallMassX not provided.
  let smallMassX: number;
  if (opt.smallMassX !== undefined) {
    smallMassX = opt.smallMassX * canvasW;
  } else {
    const bigArea = Math.PI * bigRadius * bigRadius;
    const smallArea = Math.PI * smallRadius * smallRadius;
    const dBig = fulcrumX - bigMassX;
    // bigArea * dBig = smallArea * dSmall  => dSmall = bigArea * dBig / smallArea
    const dSmall = (bigArea * dBig) / smallArea;
    smallMassX = fulcrumX - dSmall;
  }

  const at = (x: number, y: number): ValueBin => {
    const dx1 = x - bigMassX;
    const dy = y - massY;
    if (dx1 * dx1 + dy * dy <= bigRadius * bigRadius) return darkBin;
    const dx2 = x - smallMassX;
    if (dx2 * dx2 + dy * dy <= smallRadius * smallRadius) return darkBin;
    return lightBin;
  };

  const totalArea = canvasW * canvasH;
  const darkArea = Math.PI * bigRadius * bigRadius + Math.PI * smallRadius * smallRadius;
  const darkShare = Math.min(0.95, darkArea / totalArea);
  const shares: Record<ValueBin, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  shares[darkBin] = darkShare;
  shares[lightBin] = 1 - darkShare;

  return { at, shares, pattern: 'steelyard' };
}

// ─── Three-spot ─────────────────────────────────────────────────────────

export type ThreeSpotOptions = {
  /** Three spot center positions, normalized to canvas. */
  spots?: [Pt, Pt, Pt];
  /** Spot radii in canvas-width fraction. */
  radii?: [number, number, number];
  /** Value bin of dark spots. */
  darkBin?: ValueBin;
  /** Value bin of light surround. */
  lightBin?: ValueBin;
};

/**
 * Three-spot — Sargent's *Carnation, Lily, Lily, Rose* lanterns: three
 * dark accents arranged in a triangle, the eye reads them as one shape
 * via Gestalt grouping.
 */
export function threeSpot(canvasW: number, canvasH: number, opt: ThreeSpotOptions = {}): ValueMask {
  const spots = opt.spots ?? [[0.30, 0.55] as Pt, [0.50, 0.40] as Pt, [0.72, 0.62] as Pt];
  const radii = opt.radii ?? [0.08, 0.09, 0.075];
  const darkBin = opt.darkBin ?? 2;
  const lightBin = opt.lightBin ?? 4;

  const cx = spots.map((p) => p[0] * canvasW);
  const cy = spots.map((p) => p[1] * canvasH);
  const r = radii.map((rr) => rr * canvasW);

  const at = (x: number, y: number): ValueBin => {
    for (let i = 0; i < 3; i++) {
      const dx = x - cx[i];
      const dy = y - cy[i];
      if (dx * dx + dy * dy <= r[i] * r[i]) return darkBin;
    }
    return lightBin;
  };

  const darkArea = r.reduce((sum, rr) => sum + Math.PI * rr * rr, 0);
  const darkShare = darkArea / (canvasW * canvasH);
  const shares: Record<ValueBin, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  shares[darkBin] = darkShare;
  shares[lightBin] = 1 - darkShare;
  return { at, shares, pattern: 'three-spot' };
}

// ─── Validation ─────────────────────────────────────────────────────────

export type NotanCheck = {
  passes: boolean;
  dominanceShare: number; // largest bin's area share
  smallestNonzeroShare: number;
  reasons: string[];
};

/**
 * Check whether a value mask passes the notan rules:
 *   - dominance > 0.5 (one bin dominates)
 *   - smallestNonzero < 0.15 (unequal — beats balance)
 */
export function checkNotan(mask: ValueMask): NotanCheck {
  const reasons: string[] = [];
  const nonzero = Object.values(mask.shares).filter((s) => s > 0);
  const dominance = nonzero.length > 0 ? Math.max(...nonzero) : 0;
  const smallestNonzero = nonzero.length > 0 ? Math.min(...nonzero) : 0;
  if (dominance < 0.5) reasons.push(`dominance ${fmt2(dominance)} < 0.5`);
  if (smallestNonzero >= 0.15) reasons.push(`smallest non-zero share ${fmt2(smallestNonzero)} >= 0.15 (too balanced)`);
  return {
    passes: reasons.length === 0,
    dominanceShare: dominance,
    smallestNonzeroShare: smallestNonzero,
    reasons,
  };
}
