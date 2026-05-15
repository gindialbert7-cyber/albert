/**
 * Stippling — pointillist tonal rendering by varying dot density.
 *
 * Seurat (1880s) and the broader Pointillist movement, then Dürer's
 * and Goya's etching traditions: dots of ink placed at variable density
 * convey tone without lines or wash. Modern weighted-centroidal Voronoi
 * stippling (Secord 2002) gives provably-optimal dot placement for any
 * input target image, but for our generative use we work the other way
 * around: from a procedural density function, scatter dots.
 *
 * Two algorithms:
 *   - 'poisson'   Poisson-disk sampling (Bridson 2007). Dots are
 *                 separated by at least r pixels, density adjusts
 *                 inversely to r. Smooth, even, no clustering.
 *   - 'rejection' Density-modulated rejection sampling. Faster, but
 *                 may show banding at sharp density transitions.
 *
 * The caller provides a `density(x, y) -> [0, 1]` function (1 = darkest,
 * full dot coverage; 0 = paper-white, no dots). Output is a list of
 * (x, y) dot positions.
 *
 * Sources:
 *   - Secord 2002, "Weighted Voronoi Stippling"
 *   - Bridson 2007, "Fast Poisson Disk Sampling in Arbitrary Dimensions"
 *   - Seurat 1886, "A Sunday Afternoon on the Island of La Grande Jatte"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos, dExp } from '../../illustrator/math/det-math';
import { mulberry32, type Rng } from '../../illustrator/rng';

export type DensityFn = (x: number, y: number) => number;

export type StippleOptions = {
  width: number;
  height: number;
  density: DensityFn;
  /** 'poisson' (default) or 'rejection'. */
  method?: 'poisson' | 'rejection';
  /** For poisson: max number of attempts per active sample. Default 30. */
  k?: number;
  /** For poisson: minimum r at full density. Higher = fewer dots. Default 3. */
  rMin?: number;
  /** For poisson: maximum r at zero density. Default 16. */
  rMax?: number;
  /** For rejection: total dots to scatter. */
  totalDots?: number;
  seed?: number;
};

/** Sample dot positions from the density function. */
export function stipple(opts: StippleOptions): [number, number][] {
  if ((opts.method ?? 'poisson') === 'rejection') {
    return rejectionStipple(opts);
  }
  return poissonStipple(opts);
}

function rejectionStipple(opts: StippleOptions): [number, number][] {
  const total = opts.totalDots ?? 2000;
  const rng = mulberry32(opts.seed ?? 0xd07);
  const out: [number, number][] = [];
  let attempts = 0;
  const maxAttempts = total * 20;
  while (out.length < total && attempts < maxAttempts) {
    attempts += 1;
    const x = rng() * opts.width;
    const y = rng() * opts.height;
    const d = opts.density(x, y);
    if (rng() < d) out.push([x, y]);
  }
  return out;
}

function poissonStipple(opts: StippleOptions): [number, number][] {
  const w = opts.width;
  const h = opts.height;
  const rMin = opts.rMin ?? 3;
  const rMax = opts.rMax ?? 16;
  const k = opts.k ?? 30;
  const rng = mulberry32(opts.seed ?? 0xd07);

  const radiusAt = (x: number, y: number): number => {
    const d = Math.max(0, Math.min(1, opts.density(x, y)));
    return rMin + (1 - d) * (rMax - rMin);
  };

  // Coarse grid for nearest-neighbor lookup.
  const cellSize = rMin / Math.SQRT2;
  const cols = Math.ceil(w / cellSize);
  const rows = Math.ceil(h / cellSize);
  const grid: number[][] = new Array(cols * rows).fill(null).map(() => []);
  const points: [number, number][] = [];
  const active: number[] = [];

  const insert = (p: [number, number]): number => {
    const idx = points.length;
    points.push(p);
    const cx = Math.floor(p[0] / cellSize);
    const cy = Math.floor(p[1] / cellSize);
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      grid[cy * cols + cx].push(idx);
    }
    return idx;
  };

  const farEnough = (p: [number, number], r: number): boolean => {
    const cx = Math.floor(p[0] / cellSize);
    const cy = Math.floor(p[1] / cellSize);
    const span = Math.ceil(rMax / cellSize) + 1;
    for (let dy = -span; dy <= span; dy++) {
      for (let dx = -span; dx <= span; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        for (const i of grid[ny * cols + nx]) {
          const q = points[i];
          const ddx = q[0] - p[0];
          const ddy = q[1] - p[1];
          if (ddx * ddx + ddy * ddy < r * r) return false;
        }
      }
    }
    return true;
  };

  // Seed with multiple points biased toward high-density regions so we
  // don't starve in clusters of small blobs separated by low-density gaps.
  const seedCount = 20;
  let seeded = 0;
  let seedAttempts = 0;
  while (seeded < seedCount && seedAttempts < seedCount * 60) {
    seedAttempts += 1;
    const sx = rng() * w;
    const sy = rng() * h;
    const d = opts.density(sx, sy);
    if (rng() > d) continue;
    if (!farEnough([sx, sy], radiusAt(sx, sy))) continue;
    const idx = insert([sx, sy]);
    active.push(idx);
    seeded += 1;
  }
  // Guarantee at least one active sample so loop runs.
  if (active.length === 0) {
    insert([w / 2, h / 2]);
    active.push(0);
  }

  while (active.length > 0) {
    const ai = Math.floor(rng() * active.length);
    const parent = points[active[ai]];
    let placed = false;
    const r = radiusAt(parent[0], parent[1]);
    for (let t = 0; t < k; t++) {
      const ang = rng() * Math.PI * 2;
      const dist = r + rng() * r;
      const nx = parent[0] + dCos(ang) * dist;
      const ny = parent[1] + dSin(ang) * dist;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const localR = radiusAt(nx, ny);
      if (!farEnough([nx, ny], localR)) continue;
      // Also rejection-test by density to skip pure-white regions.
      const d = opts.density(nx, ny);
      if (rng() > d) continue;
      const idx = insert([nx, ny]);
      active.push(idx);
      placed = true;
      break;
    }
    if (!placed) {
      active.splice(ai, 1);
    }
  }
  return points;
}

/** Render a stipple cloud as SVG circles. */
export function stippleSvg(
  pts: [number, number][],
  opts: {
    r?: number;
    color?: string;
    /** If set, dot radius varies by density at each point. */
    densityFn?: DensityFn;
    rMin?: number;
    rMax?: number;
  } = {},
): string {
  const r = opts.r ?? 0.9;
  const color = opts.color ?? '#39312a';
  let svg = '';
  for (const [x, y] of pts) {
    let rad = r;
    if (opts.densityFn) {
      const d = Math.max(0, Math.min(1, opts.densityFn(x, y)));
      const rmin = opts.rMin ?? 0.4;
      const rmax = opts.rMax ?? 1.4;
      rad = rmin + d * (rmax - rmin);
    }
    svg += `<circle cx="${fmt2(x)}" cy="${fmt2(y)}" r="${fmt2(rad)}" fill="${color}"/>`;
  }
  return svg;
}

/** Helper: build a density function from a list of darkness "centers"
 *  (gaussian blobs). */
export function blobsDensity(
  blobs: Array<{ x: number; y: number; r: number; strength: number }>,
): DensityFn {
  return (x, y) => {
    let d = 0;
    for (const b of blobs) {
      const dx = x - b.x;
      const dy = y - b.y;
      const r2 = dx * dx + dy * dy;
      d += b.strength * dExp(-r2 / (b.r * b.r));
    }
    if (d > 1) d = 1;
    if (d < 0) d = 0;
    return d;
  };
}
