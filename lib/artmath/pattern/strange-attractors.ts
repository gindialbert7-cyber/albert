/**
 * Strange attractors — chaotic dynamical systems rendered as point
 * clouds.
 *
 * A strange attractor is the limit set of a chaotic system: starting
 * from almost any initial condition, the orbit converges onto a
 * fractal subset of phase space. Plotted as a point cloud, an attractor
 * produces elegant flowing forms that no human could draw by hand but
 * look astonishingly organic — flowers, smoke, butterflies, neural
 * cross-sections.
 *
 * Built-in attractors:
 *   - 'clifford'  Clifford Pickover, 1989. Smooth, calligraphic.
 *     x_{n+1} = sin(a*y) + c*cos(a*x)
 *     y_{n+1} = sin(b*x) + d*cos(b*y)
 *   - 'dejong'    Peter de Jong. Tighter, more sinewy.
 *     x_{n+1} = sin(a*y) − cos(b*x)
 *     y_{n+1} = sin(c*x) − cos(d*y)
 *   - 'svensson'  Johnny Svensson. Wispy, plant-like.
 *     x_{n+1} = d*sin(a*x) − sin(b*y)
 *     y_{n+1} = c*cos(a*x) + cos(b*y)
 *
 * Output is a list of (x, y) sample points, ready to be scattered as
 * SVG dots or used to build a density-fill image.
 *
 * Sources:
 *   - Pickover 1989, "Computers, Pattern, Chaos and Beauty"
 *   - Sprott 1993, "Strange Attractors: Creating Patterns in Chaos"
 *   - Svensson, various plotter-art works (Mathieu Svensson)
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';

export type AttractorKind = 'clifford' | 'dejong' | 'svensson';

export type AttractorParams = {
  a: number;
  b: number;
  c: number;
  d: number;
};

/** A few hand-picked parameter sets that give pleasant, well-spread
 *  attractors. (Random parameters often collapse to a small set.) */
export const ATTRACTOR_PRESETS: Record<string, { kind: AttractorKind; params: AttractorParams }> = {
  cliffordA:   { kind: 'clifford', params: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 } },
  cliffordB:   { kind: 'clifford', params: { a: -1.7, b: 1.3, c: -0.1, d: -1.21 } },
  cliffordC:   { kind: 'clifford', params: { a: 1.5, b: -1.8, c: 1.6, d: 0.9 } },
  dejongA:     { kind: 'dejong',   params: { a: -2.0, b: -2.0, c: -1.2, d: 2.0 } },
  dejongB:     { kind: 'dejong',   params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 } },
  dejongC:     { kind: 'dejong',   params: { a: 2.01, b: -2.53, c: 1.61, d: -0.33 } },
  svenssonA:   { kind: 'svensson', params: { a: 1.4, b: 1.56, c: 1.4, d: -6.56 } },
  svenssonB:   { kind: 'svensson', params: { a: -2.337, b: -2.337, c: 0.533, d: 1.378 } },
};

export type AttractorOptions = {
  preset?: keyof typeof ATTRACTOR_PRESETS;
  /** Override kind + params explicitly. */
  kind?: AttractorKind;
  params?: AttractorParams;
  /** Number of iteration samples. 50000+ for dense images. Default 60000. */
  iterations?: number;
  /** Initial state; chaos converges from almost anywhere. */
  x0?: number;
  y0?: number;
  /** Burn-in iterations to discard at start. Default 100. */
  burnIn?: number;
};

/** Iterate an attractor and return the visited (x, y) points. */
export function iterateAttractor(opts: AttractorOptions): Float64Array {
  const preset = opts.preset ? ATTRACTOR_PRESETS[opts.preset] : ATTRACTOR_PRESETS.cliffordA;
  const kind = opts.kind ?? preset.kind;
  const params = opts.params ?? preset.params;
  const iterations = opts.iterations ?? 60000;
  const burnIn = opts.burnIn ?? 100;
  let x = opts.x0 ?? 0.1;
  let y = opts.y0 ?? 0.1;

  const out = new Float64Array(iterations * 2);
  let cursor = 0;

  for (let i = 0; i < iterations + burnIn; i++) {
    let nx = 0;
    let ny = 0;
    switch (kind) {
      case 'clifford':
        nx = dSin(params.a * y) + params.c * dCos(params.a * x);
        ny = dSin(params.b * x) + params.d * dCos(params.b * y);
        break;
      case 'dejong':
        nx = dSin(params.a * y) - dCos(params.b * x);
        ny = dSin(params.c * x) - dCos(params.d * y);
        break;
      case 'svensson':
        nx = params.d * dSin(params.a * x) - dSin(params.b * y);
        ny = params.c * dCos(params.a * x) + dCos(params.b * y);
        break;
    }
    x = nx;
    y = ny;
    if (i >= burnIn) {
      out[cursor++] = x;
      out[cursor++] = y;
    }
  }
  return out;
}

/** Compute the bounding box of a point cloud. */
export function attractorBounds(pts: Float64Array): {
  minX: number; minY: number; maxX: number; maxY: number;
} {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i];
    const y = pts[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Render attractor as fixed-size dots. For dense output (5000+ points
 *  per cm²) consider rasterizing into a density map instead — but for
 *  SVG-first delivery the dot field is what we ship. */
export function attractorSvg(
  pts: Float64Array,
  opts: {
    width: number;
    height: number;
    /** Padding in pixels. */
    padding?: number;
    /** Dot radius. Use ~0.4 px for dense art. */
    dotR?: number;
    /** Fill color. */
    color?: string;
    /** Opacity per dot. Low values (0.05-0.15) accumulate into density. */
    opacity?: number;
    /** Sample every Nth point (to keep SVG small). 1 = all. */
    sampleEvery?: number;
  },
): string {
  const pad = opts.padding ?? 20;
  const dotR = opts.dotR ?? 0.5;
  const color = opts.color ?? '#39312a';
  const op = opts.opacity ?? 0.10;
  const step = opts.sampleEvery ?? 1;

  const { minX, minY, maxX, maxY } = attractorBounds(pts);
  const w = opts.width - 2 * pad;
  const h = opts.height - 2 * pad;
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  const sx = w / dx;
  const sy = h / dy;
  const s = Math.min(sx, sy); // preserve aspect

  let svg = '';
  for (let i = 0; i < pts.length; i += 2 * step) {
    const px = pad + (pts[i] - minX) * s;
    const py = pad + (pts[i + 1] - minY) * s;
    svg += `<circle cx="${fmt2(px)}" cy="${fmt2(py)}" r="${fmt2(dotR)}" fill="${color}" opacity="${fmt2(op)}"/>`;
  }
  return svg;
}
