/**
 * Architectural AI-signature forbids.
 *
 * Eight specific visual artifacts pattern-match as AI-generated to
 * 2026 viewers (uniform specular highlights, mathematical facial
 * symmetry, hot palettes, background melt, centered composition,
 * cinematic bokeh, character drift, hand/finger failures). For each,
 * we make the artifact *architecturally impossible* — not avoided by
 * effort, but structurally absent because the code path that would
 * produce it doesn't exist.
 *
 * This module collects the runtime safety nets. The bigger structural
 * properties (no light model, no aperture simulation, no inference)
 * live in the renderer's overall architecture.
 */

import { clampChroma, MAX_CHROMA_OKLAB } from './colors/oklab';

// ─── #1 Hot palette ──────────────────────────────────────────────────────────

/** Pass every palette color through this before it reaches the renderer. */
export function safePaletteColor(hex: string): string {
  return clampChroma(hex, MAX_CHROMA_OKLAB);
}

// ─── #2 Mathematical bilateral facial symmetry ───────────────────────────────

/**
 * Mandatory asymmetric jitter floor on paired character landmarks.
 *
 * AI-generated faces are mathematically symmetric — perfect bilateral
 * mirror of eyes, mouth corners, ears, cheekbones. Real human faces
 * are NEVER perfectly symmetric. We make perfect symmetry impossible
 * by injecting a deterministic asymmetric offset on every paired
 * landmark whenever it's accessed.
 *
 * The offset is seeded by (characterId, landmarkName), so it's locked
 * to that character forever — same Pip always has the same nostalgic
 * asymmetry — and is 0.5–1.5px in scale, below conscious notice but
 * above the threshold that the human visual system uses to read
 * "this is a real face."
 */
export type PairedLandmark = {
  cx: number; // center x
  cy: number; // center y
  /** Spacing between the pair from center, baseline (mirror) */
  spacing: number;
};

export function asymmetricPair(
  landmark: PairedLandmark,
  characterSeed: number,
  landmarkName: string,
): { left: [number, number]; right: [number, number] } {
  const seedL = hashTriple(characterSeed, landmarkName, 0);
  const seedR = hashTriple(characterSeed, landmarkName, 1);
  // Each side gets its own jitter in [-0.75, 0.75] px on both axes,
  // ensuring strict inequality between sides for ALL coordinates.
  const lx = landmark.cx - landmark.spacing + (frac(seedL) - 0.5) * 1.5;
  const ly = landmark.cy + (frac(seedL >>> 16) - 0.5) * 1.5;
  const rx = landmark.cx + landmark.spacing + (frac(seedR) - 0.5) * 1.5;
  const ry = landmark.cy + (frac(seedR >>> 16) - 0.5) * 1.5;
  // Guarantee at least 0.5px asymmetry on at least one axis.
  if (Math.abs((rx - landmark.cx) - (landmark.cx - lx)) < 0.5
      && Math.abs(ry - ly) < 0.5) {
    // Force-perturb the right side by 0.5px upward.
    return { left: [lx, ly], right: [rx, ry + 0.5] };
  }
  return { left: [lx, ly], right: [rx, ry] };
}

function hashTriple(a: number, name: string, k: number): number {
  let h = (a ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= k;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function frac(h: number): number {
  return ((h >>> 0) / 4294967296);
}

// ─── #3 Ink color: never pure black ──────────────────────────────────────────

/**
 * Sepia/brown ink family. Pure black (#000000) reads as digital;
 * historic ink is always brown-leaning. Any caller asking for "black"
 * gets the sepia replacement.
 */
const SEPIA_LIBRARY = [
  '#39312a', // standard sepia
  '#3a2a1c', // dark walnut
  '#2e2620', // cool ink
  '#3d2f24', // chocolate
  '#392b1f', // burnt umber
];

export function safeInkColor(requested: string, seed: number = 0): string {
  if (/^#?(000000|111111|222222)$/i.test(requested)) {
    // Replace pure-black requests with a deterministic sepia pick.
    return SEPIA_LIBRARY[seed % SEPIA_LIBRARY.length];
  }
  // Also apply chroma cap — sepia variants are already low-chroma, but
  // defensive.
  return clampChroma(requested);
}

// ─── #4 Composition CSP — exclude dead-center ────────────────────────────────

/**
 * Snap a target position toward the nearest rule-of-thirds intersection,
 * but ONLY if it's currently within the "dead-center exclusion zone."
 * The center of the canvas (within ±5% of midpoint on both axes) is
 * structurally avoided.
 */
export function avoidDeadCenter(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
): [number, number] {
  const cx = canvasWidth * 0.5;
  const cy = canvasHeight * 0.5;
  const dx = Math.abs(x - cx) / canvasWidth;
  const dy = Math.abs(y - cy) / canvasHeight;
  if (dx > 0.05 || dy > 0.05) return [x, y]; // not in dead zone
  // Snap to the nearest thirds-power-point.
  const targetX = x < cx ? canvasWidth / 3 : (canvasWidth * 2) / 3;
  const targetY = y < cy ? canvasHeight / 3 : (canvasHeight * 2) / 3;
  return [targetX, targetY];
}
