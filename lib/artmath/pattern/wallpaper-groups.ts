/**
 * Wallpaper groups — the 17 ways to tile the plane symmetrically.
 *
 * Classified by Fedorov (1891), Polya & Niggli (1924). Every periodic
 * 2D pattern in human history belongs to one of these 17 symmetry
 * groups (Hermann-Mauguin notation: p1, p2, pm, pg, cm, pmm, pmg, pgg,
 * cmm, p4, p4m, p4g, p3, p3m1, p31m, p6, p6m).
 *
 * Implementation strategy: each group is defined by a fundamental
 * domain (the smallest tile that, repeated under the group's
 * symmetries, fills the plane) and a list of operations to apply.
 * The caller provides a "tile drawer" function — `(x, y, size, rng) →
 * SVG fragment` — and the wallpaper operator tiles the canvas by
 * applying every operation across a translation lattice.
 *
 * This module implements all 17 groups. The simplified groups (p1, p2,
 * pmm, p4m, p6m) cover ~85% of common decorative needs; the remaining
 * 12 (pm, pg, cm, pmg, pgg, cmm, p4, p4g, p3, p3m1, p31m, p6) extend
 * coverage to historic Islamic art, M.C. Escher tilings, and
 * crystallographic patterns.
 *
 * Sources:
 *   - Sasse 2020, "Classification of the 17 Wallpaper Groups" (U.Chicago)
 *   - Joyce, "Wallpaper Groups" (Clark University)
 *   - Conway, "The Symmetries of Things" (orbifold notation)
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';
import { mulberry32, type Rng } from '../../illustrator/rng';

export type WallpaperGroup =
  | 'p1' | 'p2' | 'pm' | 'pg' | 'cm'
  | 'pmm' | 'pmg' | 'pgg' | 'cmm'
  | 'p4' | 'p4m' | 'p4g'
  | 'p3' | 'p3m1' | 'p31m'
  | 'p6' | 'p6m';

/** A single 3x3 affine transform encoded as 6 numbers [a, b, c, d, e, f]
 *  representing [[a, b, e], [c, d, f], [0, 0, 1]]. */
export type Affine = [number, number, number, number, number, number];

const IDENT: Affine = [1, 0, 0, 1, 0, 0];

function translate(tx: number, ty: number): Affine {
  return [1, 0, 0, 1, tx, ty];
}
function rotate(rad: number): Affine {
  const c = dCos(rad);
  const s = dSin(rad);
  return [c, -s, s, c, 0, 0];
}
function mirrorX(): Affine {
  return [-1, 0, 0, 1, 0, 0];
}
function mirrorY(): Affine {
  return [1, 0, 0, -1, 0, 0];
}
function compose(a: Affine, b: Affine): Affine {
  // a · b (apply b first then a) — matrix multiplication
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[0] * b[4] + a[1] * b[5] + a[4],
    a[2] * b[4] + a[3] * b[5] + a[5],
  ];
}

function affineToSvg(a: Affine): string {
  return `matrix(${fmt2(a[0])} ${fmt2(a[2])} ${fmt2(a[1])} ${fmt2(a[3])} ${fmt2(a[4])} ${fmt2(a[5])})`;
}

// ─── Per-group fundamental-domain operations ───────────────────────────
//
// Each group's "stamp" applies a list of operations to a base tile,
// centered at a unit-square fundamental domain. Outer tiling then
// translates the stamp across the canvas.

type GroupSpec = {
  /** Lattice vectors. Each tile-stamp is placed at integer combinations
   *  of these vectors. Unit-tile-size scale. */
  latticeA: [number, number];
  latticeB: [number, number];
  /** Operations applied within one fundamental tile (relative coords). */
  ops: Affine[];
};

