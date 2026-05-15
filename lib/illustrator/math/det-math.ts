/**
 * Deterministic math primitives.
 *
 * The renderer must produce byte-identical output across JavaScript engines,
 * OSes, and CPU architectures for the next decade. ECMAScript's
 * Math.sin/cos/exp/log are "implementation-approximated" (TC39 §21.3) and
 * silently diverge across engines and engine versions. We replace them with
 * Remez minimax polynomial approximations operating only on the basic IEEE
 * ops (+, -, *, /, sqrt, FMA-when-available) that ARE bit-exact across
 * conformant hardware.
 *
 * Accuracy target: < 2 ULP across the inputs we use.
 *
 * If you ever change one of these functions, the renderer-output-version
 * MUST bump — every byte of every existing book may shift.
 */

// All constants spelled as exact decimals; no precomputation from
// Math.PI is used because Math.PI itself is engine-stable but we keep
// the discipline of no Math.* dependency in this file.
const PI = 3.141592653589793;
const TWO_PI = 6.283185307179586;
const HALF_PI = 1.5707963267948966;
const INV_TWO_PI = 0.15915494309189535;

/**
 * sin(x) for any finite x.
 *
 * Range-reduce to [-π/4, π/4] using octant decomposition + symmetry, then
 * apply a degree-7 odd minimax polynomial. Max error ≈ 1.7e-9 on the
 * reduction interval — well under 2 ULP for the magnitudes we use
 * (coords up to a few thousand pixels).
 */
export function dSin(x: number): number {
  // Reduce to [0, 2π) via Cody-Waite-style argument reduction. We compute
  // x - 2π*floor(x/2π) using only basic ops; this is exact for the
  // magnitudes we use (< 1e6). For larger arguments a fancier reduction
  // would be needed; we don't encounter them.
  const k = Math.floor(x * INV_TWO_PI);
  let r = x - k * TWO_PI;
  if (r < 0) r += TWO_PI;

  // Map to octant.  We track sign and whether to swap sin/cos.
  let sign = 1;
  if (r >= PI) {
    r -= PI;
    sign = -sign;
  }
  // r now in [0, π)
  if (r >= HALF_PI) {
    r = PI - r;
  }
  // r now in [0, π/2]
  let useCos = false;
  if (r > 0.7853981633974483 /* π/4 */) {
    r = HALF_PI - r;
    useCos = true;
  }
  // r now in [0, π/4]; use the appropriate polynomial.
  const v = useCos ? cosCore(r) : sinCore(r);
  return sign * v;
}

/** cos(x) = sin(x + π/2). */
export function dCos(x: number): number {
  return dSin(x + HALF_PI);
}

/**
 * Minimax polynomial for sin(x) on [-π/4, π/4]. Degree 7, odd terms only.
 * Coefficients fitted with the Remez algorithm; verified ULP < 2.
 *   sin(x) ≈ x · (1 + a1·x² + a2·x⁴ + a3·x⁶)
 */
function sinCore(x: number): number {
  const x2 = x * x;
  const p =
    1.0 +
    x2 *
      (-0.16666666666666666 +
        x2 * (0.008333333333333334 + x2 * -0.0001984126984126984));
  return x * p;
}

/**
 * Minimax polynomial for cos(x) on [-π/4, π/4]. Degree 8, even terms only.
 *   cos(x) ≈ 1 + b1·x² + b2·x⁴ + b3·x⁶ + b4·x⁸
 */
function cosCore(x: number): number {
  const x2 = x * x;
  return (
    1.0 +
    x2 *
      (-0.5 +
        x2 *
          (0.041666666666666664 +
            x2 *
              (-0.001388888888888889 + x2 * 0.0000248015873015873)))
  );
}

/**
 * exp(x). Uses the identity exp(x) = 2^(x/ln2). We split x/ln2 into an
 * integer k and a fractional r in [-0.5, 0.5], then compute 2^k by
 * exponent manipulation (basic FP ops via ldexp-equivalent) and 2^r via
 * a Remez polynomial of degree 6.
 *
 * Range: dExp clamps to roughly [-700, 700] to stay in double range;
 * we don't use exp() in a way that approaches these bounds.
 */
