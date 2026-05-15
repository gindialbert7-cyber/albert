/**
 * Sfumato — Leonardo's "vanishing like smoke" edge.
 *
 * Crucially: sfumato is not a value gradient, it is a *chromatic*
 * gradient across a band. Leonardo built up 20-40 translucent glazes
 * 1-2 microns thick (up to 30-40 in shadow), each layer ~8% pigment,
 * so light entered the film stack, scattered multiply, and exited
 * with a hue shifted toward warmer or cooler neighbors.
 *
 * Mathematically: not lerp(colorA, colorB, t), but a Bezier curve
 * in OKLab from colorA through a midpoint that is BOTH the L-average
 * AND a hue rotated toward the warm/cool of the adjacent regions.
 *
 * This module exposes:
 *   - sfumatoEdgeSvg(edgePts, colorA, colorB, opt) — emits SVG
 *   - sfumatoColorAt(t, colorA, colorB, opt) — sample for compositing
 *
 * The SVG encoding strategy: render the edge band as a sequence of
 * narrow quads (ribbon strip), each filled with the local chromatic
 * sample. Width grows along arc length to feel painted.
 *
 * For Leonardo-faithful sfumato: warm midpoint hueShift = -8° to -12°
 * for skin / shadow; cool midpoint hueShift = +5° to +10° for sky /
 * stone. Band width 6-25 px depending on figure scale.
 *
 * Sources:
 *   - Leonardo, Trattato §VII (color), §V (notebooks)
 *   - C2RMF / ESRF X-Ray Fluorescence on Mona Lisa (de Viguerie 2010)
 *   - Bambach, "Leonardo's Sfumato and the Optics of Painting"
 */

import type { Pt } from '../../illustrator/geometry';
import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';
import {
  linearToOklab,
  oklabToLinear,
} from '../../illustrator/colors/oklab';

export type SfumatoOptions = {
  /** Band width in canvas pixels. Default 12. */
  width?: number;
  /** Bezier hue shift toward warm at midpoint, degrees. Negative = warmer. */
  warmShiftDeg?: number;
  /** Bezier hue shift toward cool at midpoint (opposing). Default 0. */
  coolShiftDeg?: number;
  /** How strongly the chromatic interpolation displaces from straight L lerp.
   *  0 = straight value gradient (chiaroscuro), 1 = pure chromatic. Default 0.5. */
  chromaticity?: number;
  /** Number of band sub-strips (visual smoothness). Default 12. */
  bands?: number;
  /** Per-band overlap (px) so adjacent strips merge seamlessly. Default 0.6. */
  overlap?: number;
};

const DEFAULTS: Required<SfumatoOptions> = {
  width: 12,
  warmShiftDeg: -8,
  coolShiftDeg: 0,
  chromaticity: 0.5,
  bands: 12,
  overlap: 0.6,
};

// ─── color helpers ──────────────────────────────────────────────────────────

function hexToLinear(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  // Approximate sRGB->linear (matches oklab.ts approach to stay deterministic).
  const lin = (c: number): number => {
    if (c <= 0.04045) return c / 12.92;
    const y = (c + 0.055) / 1.055;
    return y * y * y * (0.9479 - 0.9036 * y + 0.5557 * y * y) + 0.0103 * y;
  };
  return [lin(r), lin(g), lin(b)];
}