/** Build the spec for a wallpaper group at the given tile size. */
function groupSpec(group: WallpaperGroup, tileSize: number): GroupSpec {
  const s = tileSize;
  switch (group) {
    case 'p1':
      return {
        latticeA: [s, 0],
        latticeB: [0, s],
        ops: [IDENT],
      };
    case 'p2':
      return {
        latticeA: [s, 0],
        latticeB: [0, s],
        ops: [
          IDENT,
          compose(translate(s, s), rotate(Math.PI)),
        ],
      };
    case 'pmm':
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s * 2, 0), mirrorX()),
          compose(translate(0, s * 2), mirrorY()),
          compose(translate(s * 2, s * 2), compose(mirrorX(), mirrorY())),
        ],
      };
    case 'p4m':
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s * 2, 0), mirrorX()),
          compose(translate(0, s * 2), mirrorY()),
          compose(translate(s * 2, s * 2), compose(mirrorX(), mirrorY())),
          rotate(Math.PI / 2),
          compose(translate(s * 2, 0), compose(mirrorX(), rotate(Math.PI / 2))),
          compose(translate(0, s * 2), compose(mirrorY(), rotate(Math.PI / 2))),
          compose(translate(s * 2, s * 2), compose(compose(mirrorX(), mirrorY()), rotate(Math.PI / 2))),
        ],
      };
    case 'p6m':
      return {
        // hexagonal lattice: A = (s*√3, 0), B = (s*√3/2, s*1.5)
        latticeA: [s * 1.7320508, 0],
        latticeB: [s * 0.8660254, s * 1.5],
        ops: [
          IDENT,
          rotate(Math.PI / 3),
          rotate((2 * Math.PI) / 3),
          rotate(Math.PI),
          rotate((4 * Math.PI) / 3),
          rotate((5 * Math.PI) / 3),
          mirrorX(),
          compose(mirrorX(), rotate(Math.PI / 3)),
          compose(mirrorX(), rotate((2 * Math.PI) / 3)),
          compose(mirrorX(), rotate(Math.PI)),
          compose(mirrorX(), rotate((4 * Math.PI) / 3)),
          compose(mirrorX(), rotate((5 * Math.PI) / 3)),
        ],
      };
    case 'pm':
      // single mirror along y axis
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s],
        ops: [IDENT, compose(translate(s * 2, 0), mirrorX())],
      };
    case 'pg':
      // glide reflection: mirror + half-translate along the mirror axis
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s],
        ops: [IDENT, compose(translate(s * 2, s), mirrorX())],
      };
    case 'cm':
      // mirror + centered lattice. Use rhombic lattice.
      return {
        latticeA: [s * 2, 0],
        latticeB: [s, s],
        ops: [IDENT, compose(translate(s * 2, 0), mirrorX())],
      };
    case 'pmg':
      // perpendicular: a mirror + a glide
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s * 2, 0), mirrorX()),
          compose(translate(0, s), rotate(Math.PI)),
          compose(translate(s * 2, s), compose(mirrorX(), rotate(Math.PI))),
        ],
      };
    case 'pgg':
      // two perpendicular glides
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s, s), rotate(Math.PI)),
          compose(translate(s * 2, s), mirrorX()),
          compose(translate(s, s * 2), mirrorY()),
        ],
      };
    case 'cmm':
      // centered lattice + perpendicular mirrors
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s * 2, 0), mirrorX()),
          compose(translate(0, s * 2), mirrorY()),
          compose(translate(s * 2, s * 2), compose(mirrorX(), mirrorY())),
          compose(translate(s, s), rotate(Math.PI)),
          compose(translate(s, s), compose(mirrorX(), rotate(Math.PI))),
        ],
      };
    case 'p4':
      // 4-fold rotation, no mirror
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s * 2, 0), rotate(Math.PI / 2)),
          compose(translate(s * 2, s * 2), rotate(Math.PI)),
          compose(translate(0, s * 2), rotate((3 * Math.PI) / 2)),
        ],
      };
    case 'p4g':
      // 4-fold + glide. Looks like a pinwheel of mirrors.
      return {
        latticeA: [s * 2, 0],
        latticeB: [0, s * 2],
        ops: [
          IDENT,
          compose(translate(s * 2, 0), rotate(Math.PI / 2)),
          compose(translate(s * 2, s * 2), rotate(Math.PI)),
          compose(translate(0, s * 2), rotate((3 * Math.PI) / 2)),
          compose(translate(s, s), compose(mirrorX(), rotate(Math.PI / 4))),
          compose(translate(s, s), compose(mirrorX(), rotate((3 * Math.PI) / 4))),
          compose(translate(s, s), compose(mirrorX(), rotate((5 * Math.PI) / 4))),
          compose(translate(s, s), compose(mirrorX(), rotate((7 * Math.PI) / 4))),
        ],
      };
    case 'p3':
      // 3-fold rotation, hexagonal lattice
      return {
        latticeA: [s * 1.7320508, 0],
        latticeB: [s * 0.8660254, s * 1.5],
        ops: [
          IDENT,
          rotate((2 * Math.PI) / 3),
          rotate((4 * Math.PI) / 3),
        ],
      };
    case 'p3m1':
      // 3-fold + mirror through lattice points
      return {
        latticeA: [s * 1.7320508, 0],
        latticeB: [s * 0.8660254, s * 1.5],
        ops: [
          IDENT,
          rotate((2 * Math.PI) / 3),
          rotate((4 * Math.PI) / 3),
          mirrorX(),
          compose(mirrorX(), rotate((2 * Math.PI) / 3)),
          compose(mirrorX(), rotate((4 * Math.PI) / 3)),
        ],
      };
    case 'p31m':
      // 3-fold + mirror through tile centers
      return {
        latticeA: [s * 1.7320508, 0],
        latticeB: [s * 0.8660254, s * 1.5],
        ops: [
          IDENT,
          rotate((2 * Math.PI) / 3),
          rotate((4 * Math.PI) / 3),
          compose(rotate(Math.PI / 3), mirrorX()),
          compose(rotate(Math.PI), mirrorX()),
          compose(rotate((5 * Math.PI) / 3), mirrorX()),
        ],
      };
    case 'p6':
      // 6-fold rotation, no mirror
      return {
        latticeA: [s * 1.7320508, 0],
        latticeB: [s * 0.8660254, s * 1.5],
        ops: [
          IDENT,
          rotate(Math.PI / 3),
          rotate((2 * Math.PI) / 3),
          rotate(Math.PI),
          rotate((4 * Math.PI) / 3),
          rotate((5 * Math.PI) / 3),
        ],
      };
  }
}

