/**
 * Truchet tiles — Sébastien Truchet's 1704 system for generating
 * complex patterns from a single simple tile with random orientation.
 *
 * The original Truchet tile is a square divided into two equal triangles
 * of opposite color. Placed in a grid with each tile randomly rotated
 * in one of four orientations, the result is a tessellation with
 * surprisingly rich emergent paths.
 *
 * In 1987, Cyril Stanley Smith and Pollack's "Studies in the Pattern of
 * Truchet" generalized the system to include arc-based tiles (two
 * quarter-circles connecting opposite corners). The arc version produces
 * the iconic flowing labyrinth pattern seen in pen-art mathematical
 * coloring books and contemporary plotter art.
 *
 * Variants implemented:
 *   - 'triangle' classic two-triangle tile (4 orientations)
 *   - 'arc'      quarter-circle arcs (2 orientations: NW-SE or NE-SW)
 *   - 'diagonal' single diagonal line (2 orientations)
 *   - 'maze'     orthogonal line segments (5 patterns) — Hilbert-curve style
 *
 * Sources:
 *   - Truchet 1704, "Memoire sur les Combinaisons"
 *   - Smith, Pollack 1987, "The Tiling Patterns of Sebastien Truchet"
 *   - Bosch & Colley 2013, "Aesthetic Considerations of Truchet"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { mulberry32 } from '../../illustrator/rng';

export type TruchetVariant = 'triangle' | 'arc' | 'diagonal' | 'maze';

export type TruchetOptions = {
  variant: TruchetVariant;
  /** Canvas size. */
  width: number;
  height: number;
  /** Tile side length in pixels. Smaller = denser pattern. Default 40. */
  tileSize?: number;
  /** Foreground color (the "ink"). */
  color?: string;
  /** Background fill. Default no fill (transparent). */
  background?: string;
  /** Stroke width for arc/diagonal/maze variants. Default 0.25 of tile. */
  strokeWidth?: number;
  /** Seed for tile orientation. */
  seed?: number;
};

/** Render a Truchet tessellation as an SVG fragment. */
export function truchet(opts: TruchetOptions): string {
  const ts = opts.tileSize ?? 40;
  const color = opts.color ?? '#39312a';
  const sw = opts.strokeWidth ?? ts * 0.25;
  const bg = opts.background;
  const seed = opts.seed ?? 0x77ce;
  const rng = mulberry32(seed);

  const cols = Math.ceil(opts.width / ts) + 1;
  const rows = Math.ceil(opts.height / ts) + 1;

  let svg = bg ? `<rect width="${fmt2(opts.width)}" height="${fmt2(opts.height)}" fill="${bg}"/>` : '';

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * ts;
      const y = j * ts;
      svg += `<g transform="translate(${fmt2(x)} ${fmt2(y)})">`;
      switch (opts.variant) {
        case 'triangle': {
          // 4 rotations. Each tile is half-filled: NW-SE diagonal triangle.
          const r = Math.floor(rng() * 4);
          const angle = r * 90;
          svg += `<g transform="rotate(${angle} ${fmt2(ts / 2)} ${fmt2(ts / 2)})">`;
          svg += `<polygon points="0,0 ${fmt2(ts)},0 0,${fmt2(ts)}" fill="${color}"/>`;
          svg += `</g>`;
          break;
        }
        case 'arc': {
          // Two quarter-circles. Two configurations: NW-SE or NE-SW corners.
          const orient = rng() < 0.5;
          if (orient) {
            // Arcs from NW corner and SE corner
            svg += `<path d="M0,${fmt2(ts / 2)} A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 1 ${fmt2(ts / 2)},0" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
            svg += `<path d="M${fmt2(ts)},${fmt2(ts / 2)} A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 1 ${fmt2(ts / 2)},${fmt2(ts)}" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
          } else {
            // Arcs from NE corner and SW corner
            svg += `<path d="M${fmt2(ts / 2)},0 A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 1 ${fmt2(ts)},${fmt2(ts / 2)}" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
            svg += `<path d="M${fmt2(ts / 2)},${fmt2(ts)} A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 1 0,${fmt2(ts / 2)}" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
          }
          break;
        }
        case 'diagonal': {
          // Single diagonal: \ or /
          const orient = rng() < 0.5;
          if (orient) {
            svg += `<line x1="0" y1="0" x2="${fmt2(ts)}" y2="${fmt2(ts)}" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
          } else {
            svg += `<line x1="${fmt2(ts)}" y1="0" x2="0" y2="${fmt2(ts)}" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
          }
          break;
        }
        case 'maze': {
          // 5 patterns: 4 elbows + 1 straight (random rotation).
          // Each is a quarter-circle in one corner + a half-line.
          const r = Math.floor(rng() * 5);
          // Use straight (vertical or horizontal) for 0 and 1; elbows for 2-5
          switch (r) {
            case 0:
              svg += `<line x1="${fmt2(ts / 2)}" y1="0" x2="${fmt2(ts / 2)}" y2="${fmt2(ts)}" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
              break;
            case 1:
              svg += `<line x1="0" y1="${fmt2(ts / 2)}" x2="${fmt2(ts)}" y2="${fmt2(ts / 2)}" stroke="${color}" stroke-width="${fmt2(sw)}" stroke-linecap="square"/>`;
              break;
            case 2:
              svg += `<path d="M${fmt2(ts / 2)},0 A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 0 0,${fmt2(ts / 2)}" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}"/>`;
              break;
            case 3:
              svg += `<path d="M${fmt2(ts / 2)},0 A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 1 ${fmt2(ts)},${fmt2(ts / 2)}" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}"/>`;
              break;
            case 4:
              svg += `<path d="M0,${fmt2(ts / 2)} A${fmt2(ts / 2)},${fmt2(ts / 2)} 0 0 0 ${fmt2(ts / 2)},${fmt2(ts)}" fill="none" stroke="${color}" stroke-width="${fmt2(sw)}"/>`;
              break;
          }
          break;
        }
      }
      svg += `</g>`;
    }
  }
  return svg;
}
