/**
 * Diffusion-limited aggregation (DLA) — the math of frost, lichen,
 * coral, dendritic crystals, and electric discharge.
 *
 * Witten and Sander introduced this in 1981 as a simple model for any
 * irreversible growth process driven by random diffusion: a particle
 * walks randomly until it touches the existing cluster, where it sticks.
 * Repeated many times, an arbitrarily complex branching fractal grows
 * with a Hausdorff dimension of about 1.71.
 *
 * Visual signature: organic branching with a "fingered" or "fern-like"
 * silhouette and no preferred direction. Looks instantly biological
 * even though there is zero biological mechanism in the algorithm —
 * just diffusion + sticking.
 *
 * Implementation: walker spawns at a random point far from the cluster,
 * takes random unit steps, and either escapes (gets killed and respawn)
 * or touches an existing cluster cell (sticks). For efficiency we use
 * a grid of cluster cells and a "killing distance" that scales with the
 * current cluster radius.
 *
 * Sources:
 *   - Witten, Sander 1981, "Diffusion-Limited Aggregation"
 *   - Meakin 1983, "Formation of fractal clusters and networks"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';
import { mulberry32 } from '../../illustrator/rng';

export type DLAOptions = {
  /** Canvas width / height in pixels. */
  width: number;
  height: number;
  /** Cell grid resolution. Default 2 px per cell. */
  cellSize?: number;
  /** Maximum particles to grow. Default 4000. */
  particles?: number;
  /** Stickiness in [0, 1]. < 1 makes the cluster denser; 1 = original DLA. */
  stickiness?: number;
  /** Random seed. */
  seed?: number;
  /** Seed points to start the cluster (in pixels). Default = canvas center. */
  seeds?: Array<[number, number]>;
};

export type DLACluster = {
  /** Occupied cells: indices into a (cols × rows) grid. */
  occupied: Set<number>;
  cols: number;
  rows: number;
  cellSize: number;
  /** Birth order — how long after the seed each cell was added. Useful
   *  for coloring "old vs new" branches. */
  birthOrder: Map<number, number>;
};

