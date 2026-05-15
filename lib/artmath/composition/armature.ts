/**
 * Bouleau's harmonic armature of the rectangle.
 *
 * Charles Bouleau ("The Painter's Secret Geometry," 1963) showed that
 * masterpieces from Piero della Francesca through Vermeer to Mondrian
 * place focal elements on a small set of geometrically derived lines:
 * the two main diagonals, the four edge midpoints, the four corner-to-
 * opposite-edge-midpoint half-diagonals, and the medians.
 *
 * Mathematical fact: in rectangle [0,w] × [0,h], the line from (0,0) to
 * (w/2, h) and the line from (0,h) to (w,0) intersect at exactly
 * (w/3, 2h/3). This is why "armature points" coincide with the rule-
 * of-thirds intersections — and why the armature is just a richer
 * superset of thirds (14 lines vs. 4).
 *
 * Adding reciprocal-diagonals (perpendiculars from each corner to the
 * opposite main diagonal) gives the full Bouleau armature with up to
 * 25 named intersections.
 *
 * This module exposes:
 *   - bouleauLines(w, h, level) — the lines (level: 'thirds' | 'harmonic14' | 'full')
 *   - bouleauPoints(w, h, level) — pre-computed key intersection points
 *   - snapToArmature(pt, w, h, strength, level) — pull a point toward
 *     nearest armature intersection
 *   - rabatmentLines(w, h) — Vermeer's two-rabatment-square verticals
 *
 * Sources:
 *   - Bouleau, "The Painter's Secret Geometry" (1963)
 *   - harmonicarmature.com (practitioner reference)
 *   - Hambidge, "Elements of Dynamic Symmetry" (1926) for the
 *     reciprocal-diagonal extension
 */

import type { Pt } from '../../illustrator/geometry';

export type ArmatureLevel = 'thirds' | 'harmonic14' | 'full';

export type Line = { from: Pt; to: Pt };

// ─── line generators ─────────────────────────────────────────────────────

/** Plain rule-of-thirds: 4 lines (2 verticals, 2 horizontals). */
function thirds(w: number, h: number): Line[] {
  return [
    { from: [w / 3, 0], to: [w / 3, h] },
    { from: [(2 * w) / 3, 0], to: [(2 * w) / 3, h] },
    { from: [0, h / 3], to: [w, h / 3] },
    { from: [0, (2 * h) / 3], to: [w, (2 * h) / 3] },
  ];
}

/** Bouleau's 14-line harmonic armature.
 *  Two main diagonals + 4 edge-midpoint medians + 8 half-diagonals. */
function harmonic14(w: number, h: number): Line[] {
  const tl: Pt = [0, 0];
  const tr: Pt = [w, 0];
  const bl: Pt = [0, h];
  const br: Pt = [w, h];
  const mt: Pt = [w / 2, 0];
  const mr: Pt = [w, h / 2];
  const mb: Pt = [w / 2, h];
  const ml: Pt = [0, h / 2];
  return [
    // Main diagonals
    { from: tl, to: br },
    { from: tr, to: bl },
    // Medians
    { from: mt, to: mb },
    { from: ml, to: mr },
    // Half-diagonals from each corner to opposite edge midpoints
    { from: tl, to: mr },
    { from: tl, to: mb },
    { from: tr, to: ml },
    { from: tr, to: mb },
    { from: bl, to: mr },
    { from: bl, to: mt },
    { from: br, to: ml },
    { from: br, to: mt },
    // Edge-to-edge midpoint connectors
    { from: mt, to: ml },
    { from: mb, to: mr },
  ];
}

/** Full Bouleau: 14 harmonic + 4 reciprocal-diagonals (perpendiculars
 *  from each corner to the opposite main diagonal). */
function fullBouleau(w: number, h: number): Line[] {
  const base = harmonic14(w, h);
  const tl: Pt = [0, 0];
  const tr: Pt = [w, 0];
  const bl: Pt = [0, h];
  const br: Pt = [w, h];

  // Reciprocal-diagonal foot-of-perpendicular from corner to opposite diagonal.
  // For diagonal A→B and point P, the foot is P + ((A-P)·d)·d where d is unit AB.
  const foot = (P: Pt, A: Pt, B: Pt): Pt => {
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return A;
    const t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / len2;
    return [A[0] + t * dx, A[1] + t * dy];
  };
  // tl perpendicular to tr-bl diagonal:
  const fTL = foot(tl, tr, bl);
  const fTR = foot(tr, tl, br);
  const fBL = foot(bl, tl, br);
  const fBR = foot(br, tr, bl);

  return [
    ...base,
    { from: tl, to: fTL },
    { from: tr, to: fTR },
    { from: bl, to: fBL },
    { from: br, to: fBR },
  ];
}