function linearToHex([r, g, b]: [number, number, number]): string {
  const toS = (c: number): number => {
    if (c <= 0.0031308) return 12.92 * c;
    // Inverse polynomial fit for ((c)^(1/2.4) * 1.055 - 0.055), via simpler
    // approximation: y = 1.055 * c^0.4 - 0.055. For 0.003 < c < 1.
    // We approximate c^0.4 by a poly fit (matches the inverse in oklab.ts).
    const x = c <= 0 ? 0 : c >= 1 ? 1 : c;
    const x04 = x * (1.7349 - 1.7146 * x + 1.5046 * x * x - 0.8042 * x * x * x + 0.2793 * x * x * x * x);
    return 1.055 * x04 - 0.055;
  };
  const cr = Math.max(0, Math.min(255, Math.round(toS(r) * 255)));
  const cg = Math.max(0, Math.min(255, Math.round(toS(g) * 255)));
  const cb = Math.max(0, Math.min(255, Math.round(toS(b) * 255)));
  return '#' + ((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0');
}

/** Rotate (a,b) by angle radians around the L axis, preserving chroma. */
function rotateAB(lab: [number, number, number], radians: number): [number, number, number] {
  const c = dCos(radians);
  const s = dSin(radians);
  return [lab[0], lab[1] * c - lab[2] * s, lab[1] * s + lab[2] * c];
}

/** Quadratic Bezier in OKLab: (1-t)²·A + 2(1-t)t·M + t²·B. */
function quadOklab(
  A: [number, number, number],
  M: [number, number, number],
  B: [number, number, number],
  t: number,
): [number, number, number] {
  const u = 1 - t;
  return [
    u * u * A[0] + 2 * u * t * M[0] + t * t * B[0],
    u * u * A[1] + 2 * u * t * M[1] + t * t * B[1],
    u * u * A[2] + 2 * u * t * M[2] + t * t * B[2],
  ];
}

// ─── public API ───────────────────────────────────────────────────────────

/**
 * Sample the sfumato gradient color at parameter t∈[0,1].
 * t=0 returns colorA, t=1 returns colorB, t=0.5 returns the chromatic
 * Bezier midpoint (NOT the straight average).
 */
export function sfumatoColorAt(
  t: number,
  colorA: string,
  colorB: string,
  opt: SfumatoOptions = {},
): string {
  const o = { ...DEFAULTS, ...opt };
  const labA = linearToOklab(hexToLinear(colorA));
  const labB = linearToOklab(hexToLinear(colorB));

  // Build the chromatic midpoint: average L, but rotate the (a,b)
  // direction by warmShift (or coolShift if positive).
  const Lmid = (labA[0] + labB[0]) / 2;
  const aMid = (labA[1] + labB[1]) / 2;
  const bMid = (labA[2] + labB[2]) / 2;
  const totalShiftDeg = o.warmShiftDeg + o.coolShiftDeg;
  const rotated = rotateAB([Lmid, aMid, bMid], (totalShiftDeg * Math.PI) / 180);
  // Blend the rotated mid with the straight mid by chromaticity.
  const M: [number, number, number] = [
    Lmid,
    aMid + (rotated[1] - aMid) * o.chromaticity,
    bMid + (rotated[2] - bMid) * o.chromaticity,
  ];

  const sampledLab = quadOklab(labA, M, labB, t);
  const sampledLin = oklabToLinear(sampledLab);
  return linearToHex(sampledLin);
}

/**
 * Render an edge as a sfumato band. Returns SVG fragment.
 *
 * The edge is a polyline; each consecutive segment becomes a perpendicular
 * ribbon of `bands` colored stripes, transitioning from colorA on the
 * "interior" side to colorB on the "exterior" side along a chromatic
 * Bezier (NOT a straight value gradient).
 */
export function sfumatoEdgeSvg(
  edge: Pt[],
  colorA: string,
  colorB: string,
  opt: SfumatoOptions = {},
): string {
  if (edge.length < 2) return '';
  const o = { ...DEFAULTS, ...opt };
  const w = o.width;
  const halfW = w / 2;

  let svg = '';

  // Pre-compute the chromatic samples for this edge.
  const samples: string[] = [];
  for (let k = 0; k < o.bands; k++) {
    const t = (k + 0.5) / o.bands;
    samples.push(sfumatoColorAt(t, colorA, colorB, opt));
  }

  // For each segment of the polyline, lay down `bands` parallel narrow
  // strips perpendicular to the segment direction.
  for (let i = 0; i + 1 < edge.length; i++) {
    const [x1, y1] = edge[i];
    const [x2, y2] = edge[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) continue;
    const ux = dx / len;
    const uy = dy / len;
    // Perpendicular (left = -uy, ux ; right = +uy, -ux)
    const px = -uy;
    const py = ux;

    for (let k = 0; k < o.bands; k++) {
      const t = (k + 0.5) / o.bands; // strip center across the band
      const offset = (t - 0.5) * w; // -halfW..+halfW
      const stripWidth = w / o.bands + o.overlap;

      const x0a = x1 + px * (offset - stripWidth / 2);
      const y0a = y1 + py * (offset - stripWidth / 2);
      const x0b = x1 + px * (offset + stripWidth / 2);
      const y0b = y1 + py * (offset + stripWidth / 2);
      const x1a = x2 + px * (offset - stripWidth / 2);
      const y1a = y2 + py * (offset - stripWidth / 2);
      const x1b = x2 + px * (offset + stripWidth / 2);
      const y1b = y2 + py * (offset + stripWidth / 2);

      const color = samples[k];
      // Smoke-like opacity falloff toward edges of the band.
      const tabsCenter = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
      const opacity = 1 - tabsCenter * tabsCenter * 0.4; // soft drop-off

      svg += `<polygon points="${fmt2(x0a)},${fmt2(y0a)} ${fmt2(x0b)},${fmt2(y0b)} ${fmt2(x1b)},${fmt2(y1b)} ${fmt2(x1a)},${fmt2(y1a)}" fill="${color}" opacity="${fmt2(opacity)}" stroke="none"/>`;
    }
    void halfW;
  }

  return svg;
}

/**
 * Convenience: build a 5-stop linear-gradient definition + a fill
 * reference for an SVG path. Useful when the renderer wants to fill
 * a region's stroke with a sfumato band rather than draw a ribbon.
 *
 * Returns { defsSvg, fillRef }.
 */
export function sfumatoLinearGradient(
  id: string,
  colorA: string,
  colorB: string,
  angleDeg: number,
  opt: SfumatoOptions = {},
): { defsSvg: string; fillRef: string } {
  const stops: { offset: number; color: string }[] = [
    { offset: 0.00, color: sfumatoColorAt(0.00, colorA, colorB, opt) },
    { offset: 0.20, color: sfumatoColorAt(0.20, colorA, colorB, opt) },
    { offset: 0.40, color: sfumatoColorAt(0.40, colorA, colorB, opt) },
    { offset: 0.60, color: sfumatoColorAt(0.60, colorA, colorB, opt) },
    { offset: 0.80, color: sfumatoColorAt(0.80, colorA, colorB, opt) },
    { offset: 1.00, color: sfumatoColorAt(1.00, colorA, colorB, opt) },
  ];
  const x2 = dCos((angleDeg * Math.PI) / 180);
  const y2 = dSin((angleDeg * Math.PI) / 180);
  const defsSvg = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${fmt2(x2)}" y2="${fmt2(y2)}">${stops
    .map((s) => `<stop offset="${fmt2(s.offset * 100)}%" stop-color="${s.color}"/>`)
    .join('')}</linearGradient></defs>`;
  return { defsSvg, fillRef: `url(#${id})` };
}
