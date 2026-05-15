/**
 * Penrose tilings — 5-fold-symmetric aperiodic tessellations.
 *
 * Roger Penrose's 1974 P3 (rhombic) tiling uses just two tile shapes —
 * a "thin" (36°) and a "fat" (72°) rhombus — to cover the plane with
 * no translational repeat. The tilings exhibit perfect 5-fold rotational
 * symmetry on average and golden-ratio relationships throughout.
 *
 * Algorithm: deflation. Start with a large rhombus (or "robinson
 * triangle" subdivision pair), and repeatedly subdivide each tile into
 * smaller ones according to the inflation rules. After N subdivisions,
 * the result is a high-resolution aperiodic tiling.
 *
 * This module uses the Robinson triangle approach (half-rhombi) since
 * the subdivision rules are simpler. The final output collects the
 * triangles into the original rhombi for display.
 *
 * Visual signature: Islamic geometric tilings (the Topkapi scroll uses
 * effectively the same Girih tiles), tight golden-ratio relationships
 * everywhere, and an unmistakable "deep math" aesthetic.
 *
 * Sources:
 *   - Penrose 1974, "The Role of Aesthetics in Pure and Applied
 *     Mathematical Research"
 *   - Lu & Steinhardt 2007, "Decagonal and Quasi-Crystalline Tilings
 *     in Medieval Islamic Architecture"
 *   - Gardner 1977, "Mathematical Games — Penrose's Nonperiodic Tiles"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';

/** The golden ratio. */
const PHI = 1.618033988749895;
/** π / 5. */
const PI_5 = 0.6283185307179587;

export type PenroseTriangle = {
  /** 'thin' = 36° apex (acute), 'fat' = 72° apex. */
  kind: 'thin' | 'fat';
  /** Three vertices. By convention p1 is the apex. */
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
};

export type PenroseOptions = {
  /** Number of subdivision iterations. ~5 = nice mid-resolution. Default 6. */
  iterations?: number;
  /** Radius of the initial decagon. */
  radius: number;
  /** Center (cx, cy). */
  cx: number;
  cy: number;
};

/** Build the initial 10-triangle decagon. */
function initialDecagon(opts: PenroseOptions): PenroseTriangle[] {
  const out: PenroseTriangle[] = [];
  const cx = opts.cx;
  const cy = opts.cy;
  const r = opts.radius;
  for (let i = 0; i < 10; i++) {
    const a1 = ((2 * i - 1) * Math.PI) / 10;
    const a2 = ((2 * i + 1) * Math.PI) / 10;
    let v1: [number, number] = [cx + r * dCos(a1), cy + r * dSin(a1)];
    let v2: [number, number] = [cx + r * dCos(a2), cy + r * dSin(a2)];
    // Alternate "winding" so the deflation rules apply consistently.
    if (i % 2 === 0) [v1, v2] = [v2, v1];
    out.push({ kind: 'thin', p1: [cx, cy], p2: v1, p3: v2 });
  }
  return out;
}

/** Subdivide each triangle by Penrose's deflation rules. */
function deflate(triangles: PenroseTriangle[]): PenroseTriangle[] {
  const out: PenroseTriangle[] = [];
  for (const t of triangles) {
    if (t.kind === 'thin') {
      // Thin triangle (a, b, c) → 1 thin + 1 fat
      const p: [number, number] = [
        t.p1[0] + (t.p2[0] - t.p1[0]) / PHI,
        t.p1[1] + (t.p2[1] - t.p1[1]) / PHI,
      ];
      out.push({ kind: 'thin', p1: t.p3, p2: p, p3: t.p2 });
      out.push({ kind: 'fat', p1: p, p2: t.p3, p3: t.p1 });
    } else {
      // Fat triangle → 2 fat + 1 thin
      const q: [number, number] = [
        t.p2[0] + (t.p1[0] - t.p2[0]) / PHI,
        t.p2[1] + (t.p1[1] - t.p2[1]) / PHI,
      ];
      const r: [number, number] = [
        t.p2[0] + (t.p3[0] - t.p2[0]) / PHI,
        t.p2[1] + (t.p3[1] - t.p2[1]) / PHI,
      ];
      out.push({ kind: 'fat', p1: r, p2: t.p3, p3: t.p1 });
      out.push({ kind: 'fat', p1: q, p2: r, p3: t.p2 });
      out.push({ kind: 'thin', p1: r, p2: q, p3: t.p1 });
    }
  }
  return out;
}

/** Compute the Penrose P3 tiling at the given resolution. */
export function penroseTiling(opts: PenroseOptions): PenroseTriangle[] {
  const iters = opts.iterations ?? 6;
  let tris = initialDecagon(opts);
  for (let i = 0; i < iters; i++) {
    tris = deflate(tris);
  }
  return tris;
}

export type PenroseSvgOptions = {
  /** Fill color for thin (36°) rhombi. */
  thinFill?: string;
  /** Fill color for fat (72°) rhombi. */
  fatFill?: string;
  /** Stroke color. */
  stroke?: string;
  strokeWidth?: number;
};

/** Render Penrose tiling as SVG. Triangles are drawn as polygons; thin
 *  and fat halves share their colors by kind. */
export function penroseSvg(triangles: PenroseTriangle[], opts: PenroseSvgOptions = {}): string {
  const thinFill = opts.thinFill ?? '#c25f3e';
  const fatFill = opts.fatFill ?? '#5a8c9e';
  const stroke = opts.stroke ?? '#39312a';
  const sw = opts.strokeWidth ?? 0.5;
  let svg = '';
  for (const t of triangles) {
    const c = t.kind === 'thin' ? thinFill : fatFill;
    svg += `<polygon points="${fmt2(t.p1[0])},${fmt2(t.p1[1])} ${fmt2(t.p2[0])},${fmt2(t.p2[1])} ${fmt2(t.p3[0])},${fmt2(t.p3[1])}" fill="${c}" stroke="${stroke}" stroke-width="${fmt2(sw)}"/>`;
  }
  return svg;
}

void PI_5;