// ─── public: lines ──────────────────────────────────────────────────────

export function bouleauLines(w: number, h: number, level: ArmatureLevel = 'harmonic14'): Line[] {
  switch (level) {
    case 'thirds': return thirds(w, h);
    case 'harmonic14': return harmonic14(w, h);
    case 'full': return fullBouleau(w, h);
  }
}

// ─── public: pre-computed key intersections ─────────────────────────────

/**
 * The 4 thirds-power-points + the 4 half-thirds intersections + the
 * 4 quarter intersections — covers the canonical "snap targets" for
 * focal placement in nearly all classical compositions.
 */
export function bouleauPoints(w: number, h: number, level: ArmatureLevel = 'harmonic14'): Pt[] {
  // Thirds power points (always included).
  const t1: Pt = [w / 3, h / 3];
  const t2: Pt = [(2 * w) / 3, h / 3];
  const t3: Pt = [w / 3, (2 * h) / 3];
  const t4: Pt = [(2 * w) / 3, (2 * h) / 3];

  if (level === 'thirds') return [t1, t2, t3, t4];

  // Add: golden-section points (~0.382, 0.618 ratios) and center.
  const PHI = 0.6180339887;
  const phiPoints: Pt[] = [
    [w * (1 - PHI), h * (1 - PHI)],
    [w * PHI, h * (1 - PHI)],
    [w * (1 - PHI), h * PHI],
    [w * PHI, h * PHI],
  ];

  // Edge midpoints (often used as secondary rest points)
  const mt: Pt = [w / 2, 0];
  const mb: Pt = [w / 2, h];
  const ml: Pt = [0, h / 2];
  const mr: Pt = [w, h / 2];

  const base = [t1, t2, t3, t4, ...phiPoints];
  if (level === 'harmonic14') return base;

  // Full: also include edge midpoints + main diagonal intersection
  // (canvas center).
  const center: Pt = [w / 2, h / 2];
  return [...base, mt, mb, ml, mr, center];
}

// ─── public: snap a point to nearest armature intersection ─────────────

/**
 * Pull a focal point toward the nearest armature intersection.
 *
 * @param pt the proposed focal point
 * @param canvasW canvas width
 * @param canvasH canvas height
 * @param strength 0 = no snap, 1 = full snap to nearest intersection
 * @param level which armature density to use
 */
export function snapToArmature(
  pt: Pt,
  canvasW: number,
  canvasH: number,
  strength: number = 0.7,
  level: ArmatureLevel = 'harmonic14',
): Pt {
  if (strength <= 0) return pt;
  const targets = bouleauPoints(canvasW, canvasH, level);
  let bestD2 = Infinity;
  let bestT: Pt = targets[0];
  for (const t of targets) {
    const dx = pt[0] - t[0];
    const dy = pt[1] - t[1];
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      bestT = t;
    }
  }
  const s = Math.max(0, Math.min(1, strength));
  return [pt[0] + (bestT[0] - pt[0]) * s, pt[1] + (bestT[1] - pt[1]) * s];
}

// ─── public: rabatment ─────────────────────────────────────────────────

/**
 * Rabatment lines for a non-square rectangle.
 *
 * For width w > height h, the rabatment squares are [0,h]×[0,h] (left)
 * and [w-h, w]×[0,h] (right). The rabatment lines x = h and x = w-h
 * are major compositional verticals (Vermeer's "Pearl Earring" places
 * the pearl on a rabatment intersection).
 *
 * Returns vertical lines x = h, x = w-h (or horizontal y = w, y = h-w
 * for portrait orientation).
 */
export function rabatmentLines(w: number, h: number): Line[] {
  if (w === h) return [];
  if (w > h) {
    return [
      { from: [h, 0], to: [h, h] },
      { from: [w - h, 0], to: [w - h, h] },
    ];
  }
  // Portrait: rabatment squares stack vertically
  return [
    { from: [0, w], to: [w, w] },
    { from: [0, h - w], to: [w, h - w] },
  ];
}
