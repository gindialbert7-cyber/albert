/**
 * Phyllotaxis — golden-angle spiral arrangements found throughout nature.
 *
 * Helmut Vogel's 1979 formula models the optimal packing of seeds in a
 * sunflower head, scales on a pinecone, or florets in the heart of a
 * daisy: each seed is placed at angle k·137.5° (the golden angle) and
 * radius √k, generating the iconic interlocking Fibonacci spirals.
 *
 *   x_k = √k · cos(k · golden_angle)
 *   y_k = √k · sin(k · golden_angle)
 *
 * One angle, one parameter — produces patterns that humans recognize
 * as inherently "alive" because they are: the rule by which actual
 * sunflowers grow.
 *
 * Sources:
 *   - Vogel 1979, "A better way to construct the sunflower head"
 *   - Adler, Barabe, Jean 1997, "A history of the study of phyllotaxis"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos, dAtan2 } from '../../illustrator/math/det-math';
import { mulberry32 } from '../../illustrator/rng';

/** The golden angle, in radians: 2π · (1 - 1/φ) = π · (3 - √5). */
export const GOLDEN_ANGLE = 2.39996322972865332;

export type PhyllotaxisOptions = {
  /** Number of seeds. Common ranges: 50-200 for daisies, 500-1500 for sunflowers. */
  count: number;
  /** Radial scale factor in pixels. Final radius is `scale · √k`. Default 8. */
  scale?: number;
  /** Inner radius offset (skips the dense center). Default 0. */
  innerRadius?: number;
  /** Angle offset for the whole spiral, radians. Default 0. */
  angleOffset?: number;
  /** Skip every Nth seed to thin the pattern (Fibonacci sub-spirals
   *  emerge at N=3, 5, 8, 13, 21...). Default 1 (full pattern). */
  skip?: number;
};

export type Seed = {
  x: number;
  y: number;
  index: number;
  radius: number;
};

/** Compute phyllotaxis seed positions (relative to origin). */
export function phyllotaxis(opts: PhyllotaxisOptions): Seed[] {
  const scale = opts.scale ?? 8;
  const inner = opts.innerRadius ?? 0;
  const offset = opts.angleOffset ?? 0;
  const skip = opts.skip ?? 1;
  const out: Seed[] = [];
  for (let k = 1; k <= opts.count; k++) {
    if ((k % skip) !== 0) continue;
    const angle = k * GOLDEN_ANGLE + offset;
    const r = scale * Math.sqrt(k) + inner;
    out.push({
      x: r * dCos(angle),
      y: r * dSin(angle),
      index: k,
      radius: r,
    });
  }
  return out;
}

/** Render seeds as a sunflower-head image. */
export function phyllotaxisSvg(
  seeds: Seed[],
  opts: {
    cx: number;
    cy: number;
    /** Seed dot radius. If a function, called per seed with its index. */
    dotR?: number | ((seed: Seed) => number);
    /** Fill color. If a function, called per seed. */
    color?: string | ((seed: Seed) => string);
    /** Optional ring count to color seeds by radial band. */
    rings?: number;
    palette?: string[];
  },
): string {
  const cx = opts.cx;
  const cy = opts.cy;
  const dotR = opts.dotR ?? 2.5;
  const color = opts.color ?? '#39312a';
  let maxR = 0;
  for (const s of seeds) {
    if (s.radius > maxR) maxR = s.radius;
  }
  let svg = '';
  for (const s of seeds) {
    const r = typeof dotR === 'function' ? dotR(s) : dotR;
    let c: string;
    if (typeof color === 'function') {
      c = color(s);
    } else if (opts.rings && opts.palette && opts.palette.length > 0) {
      const band = Math.min(opts.rings - 1, Math.floor((s.radius / maxR) * opts.rings));
      c = opts.palette[band % opts.palette.length];
    } else {
      c = color;
    }
    svg += `<circle cx="${fmt2(cx + s.x)}" cy="${fmt2(cy + s.y)}" r="${fmt2(r)}" fill="${c}"/>`;
  }
  return svg;
}

/** Render seeds as an elliptical-petal arrangement (daisy / artichoke). */
export function phyllotaxisPetals(
  seeds: Seed[],
  opts: {
    cx: number;
    cy: number;
    petalRx: number;
    petalRy: number;
    color: string | ((seed: Seed) => string);
    /** Should outer petals be larger than inner? Default true. */
    sizeByRadius?: boolean;
    /** Seed for per-petal jitter. */
    seed?: number;
  },
): string {
  const rng = mulberry32(opts.seed ?? 0xfeed);
  const sizeByRadius = opts.sizeByRadius ?? true;
  let maxR = 0;
  for (const s of seeds) {
    if (s.radius > maxR) maxR = s.radius;
  }
  let svg = '';
  for (const s of seeds) {
    const angle = dAtan2(s.y, s.x);
    const scale = sizeByRadius ? Math.min(1, 0.4 + (s.radius / maxR) * 0.8) : 1;
    const rx = opts.petalRx * scale;
    const ry = opts.petalRy * scale;
    const cx = opts.cx + s.x;
    const cy = opts.cy + s.y;
    const c = typeof opts.color === 'function' ? opts.color(s) : opts.color;
    const jitter = (rng() - 0.5) * 0.15;
    svg += `<ellipse cx="${fmt2(cx)}" cy="${fmt2(cy)}" rx="${fmt2(rx)}" ry="${fmt2(ry)}" fill="${c}" transform="rotate(${fmt2(((angle + jitter) * 180) / Math.PI)} ${fmt2(cx)} ${fmt2(cy)})"/>`;
  }
  return svg;
}
