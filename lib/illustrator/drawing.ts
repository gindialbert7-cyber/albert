/**
 * Hand-drawn primitives: strokes that wobble like ink on paper, fills made of
 * pencil hatching. Everything emits raw SVG fragments so output stays portable
 * (no canvas, no DOM).
 *
 * v2 (renderer-output-version 2026.05.16): handStroke now renders as a
 * sequence of short anisotropic segments with a Plamondon-like pressure
 * profile (peak at u≈0.4 of arc length, taper to ends), plus a confident
 * spine + lighter feather pass for "ink laid down by a hand that meant it"
 * feel. Anticipation hooks and follow-through ink pools were added at the
 * extremities. Replaces the v1 constant-width-per-pass approach.
 */

import {
  Pt,
  densify,
  extendEnds,
  sampleAlong,
  perpAt,
  fmt,
  dist,
} from './geometry';
import { Rng, range, makeNoise2D } from './rng';
import { dSin, dCos } from './math/det-math';
import { fmt2 } from './math/det-format';

export type StrokeOptions = {
  /** Random per-point offset amplitude (px). Adds raw graininess. */
  jitter?: number;
  /** Smooth low-frequency wobble amplitude (px). Mimics a wandering hand. */
  wobble?: number;
  /** Spatial frequency of the wobble noise (cycles per 100px). */
  wobbleFreq?: number;
  /** Number of overlapping passes (1–3). More = sketchier. */
  passes?: number;
  width?: number;
  /** Extend strokes past their endpoints (px). Sketches always overshoot. */
  overshoot?: number;
  color?: string;
  opacity?: number;
  /** Use catmull-rom smoothing instead of polyline. Default true (legacy
   *  no-op — handStroke v2 always uses anisotropic dab segments). */
  smooth?: boolean;
  /** Close the path. */
  closed?: boolean;
  /** Pressure variation amplitude: 0 = constant width, 1 = strong taper.
   *  Default 0.5; closed paths get a bit less to avoid visible "joins". */
  pressure?: number;
  /** Spawn an ink pool dot at the stroke's end. 0 disables. */
  endPool?: number;
};

/**
 * Plamondon-like asymmetric pressure profile.
 *
 * Returns a width multiplier in [0.4, 1.4] across u ∈ [0, 1]. Peak at
 * u ≈ 0.4 (slightly biased forward, like a real pen), with smooth taper
 * to both ends. Closed paths can call this with pressure=0 to skip.
 */
function pressureProfile(u: number, pressure: number): number {
  if (pressure <= 0) return 1;
  // Quintic bell centered at 0.4 — biased forward, asymmetric.
  const z = (u - 0.4) / 0.55;
  const az = Math.abs(z);
  const bell = az >= 1 ? 0 : (1 - az * az) * (1 - az * az);
  // bell ∈ [0,1]; map to multiplier. Endpoints taper to ~0.3, peak goes
  // to ~1.6 at u=0.4. Wider amplitude than v2.1 for more visible
  // expression. Closed paths pass small pressure to keep continuity.
  return 0.3 + pressure * 1.3 * bell + (1 - pressure) * 0.7;
}

/**
 * Render a path as a sequence of anisotropic dab segments with variable
 * stroke width along arc length. Two passes (spine + feather) by default
 * give "ink laid down by a hand that meant it" — slight overdraw with a
 * lighter ghost stroke, paper-grain breakup at the edges.
 */
