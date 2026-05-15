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

/** Render a closed polygon as a watercolor wash. Returns SVG fragment. */
export function watercolorWash(
  polygon: Pt[],
  rng: Rng,
  opt: WashOptions,
): string {
  const { color, opacity = 0.55, edge = 0.18, bleed = 4, rimCoverage = 0.7 } = opt;

  // Compute centroid for inflate/deflate operations.
  let cx = 0;
  let cy = 0;
  for (const [x, y] of polygon) {
    cx += x;
    cy += y;
  }
  cx /= polygon.length;
  cy /= polygon.length;

  const noise = makeNoise2D(Math.floor(rng() * 1e6));

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
  const rim = wobble(-0.6, 7, 0.5);

  let svg = '';
  // 1) outer glow — very faint
  svg += `<path d="${smoothPath(glow, true)}" fill="${color}" opacity="${fmt(
    opacity * 0.32,
  )}" stroke="none"/>`;
  // 2) main wash
  svg += `<path d="${smoothPath(main, true)}" fill="${color}" opacity="${fmt(
    opacity,
  )}" stroke="none"/>`;
  // 3) wet-edge rim, drawn as a partial stroke for asymmetric pooling
  const darkenedColor = darken(color, edge);
  const rimPath = smoothPath(rim, true);
  // Use stroke-dasharray to get partial coverage that wraps the path.
  const dash = Math.max(8, Math.floor(polygon.length * 4 * rimCoverage));
  const gap = Math.max(4, Math.floor(polygon.length * 4 * (1 - rimCoverage)));
  svg += `<path d="${rimPath}" fill="none" stroke="${darkenedColor}" stroke-width="${fmt(
    1.2 + bleed * 0.15,
  )}" opacity="${fmt(
    opacity * 0.65,
  )}" stroke-linecap="round" stroke-dasharray="${dash} ${gap}"/>`;
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