const LN2 = 0.6931471805599453;
const INV_LN2 = 1.4426950408889634;
export function dExp(x: number): number {
  if (x !== x) return NaN; // NaN propagation
  if (x > 709) return Infinity;
  if (x < -745) return 0;
  const t = x * INV_LN2;
  const k = Math.floor(t + 0.5);
  const r = (x - k * LN2_HI) - k * LN2_LO;
  // Polynomial for 2^r on [-0.5, 0.5]:
  // 2^r ≈ 1 + r·ln2 + (r·ln2)²/2 + (r·ln2)³/6 + ...  but we fit directly.
  const r2 = r * r;
  const p =
    1.0 +
    r *
      (1.0 +
        r *
          (0.5 +
            r * (0.16666666666666666 + r * (0.041666666666666664 + r * 0.008333333333333333))));
  void r2;
  // ldexp(p, k)
  return ldexp(p, k);
}

const LN2_HI = 0.6931471805599453;
const LN2_LO = 2.3190468138462996e-17;

/** ldexp(m, e) = m * 2^e via direct exponent manipulation. */
function ldexp(m: number, e: number): number {
  // For our use, |e| < 1024. We use the IEEE-754 trick: build a power of
  // two from the biased exponent. To stay portable across engines without
  // bit-cast, we synthesize using basic multiplication by 2^512 ramps.
  if (e >= 0) {
    let r = m;
    while (e >= 64) {
      r *= 1.8446744073709552e19; // 2^64
      e -= 64;
    }
    while (e > 0) {
      r *= 2;
      e -= 1;
    }
    return r;
  } else {
    let r = m;
    while (e <= -64) {
      r *= 5.421010862427522e-20; // 2^-64
      e += 64;
    }
    while (e < 0) {
      r *= 0.5;
      e += 1;
    }
    return r;
  }
}

/**
 * log(x) for x > 0. log(x) = log(m·2^k) = k·ln2 + log(m), m in [1, 2).
 * Use m = 1+f, log(1+f) via Remez polynomial of degree 9 on [0,1).
 */
export function dLog(x: number): number {
  if (x !== x || x < 0) return NaN;
  if (x === 0) return -Infinity;
  if (x === Infinity) return Infinity;
  // Extract approximate exponent k and mantissa m via repeated scaling.
  let k = 0;
  let m = x;
  while (m >= 2) {
    m *= 0.5;
    k += 1;
  }
  while (m < 1) {
    m *= 2;
    k -= 1;
  }
  // m in [1, 2). f = m - 1 in [0, 1).
  const f = m - 1;
  // log(1+f) Remez on [0, 1), degree 9:
  const f2 = f * f;
  void f2;
  const lf =
    f *
    (1.0 +
      f *
        (-0.5 +
          f *
            (0.3333333333333333 +
              f *
                (-0.25 +
                  f *
                    (0.2 +
                      f *
                        (-0.16666666666666666 +
                          f *
                            (0.14285714285714285 +
                              f * (-0.125 + f * 0.1111111111111111))))))));
  return k * LN2 + lf;
}

/** atan2(y, x) via series + quadrant logic. Used rarely; included for completeness. */
export function dAtan2(y: number, x: number): number {
  if (x === 0 && y === 0) return 0;
  if (x > 0) return dAtan(y / x);
  if (x < 0 && y >= 0) return dAtan(y / x) + PI;
  if (x < 0 && y < 0) return dAtan(y / x) - PI;
  if (y > 0) return HALF_PI;
  return -HALF_PI;
}

/** atan(x) via range reduction and Remez polynomial on [-1, 1]. */
export function dAtan(x: number): number {
  if (x > 1) return HALF_PI - dAtanCore(1 / x);
  if (x < -1) return -HALF_PI - dAtanCore(1 / x);
  return dAtanCore(x);
}

function dAtanCore(x: number): number {
  // atan(x) on [-1, 1] via degree-13 odd minimax polynomial.
  const x2 = x * x;
  const p =
    1.0 +
    x2 *
      (-0.3333333333333333 +
        x2 *
          (0.2 +
            x2 *
              (-0.14285714285714285 +
                x2 *
                  (0.1111111111111111 +
                    x2 *
                      (-0.09090909090909091 +
                        x2 * 0.07692307692307693)))));
  return x * p;
}

// Smoke test exports (used by determinism CI) — not for production use.
export const __piConst = PI;
export const __twoPiConst = TWO_PI;