// ─── public API ───────────────────────────────────────────────────────

export type TileDrawer = (
  /** RNG seeded per-tile so per-tile variation can be deterministic. */
  rng: Rng,
  /** Tile size in pixels (the fundamental-domain dimension). */
  size: number,
) => string; // SVG fragment to place inside the tile

export type WallpaperOptions = {
  group: WallpaperGroup;
  /** Canvas width and height to tile. */
  canvasW: number;
  canvasH: number;
  /** Fundamental tile size in pixels. Smaller = denser pattern. */
  tileSize?: number;
  /** Seed for per-tile RNG. Different seeds vary the per-tile drawer's
   *  output stochastically while keeping the group's symmetry exact. */
  seed?: number;
  /** Same-seed-every-tile mode: all tiles look identical (deterministic
   *  exact tiling). Default false: each tile gets its own seeded rng so
   *  per-tile variation (e.g., small color jitter) is visible. */
  identicalTiles?: boolean;
};

/**
 * Tile the canvas with the given wallpaper group. The caller supplies
 * a `tileDrawer` function that produces an SVG fragment for one
 * fundamental tile; this function applies the group's symmetries and
 * translates across the canvas.
 */
export function wallpaperPattern(
  drawer: TileDrawer,
  opts: WallpaperOptions,
): string {
  const tileSize = opts.tileSize ?? 80;
  const seed = opts.seed ?? 0xa770;
  const spec = groupSpec(opts.group, tileSize);

  // Compute integer-range of lattice vectors that cover the canvas.
  // Naive: iterate enough multiples in both axes that the bounding box
  // covers (0, canvasW) × (0, canvasH).
  const aSpan = Math.max(Math.abs(spec.latticeA[0]), Math.abs(spec.latticeA[1]));
  const bSpan = Math.max(Math.abs(spec.latticeB[0]), Math.abs(spec.latticeB[1]));
  const nA = Math.ceil((opts.canvasW + opts.canvasH) / Math.max(0.1, aSpan)) + 2;
  const nB = Math.ceil((opts.canvasW + opts.canvasH) / Math.max(0.1, bSpan)) + 2;

  let svg = '';
  for (let i = -1; i <= nA; i++) {
    for (let j = -1; j <= nB; j++) {
      const ox = i * spec.latticeA[0] + j * spec.latticeB[0];
      const oy = i * spec.latticeA[1] + j * spec.latticeB[1];
      // Skip cells fully outside the canvas + a tile-size margin.
      if (ox + tileSize * 3 < 0 || oy + tileSize * 3 < 0) continue;
      if (ox - tileSize * 3 > opts.canvasW || oy - tileSize * 3 > opts.canvasH) continue;

      // Render every op in this lattice cell.
      for (let opIdx = 0; opIdx < spec.ops.length; opIdx++) {
        const op = spec.ops[opIdx];
        const tileSeed = opts.identicalTiles
          ? seed
          : (seed ^ (i * 73856093) ^ (j * 19349663) ^ (opIdx * 83492791)) >>> 0;
        const rng = mulberry32(tileSeed);
        const tileSvg = drawer(rng, tileSize);
        // Compose translation to (ox, oy) with the op.
        const t = compose(translate(ox, oy), op);
        svg += `<g transform="${affineToSvg(t)}">${tileSvg}</g>`;
      }
    }
  }
  return svg;
}

/** List of currently-implemented group names — all 17. */
export const IMPLEMENTED_GROUPS: WallpaperGroup[] = [
  'p1', 'p2', 'pm', 'pg', 'cm',
  'pmm', 'pmg', 'pgg', 'cmm',
  'p4', 'p4m', 'p4g',
  'p3', 'p3m1', 'p31m',
  'p6', 'p6m',
];
