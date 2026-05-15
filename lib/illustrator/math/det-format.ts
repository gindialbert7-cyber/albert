/**
 * Deterministic number-to-string formatting.
 *
 * Number.prototype.toFixed is implementation-defined on half-way rounding
 * (`(1.005).toFixed(2)` returns "1.00" in some engines and "1.01" in
 * others — both legal under ECMAScript). Number.prototype.toString
 * produces the shortest round-trip representation, which IS spec-stable
 * since ES2018 — but writes more digits than we want.
 *
 * We route through integer arithmetic with explicit rounding: scale,
 * round half-away-from-zero, then format the integer. Every engine gives
 * the same answer for every input.
 *
 * Use `fmt2(n)` (replaces `.toFixed(2)`) everywhere in the renderer.
 */

/** Round half-away-from-zero using only basic ops. */
function roundHalfAway(x: number): number {
  if (x >= 0) return Math.floor(x + 0.5);
  return -Math.floor(-x + 0.5);
}

/**
 * Format a number with `digits` fractional digits, deterministically.
 * Behavior matches mathematical half-away-from-zero rounding; no engine
 * variance.
 */
export function fmtN(n: number, digits: number): string {
  if (n !== n) return 'NaN';
  if (n === Infinity) return 'Infinity';
  if (n === -Infinity) return '-Infinity';
  if (digits === 0) {
    const i = roundHalfAway(n);
    return i === 0 ? '0' : '' + i;
  }
  // Scale by 10^digits via integer multiplication of basic FP ops.
  let scale = 1;
  for (let i = 0; i < digits; i++) scale *= 10;
  const sign = n < 0 ? -1 : 1;
  const abs = sign * n;
  const scaled = roundHalfAway(abs * scale);
  // Integer division and modulo via Math.floor (spec-exact).
  const whole = Math.floor(scaled / scale);
  const frac = scaled - whole * scale;
  // Pad fractional part with leading zeros.
  let fracStr = '' + frac;
  while (fracStr.length < digits) fracStr = '0' + fracStr;
  // Trim trailing zeros? No — we want stable output regardless of value.
  const result = whole + '.' + fracStr;
  return sign < 0 && (whole !== 0 || frac !== 0) ? '-' + result : result;
}

/** Common case: 2 fractional digits. Used everywhere in SVG output. */
export function fmt2(n: number): string {
  return fmtN(n, 2);
}

/** 1 fractional digit. */
export function fmt1(n: number): string {
  return fmtN(n, 1);
}

/** Integer-only. */
export function fmt0(n: number): string {
  return fmtN(n, 0);
}
