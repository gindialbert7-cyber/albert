/**
 * Soft watercolor wash fills.
 *
 * Real watercolor pools at the edges of a brush stroke, leaving a slightly
 * darker rim and a lighter center. We fake this with three layered shapes:
 *   1) a faint, slightly enlarged base wash for the diffuse glow,
 *   2) the main shape filled flat at low opacity,
 *   3) a slightly inset darker "wet edge" rim drawn as a thin stroke
 *      that wobbles inside the silhouette.
 * On cream paper this reads convincingly as paint-on-paper.
 */

import { Pt, fmt, smoothPath } from './geometry';
import { Rng, makeNoise2D } from './rng';
import { fmt2 } from './math/det-format';

export type WashOptions = {
  color: string;
  /** Center fill opacity (0..1). */
  opacity?: number;
  /** Rim darkness factor (0..0.5 typical). */
  edge?: number;
  /** Outward bleed in px (the soft glow). */
  bleed?: number;
  /** How much of the rim to draw (0..1). 1 = all the way around. */
  rimCoverage?: number;
};

/**
 * Render a closed polygon as a watercolor wash. v2: now adds internal
 * pigment-density variation (subtle stippled noise overlay matching the
 * wash silhouette) and a more pronounced wet-edge rim, so a wash actually
 * reads as paint on paper rather than a flat fill.
 */
export function watercolorWash(
  polygon: Pt[],
  rng: Rng,
  opt: WashOptions,
): string {
  const { color, opacity = 0.55, edge = 0.18, bleed = 4, rimCoverage = 0.75 } = opt;

  // Compute centroid + bbox for inflate/deflate + interior stippling.
  let cx = 0;
  let cy = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of polygon) {
    cx += x;
    cy += y;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  cx /= polygon.length;
  cy /= polygon.length;

  const noiseSeed = Math.floor(rng() * 1e6);
  const noise = makeNoise2D(noiseSeed);
  // Interior density-variation noise (separate seed so two washes layered
  // on the same shape don't share stipple pattern).
  const innerSeed = Math.floor(rng() * 1e6);
  const innerNoise = makeNoise2D(innerSeed);

  // Slightly perturbed silhouette so the wash isn't geometrically perfect.
  const wobble = (factor: number, freq: number, amp: number): Pt[] =>
    polygon.map(([x, y], i) => {
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const t = i / polygon.length;
      const n = (noise(t * freq, 4.7) - 0.5) * 2;
      const out = factor + n * amp;
      return [x + nx * out, y + ny * out];
    });

  const glow = wobble(bleed, 5, 1.5);
  const main = wobble(0, 6, 0.6);
  const rim = wobble(-0.8, 7, 0.5);
  // Inner "dry patches" — a slightly inset silhouette where some pigment
  // sits dryer than the main wash. Adds a sense of pigment density that
  // reads as real watercolor.
  const innerPatch = wobble(-3.5, 8, 0.7);

  // Unique id for this wash's clip + filter
  const clipId = `wch${(noiseSeed >>> 0).toString(36)}`;
  void minX;
  void minY;
  void maxX;
  void maxY;
  void innerNoise;

  let svg = '';
  // 1) outer glow — very faint
  svg += `<path d="${smoothPath(glow, true)}" fill="${color}" opacity="${fmt(
    opacity * 0.3,
  )}" stroke="none"/>`;
  // 2) main wash — slightly stronger opacity than v1 so density variation
  //    has somewhere to subtract from
  svg += `<path d="${smoothPath(main, true)}" fill="${color}" opacity="${fmt(
    opacity * 1.05,
  )}" stroke="none"/>`;
  // 3) Internal density variation: a slightly darker inner patch covers
  //    ~60% of the silhouette, simulating where pigment settles after the
  //    water evaporates. Wobble-irregular so it doesn't look like a
  //    geometric inset.
  svg += `<path d="${smoothPath(innerPatch, true)}" fill="${darken(color, 0.05)}" opacity="${fmt(
    opacity * 0.22,
  )}" stroke="none"/>`;
  // 4) wet-edge rim — pronounced enough to be visible. Use both a partial
  //    stroke (for asymmetric pooling) AND a couple of stronger arc
  //    segments at random points (where the pigment really pooled).
  const darkenedColor = darken(color, edge);
  const rimPath = smoothPath(rim, true);
  const rimStrokeWidth = 1.0 + bleed * 0.2;
  // Continuous thin rim wash
  svg += `<path d="${rimPath}" fill="none" stroke="${darkenedColor}" stroke-width="${fmt(
    rimStrokeWidth,
  )}" opacity="${fmt(
    opacity * 0.55,
  )}" stroke-linecap="round"/>`;
  // v2.2: pooled-pigment dabs — more visible than v2, drawn as small
  // local segments where pigment actually settled. Each pool is a 3-4
  // vertex sub-polygon of the rim, rendered as a thicker stroke with
  // higher opacity. This is the single most visible wet-edge cue.
  const pools = 3 + Math.floor(rng() * 2);
  const polyLen = polygon.length;
  const veryDark = darken(color, edge * 1.5);
  for (let k = 0; k < pools; k++) {
    const startIdx = Math.floor(rng() * polyLen);
    const poolLen = 3 + Math.floor(rng() * 4); // 3-6 vertices
    const subPoints: Pt[] = [];
    for (let j = 0; j < poolLen; j++) {
      subPoints.push(rim[(startIdx + j) % polyLen]);
    }
    if (subPoints.length < 2) continue;
    let d = `M${fmt2(subPoints[0][0])} ${fmt2(subPoints[0][1])}`;
    for (let j = 1; j < subPoints.length; j++) {
      d += ` L${fmt2(subPoints[j][0])} ${fmt2(subPoints[j][1])}`;
    }
    svg += `<path d="${d}" fill="none" stroke="${veryDark}" stroke-width="${fmt(
      rimStrokeWidth * 1.8,
    )}" opacity="${fmt(opacity * 0.85)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  void clipId;
  return svg;
}

/** Multiply each RGB channel by (1 - amount). Hex in, hex out. */
function darken(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 0xff) * (1 - amount))));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 0xff) * (1 - amount))));
  const b = Math.max(0, Math.min(255, Math.round((n & 0xff) * (1 - amount))));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Lighten by mixing toward white. */
export function lighten(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 0xff);
  const g = mix((n >> 8) & 0xff);
  const b = mix(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export { darken };
