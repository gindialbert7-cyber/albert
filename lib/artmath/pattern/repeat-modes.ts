/**
 * Repeat modes — the industry-standard tile-placement schemes used in
 * textile / wallpaper / surface design.
 *
 * Most pattern modules produce a single "tile unit" (motif). What makes
 * the unit a *pattern* is the repeat: how the unit is placed against
 * itself across an arbitrarily large fabric or print run.
 *
 * Five repeat modes covering ~99% of commercial textile use:
 *   - 'straight'  AKA block-repeat. Tile placed at integer lattice (0,0).
 *                 The default for geometric prints.
 *   - 'half-drop' Adjacent columns offset by half tile-height. The
 *                 dominant repeat for wallpaper and the "Liberty"-style
 *                 floral print.
 *   - 'brick'     Adjacent rows offset by half tile-width. Subway-tile,
 *                 masonry, packaging.
 *   - 'mirror'    Adjacent tiles flipped horizontally/vertically.
 *                 Eliminates visible seams; common in scarves.
 *   - 'ogival'    Diamond/diagonal lattice — half-drop with 60° axis.
 *                 Historical: Persian rugs, Italian damask.
 *
 * This module takes a *tile renderer* (a function that emits an SVG
 * fragment for one fixed-size tile) and tiles it according to the chosen
 * repeat. Output is a single SVG fragment ready to embed.
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { mulberry32, type Rng } from '../../illustrator/rng';

export type RepeatMode = 'straight' | 'half-drop' | 'brick' | 'mirror' | 'ogival';

export type RepeatOptions = {
  mode: RepeatMode;
  /** Tile unit width and height in pixels. */
  tileW: number;
  tileH: number;
  /** Canvas size to fill. */
  canvasW: number;
  canvasH: number;
  /** Seed forwarded to the tile renderer per tile (so each tile gets a
   *  deterministic but distinct rng). If `identicalTiles` is true, every
   *  tile uses the same seed. Default false. */
  seed?: number;
  identicalTiles?: boolean;
};

export type TileRenderer = (rng: Rng, tileW: number, tileH: number) => string;

/** Render the tile across the canvas using the chosen repeat mode. */
export function repeatTile(renderer: TileRenderer, opts: RepeatOptions): string {
  const seed = opts.seed ?? 0xc0c0;
  const tw = opts.tileW;
  const th = opts.tileH;
  const cols = Math.ceil(opts.canvasW / tw) + 2;
  const rows = Math.ceil(opts.canvasH / th) + 2;

  let svg = '';
  // Ogival uses a half-row stride (rows are th/2 apart with odd rows
  // shifted right by tw/2). Other modes step one full tile per row.
  const yStep = opts.mode === 'ogival' ? th / 2 : th;
  const ogivalRows = Math.ceil(opts.canvasH / yStep) + 2;
  const rowMax = opts.mode === 'ogival' ? ogivalRows : rows;
  for (let j = -1; j < rowMax; j++) {
    for (let i = -1; i < cols; i++) {
      let x = i * tw;
      let y = opts.mode === 'ogival' ? j * yStep : j * th;
      let transform = '';
      switch (opts.mode) {
        case 'straight':
          // Default.
          break;
        case 'half-drop':
          // Odd columns offset down by tileH/2.
          if (((i % 2) + 2) % 2 === 1) y += th / 2;
          break;
        case 'brick':
          // Odd rows offset right by tileW/2.
          if (((j % 2) + 2) % 2 === 1) x += tw / 2;
          break;
        case 'mirror': {
          // Flip horizontally on odd columns and vertically on odd rows.
          const fx = ((i % 2) + 2) % 2 === 1;
          const fy = ((j % 2) + 2) % 2 === 1;
          if (fx && fy) transform = ` scale(-1 -1) translate(${fmt2(-tw)} ${fmt2(-th)})`;
          else if (fx) transform = ` scale(-1 1) translate(${fmt2(-tw)} 0)`;
          else if (fy) transform = ` scale(1 -1) translate(0 ${fmt2(-th)})`;
          break;
        }
        case 'ogival':
          // Diamond lattice: rows are spaced th/2 apart; odd rows shift
          // right by tw/2. Creates a tight, gap-free diamond pattern.
          if (((j % 2) + 2) % 2 === 1) x += tw / 2;
          break;
      }
      const tileSeed = opts.identicalTiles
        ? seed
        : (seed ^ (i * 2654435761) ^ (j * 40503)) >>> 0;
      const rng = mulberry32(tileSeed);
      const inner = renderer(rng, tw, th);
      svg += `<g transform="translate(${fmt2(x)} ${fmt2(y)})${transform}">${inner}</g>`;
    }
  }
  return svg;
}

/** Human-readable description of a repeat mode, for UI tooltips. */
export function repeatDescription(mode: RepeatMode): string {
  switch (mode) {
    case 'straight':
      return 'Block repeat — tile placed straight in a grid.';
    case 'half-drop':
      return 'Half-drop — adjacent columns offset by half tile height. Hides vertical seams.';
    case 'brick':
      return 'Brick repeat — adjacent rows offset by half tile width. Hides horizontal seams.';
    case 'mirror':
      return 'Mirror repeat — adjacent tiles flipped. Eliminates all seams, doubles motif visibility.';
    case 'ogival':
      return 'Ogival / diamond repeat — diagonal lattice. Persian / damask aesthetic.';
  }
}
