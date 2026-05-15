/** Geometry helpers shared by stroke and fill renderers. */

export type Pt = [number, number];

export function dist(a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Subdivide a polyline so no segment is longer than `maxSeg`. */
export function densify(pts: Pt[], maxSeg: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = dist(a, b);
    const steps = Math.max(1, Math.ceil(d / maxSeg));
    for (let k = 1; k <= steps; k++) {
      out.push(lerpPt(a, b, k / steps));
    }
  }
  return out;
}

/** Extend a polyline outward at both ends along the local tangent. */
export function extendEnds(pts: Pt[], len: number): Pt[] {
  if (pts.length < 2 || len <= 0) return pts.slice();
  const start = pts[0];
  const startNext = pts[1];
  const end = pts[pts.length - 1];
  const endPrev = pts[pts.length - 2];

  const sd = dist(start, startNext) || 1;
  const ed = dist(end, endPrev) || 1;
  const startExt: Pt = [
    start[0] - ((startNext[0] - start[0]) / sd) * len,
    start[1] - ((startNext[1] - start[1]) / sd) * len,
  ];
  const endExt: Pt = [
    end[0] + ((end[0] - endPrev[0]) / ed) * len,
    end[1] + ((end[1] - endPrev[1]) / ed) * len,
  ];
  return [startExt, ...pts, endExt];
}

/** Catmull–Rom polyline → cubic Bézier path string. Looks softer than polyline. */
export function smoothPath(pts: Pt[], closed = false): string {
  if (pts.length === 0) return '';
  if (pts.length < 3) {
    let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) d += ` L${fmt(pts[i][0])} ${fmt(pts[i][1])}`;
    return d;
  }
  const get = (i: number): Pt => {
    if (closed) return pts[(i + pts.length) % pts.length];
    return pts[Math.max(0, Math.min(pts.length - 1, i))];
  };
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  const last = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  if (closed) d += ' Z';
  return d;
}

export function polylinePath(pts: Pt[], closed = false): string {
  if (pts.length === 0) return '';
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += ` L${fmt(pts[i][0])} ${fmt(pts[i][1])}`;
  if (closed) d += ' Z';
  return d;
}

export function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '0';
}

/** Sample N points along a polyline, evenly by arc length. */
export function sampleAlong(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return [];
  if (n < 2) return [pts[0]];
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + dist(pts[i - 1], pts[i]));
  const total = lens[lens.length - 1];
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    let i = 1;
    while (i < lens.length && lens[i] < target) i++;
    if (i >= lens.length) {
      out.push(pts[pts.length - 1]);
      continue;
    }
    const segLen = lens[i] - lens[i - 1] || 1;
    const t = (target - lens[i - 1]) / segLen;
    out.push(lerpPt(pts[i - 1], pts[i], t));
  }
  return out;
}

/** Shortest-distance perpendicular unit vector to the tangent at index i. */
export function perpAt(pts: Pt[], i: number): Pt {
  const a = pts[Math.max(0, i - 1)];
  const b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [-dy / len, dx / len];
}
