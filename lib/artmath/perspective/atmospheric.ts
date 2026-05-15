/**
 * Atmospheric perspective — the single biggest visual depth-lever.
 *
 * Leonardo (Trattato §136-137): "Colours become weaker in proportion
 * to their distance from the person who is looking at them." He
 * prescribed (a) loss of saturation, (b) shift toward blue-grey,
 * (c) loss of edge sharpness, (d) compression of value contrast —
 * all physically caused by Rayleigh + Mie scattering of the atmosphere.
 *
 * Beer-Lambert formalization: for an object at distance d through a
 * medium of extinction coefficient σ, the observed color is
 *
 *     T(d)         = exp(-σ · d)                                 // transmittance
 *     C_observed   = C_object · T(d) + C_atmosphere · (1 - T(d))  // composite
 *     saturation  *= T(d)
 *     contrast    *= T(d)
 *     edge_blur   += k · d                                       // grows linearly
 *
 * σ is wavelength-dependent — σ_blue ≈ 4·σ_red — which produces the
 * characteristic blue cast on distant objects.
 *
 * This module exposes:
 *   - applyAtmospheric(color, depth, atmos) — color transform
 *   - veilStrength(depth, atmos) — opacity needed for an overlay-rect
 *   - layerEdgeBlur(depth, atmos) — Gaussian sigma for the edge softening
 *
 * No transcendentals: dExp from det-math.
 *
 * Sources:
 *   - Leonardo, Trattato della Pittura
 *   - NVIDIA GPU Gems 2 Ch.16: Accurate Atmospheric Scattering
 *   - Preetham, Shirley, Smits 1999, "A Practical Analytic Model for Daylight"
 */

import { dExp } from '../../illustrator/math/det-math';
import { fmt2 } from '../../illustrator/math/det-format';
import { lighten } from '../../illustrator/watercolor';

/** RGB tuple in 0-255 for sRGB encoding (the form most caller code holds). */
export type RGB = [number, number, number];

export type AtmosphereModel = {
  /** Color of the atmospheric haze itself (sky-blue typical, or warm
   *  for sunset, off-white for fog). Encoded as a hex string. */
  hazeColor: string;
  /** Extinction coefficient per unit depth, RED channel (lowest scattering). */
  sigmaR: number;
  /** Extinction coefficient per unit depth, GREEN channel. */
  sigmaG: number;
  /** Extinction coefficient per unit depth, BLUE channel (highest scattering;
   *  ratio σ_blue/σ_red ≈ 4 produces Rayleigh-style blue shift). */
  sigmaB: number;
  /** Edge-blur growth coefficient per unit depth (px of Gaussian σ per unit). */
  edgeBlurPerDepth: number;
  /** Saturation falloff coefficient (multiplicative) per unit depth. */
  saturationFalloff: number;
};

/** Realistic clear-day daylight atmosphere over 0..1 normalized depth.
 *  Pleasant default; matches what Leonardo would have observed in Tuscany. */
export const CLEAR_DAY_ATMOSPHERE: AtmosphereModel = {
  hazeColor: '#cad7e0',
  sigmaR: 0.35,
  sigmaG: 0.55,
  sigmaB: 1.4, // ratio to red ≈ 4×, the Rayleigh signature
  edgeBlurPerDepth: 1.2,
  saturationFalloff: 0.6,
};

/** Sunset / golden-hour: warm haze color, slightly stronger overall extinction. */
export const SUNSET_ATMOSPHERE: AtmosphereModel = {
  hazeColor: '#d8a070',
  sigmaR: 0.5,
  sigmaG: 0.45,
  sigmaB: 0.7,
  edgeBlurPerDepth: 1.4,
  saturationFalloff: 0.5,
};

/** Fog: near-uniform extinction, very fast falloff. */
export const FOG_ATMOSPHERE: AtmosphereModel = {
  hazeColor: '#dcdfe2',
  sigmaR: 1.6,
  sigmaG: 1.6,
  sigmaB: 1.7,
  edgeBlurPerDepth: 2.5,
  saturationFalloff: 0.25,
};

