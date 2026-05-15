/**
 * Curl-noise flow fields — divergence-free vector fields for particle
 * advection in the style of Tyler Hobbs' "Fidenza" and the broader
 * generative-art tradition.
 *
 * Theory: a noise field N(x, y) is a scalar. Its curl is a 2D rotation:
 *     v(x, y) = (∂N/∂y, -∂N/∂x).
 * That vector field is divergence-free, so particles advected along it
 * trace streamlines that do not cluster or diverge — they thread elegantly
 * through the canvas like ink in still water. Repeated stepping from a
 * lattice of seed points produces the trademark "swirled hairlines" look.
 *
 * Implementation notes:
 *   - Deterministic value noise from `makeNoise2D` (no Perlin gradient
 *     hashing required for our visual goal).
 *   - Curl approximated via central finite difference at a small ε.
 *   - Particles step using Euler integration; for our line lengths and
 *     step sizes the integration error is invisible compared to the
 *     organic-stochastic styling we apply on top.
 *   - Collision avoidance: a coarse occupancy grid prevents streamlines
 *     from crossing within a configurable margin (the "non-overlap"
 *     parameter that gives Fidenza its serene composition).
 *
 * Sources:
 *   - Bridson, Hourihan, Nordenstam 2007, "Curl-Noise for Procedural
 *     Fluid Flow"
 *   - Hobbs 2018, "Fidenza generative artwork series"
 *   - Hobbs 2019, "Flow Fields and Generative Art"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';
import { makeNoise2D, mulberry32 } from '../../illustrator/rng';

export type FlowFieldOptions = {
  width: number;
  height: number;
  /** Noise frequency. Higher = more turbulent field. Default 0.004. */
  freq?: number;
  /** Seed for the noise field + particle spawn. */
  seed?: number;
  /** Number of streamlines to draw. */
  lines?: number;
  /** Max steps per streamline. */
  maxSteps?: number;
  /** Step length in pixels. Default 1.6. */
  stepLen?: number;
  /** Minimum gap between adjacent streamlines in pixels. 0 = allow
   *  crossings; ≥ 6 gives crisp non-overlap. Default 8. */
  separation?: number;
  /** Optional global field rotation in radians, added on top of curl. */
  rotation?: number;
};

export type Streamline = {
  points: [number, number][];
};

/** Compute a curl-noise flow field and trace streamlines on it. */
export function flowField(opts: FlowFieldOptions): Streamline[] {
  const w = opts.width;
  const h = opts.height;
  const freq = opts.freq ?? 0.004;
  const seed = opts.seed ?? 0xfeed;
  const lineCount = opts.lines ?? 240;
  const maxSteps = opts.maxSteps ?? 600;
  const stepLen = opts.stepLen ?? 1.6;
  const sep = opts.separation ?? 8;
  const rotation = opts.rotation ?? 0;

  const noise = makeNoise2D(seed);
  const eps = 1.0;

  // Curl: rotate ∇N by 90°.
  const curl = (x: number, y: number): [number, number] => {
    const fx = x * freq;
    const fy = y * freq;
    const dx = (noise(fx + eps * freq, fy) - noise(fx - eps * freq, fy)) * 0.5;
    const dy = (noise(fx, fy + eps * freq) - noise(fx, fy - eps * freq)) * 0.5;
    // Curl direction is (dy, -dx). Add optional global rotation.
    let vx = dy;
    let vy = -dx;
    if (rotation !== 0) {
      const c = dCos(rotation);
      const s = dSin(rotation);
      const nx = c * vx - s * vy;
      const ny = s * vx + c * vy;
      vx = nx;
      vy = ny;
    }
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len < 1e-9) return [0, 0];
    return [vx / len, vy / len];
  };

  // Occupancy grid for separation enforcement.
  const cellSize = Math.max(2, sep);
  const cols = Math.ceil(w / cellSize);
  const rows = Math.ceil(h / cellSize);
  const occ = new Uint8Array(cols * rows);
  const markCell = (x: number, y: number, value: number = 1) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
    occ[cy * cols + cx] = value;
  };
  const cellOccupied = (x: number, y: number): boolean => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return true; // outside = "occupied" → stop
    return occ[cy * cols + cx] !== 0;
  };

  const rng = mulberry32((seed * 2654435761) >>> 0);
  const lines: Streamline[] = [];
  let attempts = 0;
  const maxAttempts = lineCount * 8;

  while (lines.length < lineCount && attempts < maxAttempts) {
    attempts += 1;
    const sx = rng() * w;
    const sy = rng() * h;
    if (cellOccupied(sx, sy)) continue;

    const pts: [number, number][] = [[sx, sy]];
    let x = sx;
    let y = sy;
    // Forward integration.
    for (let i = 0; i < maxSteps; i++) {
      const [vx, vy] = curl(x, y);
      const nx = x + vx * stepLen;
      const ny = y + vy * stepLen;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) break;
      if (cellOccupied(nx, ny) && pts.length > 1) break;
      pts.push([nx, ny]);
      x = nx;
      y = ny;
    }
    // Backward integration.
    x = sx;
    y = sy;
    const back: [number, number][] = [];
    for (let i = 0; i < maxSteps; i++) {
      const [vx, vy] = curl(x, y);
      const nx = x - vx * stepLen;
      const ny = y - vy * stepLen;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) break;
      if (cellOccupied(nx, ny) && back.length > 1) break;
      back.push([nx, ny]);
      x = nx;
      y = ny;
    }

    const full = back.reverse().concat(pts);
    if (full.length < 4) continue;
    // Mark cells along the line.
    for (const [px, py] of full) markCell(px, py);
    lines.push({ points: full });
  }

  return lines;
}

/** Render streamlines as an SVG fragment. */
export function flowFieldSvg(
  lines: Streamline[],
  opts: {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  } = {},
): string {
  const stroke = opts.stroke ?? '#2a2a2a';
  const sw = opts.strokeWidth ?? 1.2;
  const op = opts.opacity ?? 0.85;
  let svg = '';
  for (const line of lines) {
    if (line.points.length < 2) continue;
    let d = '';
    for (let i = 0; i < line.points.length; i++) {
      const [x, y] = line.points[i];
      d += (i === 0 ? 'M' : 'L') + fmt2(x) + ',' + fmt2(y);
    }
    svg += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${fmt2(sw)}" stroke-linecap="round" opacity="${fmt2(op)}"/>`;
  }
  return svg;
}