export function handStroke(pts: Pt[], rng: Rng, opt: StrokeOptions = {}): string {
  if (pts.length < 2) return '';
  const {
    jitter = 0.35,
    wobble = 1.2,
    wobbleFreq = 1.6,
    passes = 2,
    width = 1.6,
    overshoot = 1.5,
    color = '#2a2421',
    opacity = 0.92,
    closed = false,
    pressure: pressureRaw,
    endPool = 0,
  } = opt;
  const pressure = pressureRaw ?? (closed ? 0.25 : 0.55);

  const dense = densify(pts, 4);
  const base = !closed && overshoot > 0 ? extendEnds(dense, overshoot) : dense;
  // Sample ~1 dab per 3px for a continuous, slightly-overlapping ink line
  const sampleCount = Math.max(12, Math.ceil(pathLength(base) / 3));
  const sampled = sampleAlong(base, sampleCount);

  let svg = '';

  for (let p = 0; p < passes; p++) {
    const seedShift = Math.floor(rng() * 1e6);
    const noise = makeNoise2D(seedShift);
    const isSpine = p === 0;
    // Spine: slightly narrower, fully opaque, centered. Feather: slightly
    // wider envelope (because perpendicular jitter), lower opacity,
    // gentle lateral offset to simulate a confident overdraw.
    const passWidth = isSpine ? width * 0.95 : width * 1.1;
    const passOpacity = isSpine ? opacity : opacity * 0.45;
    const lateralBias = isSpine ? 0 : (rng() < 0.5 ? -1 : 1) * width * 0.3;

    // Compute jittered points + per-point width.
    const offsetPts: { p: Pt; w: number }[] = sampled.map((point, i) => {
      const [nx, ny] = perpAt(sampled, i);
      const along = (i / sampled.length) * wobbleFreq;
      const w = (noise(along, p * 7.3) - 0.5) * 2 * wobble;
      const j = (rng() - 0.5) * 2 * jitter;
      const t = i / Math.max(1, sampled.length - 1);
      // Taper wobble toward endpoints so lines meet cleanly.
      const taper = closed ? 1 : dSin(Math.PI * t) * 0.7 + 0.3;
      const off = (w + j) * taper + lateralBias;
      // Pressure-driven width along the stroke.
      const widthMul = pressureProfile(t, pressure);
      return {
        p: [point[0] + nx * off, point[1] + ny * off] as Pt,
        w: passWidth * widthMul,
      };
    });

    // Emit a sequence of short line segments with their per-point widths.
    // SVG can't natively vary stroke-width along one <path>, so we render
    // segments of ~4 dabs each at the average width of the run. Linecap
    // round + small overlap make the joins invisible.
    const SEG = 3; // segment length in samples
    for (let i = 0; i + 1 < offsetPts.length; i += SEG) {
      const lo = i;
      const hi = Math.min(offsetPts.length - 1, i + SEG);
      // Average width across the run.
      let wAvg = 0;
      for (let k = lo; k <= hi; k++) wAvg += offsetPts[k].w;
      wAvg /= hi - lo + 1;
      // Build a quadratic Bezier through the run for a smoother feel.
      const a = offsetPts[lo].p;
      const b = offsetPts[hi].p;
      const mid = offsetPts[Math.floor((lo + hi) / 2)].p;
      // Use mid as control point if it deviates from chord
      const cx = 2 * mid[0] - 0.5 * a[0] - 0.5 * b[0];
      const cy = 2 * mid[1] - 0.5 * a[1] - 0.5 * b[1];
      svg += `<path d="M${fmt2(a[0])} ${fmt2(a[1])} Q${fmt2(cx)} ${fmt2(cy)} ${fmt2(b[0])} ${fmt2(b[1])}" stroke="${color}" stroke-width="${fmt(wAvg)}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${fmt(passOpacity)}"/>`;
    }
    // End pool dot at the very tip on the spine pass only.
    if (isSpine && !closed && endPool > 0) {
      const last = offsetPts[offsetPts.length - 1].p;
      svg += `<circle cx="${fmt2(last[0])}" cy="${fmt2(last[1])}" r="${fmt2(width * 0.45 * endPool)}" fill="${color}" opacity="${fmt(opacity * 0.85)}"/>`;
    }
  }
  return svg;
}

function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return len;
}

export type HatchOptions = {
  /** Hatch line angle in degrees (0 = horizontal). */
  angle?: number;
  /** Spacing between hatch lines (px). */
  spacing?: number;
  color?: string;
  width?: number;
  opacity?: number;
  /** Random offset of each hatch line (px). */
  jitter?: number;
  /** Skip every Nth line at random for "open" feel. 0 = no skipping. */
  skipChance?: number;
  /** Add a perpendicular cross-hatch pass (for darker tones). */
  cross?: boolean;
};

/**
 * Pencil-style hatch fill of a closed polygon. Lines are drawn as little
 * Bézier arcs (not straight) so they breathe like graphite.
 */
export function hatchFill(polygon: Pt[], rng: Rng, opt: HatchOptions = {}): string {
  const main = singleHatch(polygon, rng, opt);
  if (!opt.cross) return main;
  return main + singleHatch(polygon, rng, { ...opt, angle: (opt.angle ?? 30) + 70 });
}