/** Moonlit night: subtle blue-grey extinction. */
export const NIGHT_ATMOSPHERE: AtmosphereModel = {
  hazeColor: '#3a4458',
  sigmaR: 0.3,
  sigmaG: 0.4,
  sigmaB: 0.6,
  edgeBlurPerDepth: 0.9,
  saturationFalloff: 0.7,
};

// ─── color helpers ────────────────────────────────────────────────────────

function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex([r, g, b]: RGB): string {
  const cr = Math.max(0, Math.min(255, Math.round(r)));
  const cg = Math.max(0, Math.min(255, Math.round(g)));
  const cb = Math.max(0, Math.min(255, Math.round(b)));
  return '#' + ((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0');
}

// ─── public API ───────────────────────────────────────────────────────────

/**
 * Apply atmospheric extinction to a color at the given depth.
 *
 * @param colorHex Object color (hex sRGB)
 * @param depth Normalized 0..1 depth (0 = at the eye, 1 = horizon)
 * @param atmos Atmosphere model
 */
export function applyAtmospheric(
  colorHex: string,
  depth: number,
  atmos: AtmosphereModel = CLEAR_DAY_ATMOSPHERE,
): string {
  if (depth <= 0) return colorHex;
  const d = Math.max(0, Math.min(1, depth));

  const [or, og, ob] = hexToRgb(colorHex);
  const [hr, hg, hb] = hexToRgb(atmos.hazeColor);

  // Per-channel transmittance — Beer-Lambert with channel-specific σ.
  // (Replace Math.exp with deterministic dExp per renderer purity.)
  const Tr = dExp(-atmos.sigmaR * d);
  const Tg = dExp(-atmos.sigmaG * d);
  const Tb = dExp(-atmos.sigmaB * d);

  let cr = or * Tr + hr * (1 - Tr);
  let cg = og * Tg + hg * (1 - Tg);
  let cb = ob * Tb + hb * (1 - Tb);

  // Saturation falloff: shift toward each channel's mean.
  const meanT = (Tr + Tg + Tb) / 3;
  const satMul = meanT * atmos.saturationFalloff + (1 - atmos.saturationFalloff);
  const grey = (cr + cg + cb) / 3;
  cr = grey + (cr - grey) * satMul;
  cg = grey + (cg - grey) * satMul;
  cb = grey + (cb - grey) * satMul;

  return rgbToHex([cr, cg, cb]);
}

/**
 * Opacity for a single overlay-rect "veil" used as a cheap atmospheric
 * pass over a region at the given depth. The veil fills with the
 * atmosphere haze color and the returned opacity is what makes the
 * region read as receded.
 */
export function veilStrength(depth: number, atmos: AtmosphereModel = CLEAR_DAY_ATMOSPHERE): number {
  if (depth <= 0) return 0;
  const meanSigma = (atmos.sigmaR + atmos.sigmaG + atmos.sigmaB) / 3;
  return 1 - dExp(-meanSigma * depth);
}

/**
 * Edge-blur growth as a Gaussian sigma in pixels for elements at the
 * given depth.
 */
export function layerEdgeBlur(depth: number, atmos: AtmosphereModel = CLEAR_DAY_ATMOSPHERE): number {
  return Math.max(0, atmos.edgeBlurPerDepth * depth);
}

/**
 * Convenience: emit an SVG overlay rect to apply atmospheric haze to
 * a canvas region. Place AFTER the elements at the given depth and
 * BEFORE elements at lesser depth.
 *
 * @param x,y,w,h target region in canvas units
 * @param depth normalized 0..1
 * @param atmos atmosphere model
 */
export function atmosphericVeilSvg(
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  atmos: AtmosphereModel = CLEAR_DAY_ATMOSPHERE,
): string {
  const op = veilStrength(depth, atmos);
  if (op < 0.005) return '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${atmos.hazeColor}" opacity="${fmt2(op)}" pointer-events="none"/>`;
}

// Reserved for SVG filter-based blur if/when we need it.
void lighten;
