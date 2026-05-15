/**
 * Sargent value-temperature coupling.
 *
 * The signature mathematical move that makes Sargent's portraits feel
 * alive is this: every value step on a form carries a temperature
 * shift. As light falls off across a cheekbone, the hue rotates from
 * the warmth of direct light toward the coolness of ambient sky.
 * As light rises onto a forehead, hue rotates from cool ambient toward
 * warm key. The Bouguereau alternative — pure value gradient with
 * static hue — looks waxy and dead by comparison.
 *
 * Mathematically: a single coupling parameter α ∈ [0, 1] that, given
 * a base color C₀ and a value-displacement ΔV (positive = brighter),
 * also rotates the OKLab (a,b) toward the warm pole when ΔV > 0 and
 * the cool pole when ΔV < 0:
 *
 *     ΔHue_radians = α · ΔV · κ        where κ ≈ 0.5 rad / value-unit
 *
 * The "warm pole" in OKLab corresponds to hue ≈ 50° (orange);
 * the "cool pole" to ≈ 230° (cyan-blue). The rotation is performed
 * in the (a*, b*) plane around the L axis.
 *
 * This module exposes:
 *   - sargentCoupledColor(baseColor, valueShift, alpha) — single color
 *   - sargentRamp(baseColor, n, alpha) — n-stop value ramp with coupling
 *   - sargentApplyToWash(washColor, lightDirCos, alpha) — for shaded
 *     surfaces given a Lambertian cos-θ value
 *
 * Sources:
 *   - Sargent, *Carolus-Duran method* (mosaic-then-blend) lectures
 *   - Stapleton Kearns, "Sargent's Palette" — practitioner reverse-eng
 *   - Patti Mollica, "Painting in Color: Sargent's Direct Method"
 */

import { dCos, dSin } from '../../illustrator/math/det-math';
import {
  linearToOklab,
  oklabToLinear,
} from '../../illustrator/colors/oklab';

/** sRGB hex → linear-RGB */
function hexToLinear(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
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
    const x = c <= 0 ? 0 : c >= 1 ? 1 : c;
    const x04 = x * (1.7349 - 1.7146 * x + 1.5046 * x * x - 0.8042 * x * x * x + 0.2793 * x * x * x * x);
    return 1.055 * x04 - 0.055;
  };
  const cr = Math.max(0, Math.min(255, Math.round(toS(r) * 255)));
  const cg = Math.max(0, Math.min(255, Math.round(toS(g) * 255)));
  const cb = Math.max(0, Math.min(255, Math.round(toS(b) * 255)));
  return '#' + ((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0');
}

/** Strength of value-to-hue coupling, radians per unit-of-value. */
const KAPPA = 0.5;

/**
 * Apply Sargent's value-temperature coupling.
 *
 * @param baseColor hex
 * @param valueShift signed L-displacement in OKLab L units (~ -0.4..+0.4)
 * @param alpha coupling strength 0..1 (0 = Bouguereau, 1 = full Sargent)
 */
export function sargentCoupledColor(
  baseColor: string,
  valueShift: number,
  alpha: number = 0.55,
): string {
  if (alpha <= 0 && valueShift === 0) return baseColor;
  const [L, a, b] = linearToOklab(hexToLinear(baseColor));
  const newL = Math.max(0, Math.min(1, L + valueShift));
  // Hue rotation in the (a,b) plane; positive valueShift = warmer = clockwise
  // toward orange (~50° = 0.873 rad); negative = cooler = ccw toward cyan.
  const hueRot = alpha * valueShift * KAPPA; // radians
  const c = dCos(hueRot);
  const s = dSin(hueRot);
  const newA = a * c - b * s;
  const newB = a * s + b * c;
  return linearToHex(oklabToLinear([newL, newA, newB]));
}

/**
 * Generate an n-stop value ramp through baseColor with Sargent coupling.
 *
 * Returns colors from darkest (i=0) through brightest (i=n-1).
 */
export function sargentRamp(
  baseColor: string,
  n: number = 5,
  alpha: number = 0.55,
  totalRange: number = 0.5,
): string[] {
  if (n < 1) return [baseColor];
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i / (n - 1)) - 0.5; // -0.5..+0.5
    const valueShift = t * totalRange;
    out.push(sargentCoupledColor(baseColor, valueShift, alpha));
  }
  return out;
}

/**
 * Convenience: given a Lambertian cosθ value (0=shadow side, 1=full lit),
 * return the wash color with appropriate Sargent shift baked in.
 */
export function sargentApplyToWash(
  baseColor: string,
  lightDirCos: number, // 0..1
  alpha: number = 0.55,
  shadowDepth: number = 0.25, // how dark shadows go vs base (in L units)
  highlightLift: number = 0.15, // how light highlights go
): string {
  // Map cosθ ∈ [0,1] → valueShift ∈ [-shadowDepth, +highlightLift]
  const t = Math.max(0, Math.min(1, lightDirCos));
  const valueShift = -shadowDepth + t * (shadowDepth + highlightLift);
  return sargentCoupledColor(baseColor, valueShift, alpha);
}