/** Grow a DLA cluster. */
export function dla(opts: DLAOptions): DLACluster {
  const cellSize = opts.cellSize ?? 2;
  const cols = Math.ceil(opts.width / cellSize);
  const rows = Math.ceil(opts.height / cellSize);
  const particles = opts.particles ?? 4000;
  const stickiness = opts.stickiness ?? 1.0;
  const rng = mulberry32(opts.seed ?? 0xd1a);

  const occupied = new Set<number>();
  const birthOrder = new Map<number, number>();
  const idx = (cx: number, cy: number): number => cy * cols + cx;

  // Initial seeds.
  const seedList: Array<[number, number]> = opts.seeds ?? [
    [opts.width / 2, opts.height / 2],
  ];
  for (const [sx, sy] of seedList) {
    const cx = Math.floor(sx / cellSize);
    const cy = Math.floor(sy / cellSize);
    const i = idx(cx, cy);
    occupied.add(i);
    birthOrder.set(i, 0);
  }

  let clusterMaxX = 0;
  let clusterMaxY = 0;
  let clusterMinX = cols;
  let clusterMinY = rows;
  for (const i of occupied) {
    const cy = Math.floor(i / cols);
    const cx = i - cy * cols;
    if (cx > clusterMaxX) clusterMaxX = cx;
    if (cy > clusterMaxY) clusterMaxY = cy;
    if (cx < clusterMinX) clusterMinX = cx;
    if (cy < clusterMinY) clusterMinY = cy;
  }
  // Initial radius = max distance from centroid to any seed (plus margin).
  let clusterRadius = 4;
  {
    const cxC = (clusterMinX + clusterMaxX) / 2;
    const cyC = (clusterMinY + clusterMaxY) / 2;
    for (const i of occupied) {
      const cy = Math.floor(i / cols);
      const cx = i - cy * cols;
      const dx = cx - cxC;
      const dy = cy - cyC;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > clusterRadius) clusterRadius = r;
    }
  }

  const isAdjacent = (cx: number, cy: number): boolean => {
    if (occupied.has(idx(cx, cy))) return false; // already in cluster
    return (
      occupied.has(idx(cx + 1, cy)) ||
      occupied.has(idx(cx - 1, cy)) ||
      occupied.has(idx(cx, cy + 1)) ||
      occupied.has(idx(cx, cy - 1))
    );
  };

  let born = 1;
  let consecutiveMisses = 0;
  for (let p = 0; p < particles; p++) {
    // Spawn particle on a circle of radius `clusterRadius + 8`, centered
    // on cluster centroid for simplicity (~canvas center).
    const cxCenter = (clusterMinX + clusterMaxX) / 2;
    const cyCenter = (clusterMinY + clusterMaxY) / 2;
    const spawnR = clusterRadius + 8;
    const killR = clusterRadius + 20;
    let theta = rng() * Math.PI * 2;
    let px = cxCenter + spawnR * dCos(theta);
    let py = cyCenter + spawnR * dSin(theta);

    // Random walk until stick or escape.
    let stuck = false;
    let maxSteps = 8000;
    while (maxSteps-- > 0) {
      // Move
      const dir = Math.floor(rng() * 4);
      if (dir === 0) px += 1;
      else if (dir === 1) px -= 1;
      else if (dir === 2) py += 1;
      else py -= 1;
      const cx = Math.floor(px);
      const cy = Math.floor(py);
      if (cx < 1 || cy < 1 || cx >= cols - 1 || cy >= rows - 1) {
        // Escaped grid — respawn
        theta = rng() * Math.PI * 2;
        px = cxCenter + spawnR * dCos(theta);
        py = cyCenter + spawnR * dSin(theta);
        continue;
      }
      // Kill outside the kill ring
      const dx = cx - cxCenter;
      const dy = cy - cyCenter;
      if (dx * dx + dy * dy > killR * killR) {
        theta = rng() * Math.PI * 2;
        px = cxCenter + spawnR * dCos(theta);
        py = cyCenter + spawnR * dSin(theta);
        continue;
      }
      if (isAdjacent(cx, cy) && rng() < stickiness) {
        occupied.add(idx(cx, cy));
        birthOrder.set(idx(cx, cy), born++);
        if (cx > clusterMaxX) clusterMaxX = cx;
        if (cy > clusterMaxY) clusterMaxY = cy;
        if (cx < clusterMinX) clusterMinX = cx;
        if (cy < clusterMinY) clusterMinY = cy;
        const rdx = cx - cxCenter;
        const rdy = cy - cyCenter;
        const rNew = Math.sqrt(rdx * rdx + rdy * rdy);
        if (rNew > clusterRadius) clusterRadius = rNew;
        stuck = true;
        break;
      }
    }
    // Track consecutive non-sticks; bail after many in a row to avoid
    // spinning indefinitely when the cluster has filled its viable area.
    if (stuck) {
      consecutiveMisses = 0;
    } else {
      consecutiveMisses += 1;
      if (consecutiveMisses > 80) break;
    }
  }
  return { occupied, cols, rows, cellSize, birthOrder };
}

/** Render the cluster as SVG cells. */
export function dlaSvg(
  cluster: DLACluster,
  opts: {
    /** Color (string) or function-of-birth-order returning hex. */
    color?: string | ((birthFraction: number) => string);
    /** Background fill. */
    background?: string;
  } = {},
): string {
  const cs = cluster.cellSize;
  const totalBorn = cluster.birthOrder.size;
  const colorFn = typeof opts.color === 'function' ? opts.color : null;
  const colorStatic = typeof opts.color === 'string' ? opts.color : '#39312a';
  let svg = '';
  if (opts.background) {
    svg += `<rect width="${fmt2(cluster.cols * cs)}" height="${fmt2(cluster.rows * cs)}" fill="${opts.background}"/>`;
  }
  for (const i of cluster.occupied) {
    const cy = Math.floor(i / cluster.cols);
    const cx = i - cy * cluster.cols;
    let c: string;
    if (colorFn) {
      const t = (cluster.birthOrder.get(i) ?? 0) / Math.max(1, totalBorn);
      c = colorFn(t);
    } else {
      c = colorStatic;
    }
    svg += `<rect x="${fmt2(cx * cs)}" y="${fmt2(cy * cs)}" width="${fmt2(cs)}" height="${fmt2(cs)}" fill="${c}"/>`;
  }
  return svg;
}
