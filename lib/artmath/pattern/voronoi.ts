/**
 * Voronoi tessellation + Lloyd's algorithm (Centroidal Voronoi Tessellation).
 *
 * A Voronoi diagram partitions the plane around a set of "site" points: each
 * cell is the locus of pixels closer to its site than to any other. Lloyd's
 * algorithm iteratively replaces each site with the centroid of its cell —
 * the result, after convergence, is a Centroidal Voronoi Tessellation (CVT)
 * with cells of remarkably uniform area and characteristic "soap bubble"
 * tiling. The aesthetic is everywhere: dragonfly wings, giraffe coats,
 * cracked mud, soap films, foam in coffee, basalt columns at Giant's
 * Causeway — and a staple of Hobbs' Fidenza generative art.
 *
 * Implementation: O(N²) site-to-grid distance scan. For our pattern sizes
 * (N ≤ 400 sites on a 1200×1200 canvas at 8px stride) this is fast enough
 * and bit-exact across platforms — no fancy O(N log N) Fortune sweep that
 * branches on floating-point comparisons in ways that drift between engines.
 *
 * Output: cell polygons as point lists, ready to feed to an SVG path.
 *
 * Sources:
 *   - Aurenhammer 1991, "Voronoi Diagrams - A Survey"
 *   - Lloyd 1982, "Least Squares Quantization in PCM"
 *   - Du, Faber, Gunzburger 1999, "Centroidal Voronoi Tessellations"
 *   - Hobbs 2018, "Fidenza"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { mulberry32, type Rng } from '../../illustrator/rng';

export type Point = [number, number];

export type VoronoiCell = {
  /** Index of the site this cell belongs to (0..N-1). */
  site: number;
  /** Site point in (x, y) pixels. */
  center: Point;
  /** Cell centroid (average of all pixels in the cell). */
  centroid: Point;
  /** Approximate area of the cell in pixels². */
  area: number;
  /** Boundary polygon (convex hull of the cell's perimeter pixels). */
  polygon: Point[];
};

export type VoronoiOptions = {
  /** Number of sites. */
  count: number;
  /** Canvas bounding box. Sites are spawned inside (0, w) × (0, h). */
  width: number;
  height: number;
  /** Seed for site placement. */
  seed?: number;
  /** Pixel stride for the distance scan. Lower = sharper edges but slower.
   *  Default 4. For final output use 2-3. */
  stride?: number;
  /** Lloyd's iterations to relax the sites toward CVT. 0 = raw Voronoi.
   *  3-5 gives visibly uniform cells; >10 wastes CPU. Default 3. */
  relax?: number;
  /** Optional pre-placed sites; bypasses random spawn. */
  sites?: Point[];
};

/**
 * Compute a Voronoi tessellation with optional Lloyd-relaxation.
 */
export function voronoi(opts: VoronoiOptions): VoronoiCell[] {
  const stride = opts.stride ?? 4;
  const relax = opts.relax ?? 3;
  const seed = opts.seed ?? 0xb01b;
  const w = opts.width;
  const h = opts.height;

  let sites: Point[] =
    opts.sites?.slice() ??
    (() => {
      const rng = mulberry32(seed);
      const out: Point[] = [];
      for (let i = 0; i < opts.count; i++) {
        out.push([rng() * w, rng() * h]);
      }
      return out;
    })();

  // Run Lloyd's algorithm.
  for (let iter = 0; iter <= relax; iter++) {
    // Step 1: distance scan — assign each grid pixel to its nearest site.
    const cols = Math.ceil(w / stride);
    const rows = Math.ceil(h / stride);
    const assign = new Int32Array(cols * rows);
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const x = cx * stride + stride / 2;
        const y = cy * stride + stride / 2;
        let best = -1;
        let bestD = Infinity;
        for (let s = 0; s < sites.length; s++) {
          const dx = sites[s][0] - x;
          const dy = sites[s][1] - y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = s;
          }
        }
        assign[cy * cols + cx] = best;
      }
    }

    // Step 2: aggregate centroid + area for each site.
    const sumX = new Float64Array(sites.length);
    const sumY = new Float64Array(sites.length);
    const count = new Int32Array(sites.length);
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const s = assign[cy * cols + cx];
        sumX[s] += cx * stride + stride / 2;
        sumY[s] += cy * stride + stride / 2;
        count[s] += 1;
      }
    }

    if (iter < relax) {
      // Move each site to its centroid for the next iteration.
      const next: Point[] = [];
      for (let s = 0; s < sites.length; s++) {
        if (count[s] === 0) {
          next.push(sites[s]);
        } else {
          next.push([sumX[s] / count[s], sumY[s] / count[s]]);
        }
      }
      sites = next;
      continue;
    }

    // Final pass: extract per-cell boundary polygons (convex hull of
    // perimeter pixels).
    const cells: VoronoiCell[] = [];
    for (let s = 0; s < sites.length; s++) {
      // Collect perimeter pixels: cells whose any neighbor is a different site.
      const perim: Point[] = [];
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (assign[cy * cols + cx] !== s) continue;
          let isPerim = false;
          if (cx === 0 || cy === 0 || cx === cols - 1 || cy === rows - 1) {
            isPerim = true;
          } else {
            if (
              assign[cy * cols + cx - 1] !== s ||
              assign[cy * cols + cx + 1] !== s ||
              assign[(cy - 1) * cols + cx] !== s ||
              assign[(cy + 1) * cols + cx] !== s
            ) {
              isPerim = true;
            }
          }
          if (isPerim) {
            perim.push([cx * stride + stride / 2, cy * stride + stride / 2]);
          }
        }
      }
      const poly = perim.length >= 3 ? convexHull(perim) : perim;
      const cx0 = count[s] === 0 ? sites[s][0] : sumX[s] / count[s];
      const cy0 = count[s] === 0 ? sites[s][1] : sumY[s] / count[s];
      cells.push({
        site: s,
        center: sites[s],
        centroid: [cx0, cy0],
        area: count[s] * stride * stride,
        polygon: poly,
      });
    }
    return cells;
  }
  return [];
}

// ─── Convex hull (Andrew's monotone chain) ────────────────────────────

function convexHull(pts: Point[]): Point[] {
  const sorted = pts.slice().sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (sorted.length <= 1) return sorted;
  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// ─── SVG helpers ───────────────────────────────────────────────────────

/** Convert a cell polygon to an SVG `points` attribute string. */
export function cellPoints(cell: VoronoiCell): string {
  return cell.polygon.map(([x, y]) => `${fmt2(x)},${fmt2(y)}`).join(' ');
}

/** Render a Voronoi diagram as an SVG fragment.
 *  Each cell is colored by a caller-supplied function. */
export function voronoiSvg(
  cells: VoronoiCell[],
  fill: (cell: VoronoiCell, rng: Rng) => string,
  opts: { seed?: number; stroke?: string; strokeWidth?: number } = {},
): string {
  const seed = opts.seed ?? 0xc0;
  const stroke = opts.stroke ?? 'none';
  const sw = opts.strokeWidth ?? 0;
  let svg = '';
  for (const cell of cells) {
    const rng = mulberry32((seed ^ (cell.site * 374761393)) >>> 0);
    const f = fill(cell, rng);
    const strokeAttr = stroke === 'none' ? '' : ` stroke="${stroke}" stroke-width="${fmt2(sw)}"`;
    svg += `<polygon points="${cellPoints(cell)}" fill="${f}"${strokeAttr}/>`;
  }
  return svg;
}