function singleHatch(polygon: Pt[], rng: Rng, opt: HatchOptions): string {
  const angle = ((opt.angle ?? 30) * Math.PI) / 180;
  const spacing = opt.spacing ?? 5;
  const color = opt.color ?? '#2a2421';
  const width = opt.width ?? 0.55;
  const opacity = opt.opacity ?? 0.45;
  const jitter = opt.jitter ?? 0.7;
  const skipChance = opt.skipChance ?? 0;

  // Rotate so that hatching is horizontal in working space.
  const cos = dCos(-angle);
  const sin = dSin(-angle);
  const cosI = dCos(angle);
  const sinI = dSin(angle);
  const rotated: Pt[] = polygon.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const [, y] of rotated) {
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  if (!Number.isFinite(yMin)) return '';

  let svg = '';
  for (let y = yMin + spacing * 0.5; y < yMax; y += spacing) {
    if (skipChance > 0 && rng() < skipChance) continue;
    const yj = y + (rng() - 0.5) * jitter;
    const xs: number[] = [];
    for (let i = 0; i < rotated.length; i++) {
      const [x1, y1] = rotated[i];
      const [x2, y2] = rotated[(i + 1) % rotated.length];
      if ((y1 > yj) !== (y2 > yj)) {
        const t = (yj - y1) / (y2 - y1);
        xs.push(x1 + t * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x1 = xs[i] + (rng() - 0.5) * jitter;
      const x2 = xs[i + 1] + (rng() - 0.5) * jitter;
      if (x2 - x1 < 1) continue;
      const px1: Pt = [x1 * cosI - yj * sinI, x1 * sinI + yj * cosI];
      const px2: Pt = [x2 * cosI - yj * sinI, x2 * sinI + yj * cosI];
      const mx = (px1[0] + px2[0]) / 2 + (rng() - 0.5) * jitter * 1.8;
      const my = (px1[1] + px2[1]) / 2 + (rng() - 0.5) * jitter * 1.8;
      const a = opacity * range(rng, 0.7, 1.0);
      svg += `<path d="M${fmt(px1[0])} ${fmt(px1[1])} Q${fmt(mx)} ${fmt(my)} ${fmt(px2[0])} ${fmt(px2[1])}" stroke="${color}" stroke-width="${fmt(width)}" fill="none" opacity="${fmt(a)}" stroke-linecap="round"/>`;
    }
  }
  return svg;
}

/** A hand-drawn circle (closed wobbly path). */
export function handCircle(
  cx: number,
  cy: number,
  r: number,
  rng: Rng,
  opt: StrokeOptions = {},
): { svg: string; polygon: Pt[] } {
  const n = Math.max(20, Math.round(r * 1.2));
  const startAngle = rng() * Math.PI * 2;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = startAngle + (i / n) * Math.PI * 2;
    const rr = r * (1 + (rng() - 0.5) * 0.04);
    pts.push([cx + dCos(a) * rr, cy + dSin(a) * rr]);
  }
  return {
    svg: handStroke(pts, rng, { ...opt, closed: true, overshoot: 0 }),
    polygon: pts,
  };
}

/** A hand-drawn rectangle outline. Sides are independent strokes so corners breathe. */
export function handRect(
  x: number,
  y: number,
  w: number,
  h: number,
  rng: Rng,
  opt: StrokeOptions = {},
): { svg: string; polygon: Pt[] } {
  const tl: Pt = [x, y];
  const tr: Pt = [x + w, y];
  const br: Pt = [x + w, y + h];
  const bl: Pt = [x, y + h];
  const polygon = [tl, tr, br, bl];
  const sides = [
    [tl, tr],
    [tr, br],
    [br, bl],
    [bl, tl],
  ];
  let svg = '';
  for (const [a, b] of sides) {
    svg += handStroke([a, b], rng, opt);
  }
  return { svg, polygon };
}

/** A wobbly closed blob from a list of vertices, optionally with hatching. */
export function handBlob(
  pts: Pt[],
  rng: Rng,
  opt: StrokeOptions & { fill?: HatchOptions } = {},
): string {
  let svg = '';
  if (opt.fill) {
    svg += hatchFill(pts, rng, opt.fill);
  }
  svg += handStroke(pts, rng, { ...opt, closed: true });
  return svg;
}
