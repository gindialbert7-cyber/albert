/**
 * Restyle: feed traced contours through livingPath in the active
 * Artist's hand.
 *
 * The pipeline:
 *   1. Source SVG → extractSvgContours → list of polylines in source
 *      coordinate space.
 *   2. Filter + normalize: drop micro-paths, simplify oversampled
 *      polylines, fit to target box.
 *   3. Stroke ordering: longest contour first (silhouette), then
 *      shorter (details), greedy nearest-neighbor within layer.
 *   4. Per stroke: emit a livingLine/livingPath in the Artist's style.
 *
 * This is the part that gives a traced asset our hand-drawn signature
 * regardless of its source style.
 */

import type { Pt } from '../geometry';
import type { Artist } from '../artist';
import type { Rng } from '../rng';
import { mulberry32 } from '../rng';
import { livingPath } from '../stroke/living-line';
import { extractSvgContours } from './svg-trace';

// ─── Geometry helpers ───────────────────────────────────────────────────────

function bbox(pts: Pt[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function contoursBbox(cs: Pt[][]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of cs) {
    const b = bbox(c);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return { minX, minY, maxX, maxY };
}

function pathLen(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

// Douglas-Peucker simplification (deterministic, no transcendentals).
function simplify(pts: Pt[], tolerance: number): Pt[] {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = true;
  keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  const tol2 = tolerance * tolerance;
  while (stack.length > 0) {
    const [lo, hi] = stack.pop()!;
    if (hi - lo < 2) continue;
    const a = pts[lo];
    const b = pts[hi];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    let maxD2 = 0;
    let maxIdx = -1;
    for (let i = lo + 1; i < hi; i++) {
      const p = pts[i];
      let d2: number;
      if (len2 === 0) {
        const px = p[0] - a[0];
        const py = p[1] - a[1];
        d2 = px * px + py * py;
      } else {
        const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
        const projX = a[0] + t * dx;
        const projY = a[1] + t * dy;
        const ddx = p[0] - projX;
        const ddy = p[1] - projY;
        d2 = ddx * ddx + ddy * ddy;
      }
      if (d2 > maxD2) {
        maxD2 = d2;
        maxIdx = i;
      }
    }
    if (maxD2 > tol2 && maxIdx >= 0) {
      keep[maxIdx] = true;
      stack.push([lo, maxIdx]);
      stack.push([maxIdx, hi]);
    }
  }
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

// ─── Stroke ordering ────────────────────────────────────────────────────────

/** Order contours: longest first (silhouette), then greedy nearest-neighbor
 *  on remaining shorter contours to minimize "pen-up" travel between them. */
function orderContours(cs: Pt[][]): Pt[][] {
  if (cs.length <= 1) return cs.slice();
  // Sort by length descending.
  const sorted = cs.slice().sort((a, b) => pathLen(b) - pathLen(a));
  // First contour is the longest; greedy from there.
  const ordered: Pt[][] = [sorted[0]];
  const remaining = sorted.slice(1);
  while (remaining.length > 0) {
    const lastPt = ordered[ordered.length - 1][ordered[ordered.length - 1].length - 1];
    let bestIdx = 0;
    let bestD2 = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const dx = c[0][0] - lastPt[0];
      const dy = c[0][1] - lastPt[1];
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

// ─── Fit to target box ──────────────────────────────────────────────────────

function fitContours(
  cs: Pt[][],
  target: { x: number; y: number; w: number; h: number },
): Pt[][] {
  const b = contoursBbox(cs);
  const srcW = b.maxX - b.minX || 1;
  const srcH = b.maxY - b.minY || 1;
  const scale = Math.min(target.w / srcW, target.h / srcH);
  // Center within target.
  const fitW = srcW * scale;
  const fitH = srcH * scale;
  const offX = target.x + (target.w - fitW) / 2 - b.minX * scale;
  const offY = target.y + (target.h - fitH) / 2 - b.minY * scale;
  return cs.map((c) => c.map(([x, y]) => [x * scale + offX, y * scale + offY] as Pt));
}

// ─── Public API ────────────────────────────────────────────────────────────

export type RestyleOptions = {
  /** Target placement on the page. */
  bbox: { x: number; y: number; w: number; h: number };
  artist: Artist;
  rng: Rng;
  /** Simplification tolerance in source coords. Higher = fewer points. */
  simplifyTolerance?: number;
  /** Discard contours shorter than this in source units. */
  minContourLength?: number;
  /** Discard contours with fewer than this many points. */
  minContourPoints?: number;
};

/**
 * Restyle an SVG source string into the active Artist's hand at the
 * given page position.
 */
export function restyleSvgInArtist(svg: string, opts: RestyleOptions): string {
  const rawContours = extractSvgContours(svg);
  const minPts = opts.minContourPoints ?? 2;
  const minLen = opts.minContourLength ?? 2;
  const tol = opts.simplifyTolerance ?? 0.6;
  const filtered = rawContours
    .filter((c) => c.length >= minPts && pathLen(c) >= minLen)
    .map((c) => simplify(c, tol));

  const fitted = fitContours(filtered, opts.bbox);
  const ordered = orderContours(fitted);

  let out = '';
  for (const contour of ordered) {
    out += livingPath(contour, opts.rng, {
      width: opts.artist.baseLineWidth,
      color: opts.artist.inkColor,
      anticipation: opts.artist.anticipationHook,
      followThrough: opts.artist.followThroughOvershoot,
      endPool: opts.artist.endpointInkPool * 0.5, // restyled assets get a softer end
      curvatureCoupling: opts.artist.pressureCurvatureCoupling,
      grainStrength: opts.artist.paperGrainIntensity * 0.5,
    });
  }
  return out;
}

/**
 * Convenience: restyle from a pre-fetched, in-Universe-cached asset.
 * In production this is what the page renderer calls — the SVG bytes
 * come from the Universe's cached library.
 */
export function restyleFromCache(
  cachedSvg: string,
  bbox: { x: number; y: number; w: number; h: number },
  artist: Artist,
  seed: number,
): string {
  return restyleSvgInArtist(cachedSvg, {
    bbox,
    artist,
    rng: mulberry32(seed),
  });
}
