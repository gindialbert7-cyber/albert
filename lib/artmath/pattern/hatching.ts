/**
 * Cross-hatching — tonal rendering by parallel line strokes.
 *
 * Albrecht Dürer perfected cross-hatching in the late 1400s in his
 * engravings: tone is built up by parallel pen lines, deeper tones by
 * crossing a second set of lines at an angle. By Rembrandt's era this
 * had become the dominant western drawing language for shadow.
 *
 * Algorithm: for each tonal level, draw a set of parallel lines at the
 * appropriate spacing and angle. Subsequent darker tones add new line
 * sets at rotated angles. A density mask determines which regions get
 * which depth of hatching.
 *
 * Output is a single SVG fragment of <line> elements, all at the given
 * stroke color.
 *
 * This module supports:
 *   - 'parallel'    single direction
 *   - 'cross'       two perpendicular directions
 *   - 'triple'      three directions at 60°
 *   - 'rembrandt'   variable-direction following a "form-flow" field
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';
import { mulberry32 } from '../../illustrator/rng';

export type HatchStyle = 'parallel' | 'cross' | 'triple' | 'rembrandt';

export type HatchOptions = {
  /** Region width and height. */
  width: number;
  height: number;
  /** Tone in [0, 1]; 0 = paper white, 1 = ink black. Sets line spacing. */
  tone: number;
  style: HatchStyle;
  /** Primary hatch angle in radians. 0 = horizontal. Default π/4. */
  angle?: number;
  /** Line color. Default near-black. */
  color?: string;
  /** Stroke width. Default 0.7. */
  strokeWidth?: number;
  /** Minimum line spacing in pixels (densest hatching). Default 2.0. */
  minSpacing?: number;
  /** Maximum line spacing in pixels (lightest hatching, tone~0.05). Default 16. */
  maxSpacing?: number;
  /** Small wobble in line positions to feel hand-drawn. 0 = perfect, 1 = wild. Default 0.25. */
  jitter?: number;
  /** Seed for jitter. */
  seed?: number;
};

/** Produce SVG hatching lines for a rectangular region. */
export function hatch(opts: HatchOptions): string {
  const tone = Math.max(0.04, Math.min(1, opts.tone));
  const angle = opts.angle ?? Math.PI / 4;
  const color = opts.color ?? '#28201a';
  const sw = opts.strokeWidth ?? 0.7;
  const sMin = opts.minSpacing ?? 2.0;
  const sMax = opts.maxSpacing ?? 16;
  const jitter = opts.jitter ?? 0.25;
  const seed = opts.seed ?? 0xeed;

  // Spacing: inverse to tone.
  const spacing = sMin + (1 - tone) * (sMax - sMin);

  const rng = mulberry32(seed);

  // Helper: draw one set of parallel lines spanning the rect, at given angle.
  const drawSet = (theta: number, sIdx: number): string => {
    let svg = '';
    const cosT = dCos(theta);
    const sinT = dSin(theta);
    // Diagonal of the rect gives max line length needed.
    const diag = Math.sqrt(opts.width * opts.width + opts.height * opts.height);
    // The perpendicular direction (cos+π/2, sin+π/2).
    const px = -sinT;
    const py = cosT;
    // Start at the bottom-left, scan along the perpendicular axis.
    const cx = opts.width / 2;
    const cy = opts.height / 2;
    const numLines = Math.ceil(diag / spacing) + 4;
    for (let i = -numLines; i <= numLines; i++) {
      const j = (rng() - 0.5) * jitter * spacing;
      const offset = i * spacing + j;
      const ax = cx + px * offset;
      const ay = cy + py * offset;
      // The line in the angle direction, from (ax, ay) extended ±diag/2.
      const x1 = ax - cosT * diag;
      const y1 = ay - sinT * diag;
      const x2 = ax + cosT * diag;
      const y2 = ay + sinT * diag;
      // Crop conservatively by leaving the SVG renderer to clip via parent.
      // Width jitter: vary stroke width slightly per line.
      const w = sw * (0.8 + rng() * 0.4);
      // Skip a small fraction of lines stochastically to mimic hand
      // pen-lift between strokes.
      if (rng() < 0.05) continue;
      svg += `<line x1="${fmt2(x1)}" y1="${fmt2(y1)}" x2="${fmt2(x2)}" y2="${fmt2(y2)}" stroke="${color}" stroke-width="${fmt2(w)}" stroke-linecap="round"/>`;
      void sIdx;
    }
    return svg;
  };

  let svg = '';
  switch (opts.style) {
    case 'parallel':
      svg += drawSet(angle, 0);
      break;
    case 'cross':
      svg += drawSet(angle, 0);
      svg += drawSet(angle + Math.PI / 2, 1);
      break;
    case 'triple':
      svg += drawSet(angle, 0);
      svg += drawSet(angle + Math.PI / 3, 1);
      svg += drawSet(angle + (2 * Math.PI) / 3, 2);
      break;
    case 'rembrandt': {
      // Five layers rotating slightly, each less dense than the last —
      // simulates the gradual buildup in Rembrandt's drypoints.
      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const a = angle + (i / layers) * Math.PI * 0.25;
        const layerTone = tone * (1 - i / (layers + 1));
        const layerSpacing = sMin + (1 - layerTone) * (sMax - sMin);
        // Override spacing for this layer by temporarily faking opts.
        const sub: HatchOptions = {
          ...opts,
          tone: layerTone,
          angle: a,
          style: 'parallel',
          minSpacing: sMin,
          maxSpacing: sMax,
          seed: seed ^ (i * 374761393),
        };
        void layerSpacing;
        svg += hatch(sub);
      }
      break;
    }
  }
  return svg;
}

/** Build hatching strength for a tone level — useful for value-mapped
 *  hatching where a caller wants a specific number of crossing sets. */
export function hatchLayerCount(tone: number): number {
  // Empirical curve from Dürer engravings: 1 layer at tone < 0.25,
  // 2 at 0.25-0.55, 3 at 0.55-0.80, 4+ at 0.80+.
  if (tone < 0.25) return 1;
  if (tone < 0.55) return 2;
  if (tone < 0.8) return 3;
  return 4;
}
