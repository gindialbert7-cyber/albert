#!/usr/bin/env node
/**
 * scripts/determinism-monkey-trap.ts
 *
 * Defense-in-depth: before importing the renderer, monkey-patch every
 * source of non-determinism so any use throws instead of silently
 * leaking variance into outputs. Then render the canonical suite. If
 * the suite succeeds, no non-determinism source was reached at runtime,
 * even via property access that the ESLint AST rule didn't catch.
 *
 * Exits non-zero on any trip.
 */

const traps: string[] = [];

function trap(name: string): never {
  traps.push(name);
  throw new Error(`renderer purity violation: ${name} called at runtime`);
}

// Math transcendentals — the renderer must use d-math.ts.
Math.sin = (_x: number) => trap('Math.sin');
Math.cos = (_x: number) => trap('Math.cos');
Math.tan = (_x: number) => trap('Math.tan');
Math.exp = (_x: number) => trap('Math.exp');
Math.log = (_x: number) => trap('Math.log');
Math.log2 = (_x: number) => trap('Math.log2');
Math.log10 = (_x: number) => trap('Math.log10');
Math.pow = (_x: number, _y: number) => trap('Math.pow');
Math.atan = (_x: number) => trap('Math.atan');
Math.atan2 = (_y: number, _x: number) => trap('Math.atan2');
Math.asin = (_x: number) => trap('Math.asin');
Math.acos = (_x: number) => trap('Math.acos');
Math.hypot = (..._xs: number[]) => trap('Math.hypot');
Math.cbrt = (_x: number) => trap('Math.cbrt');
Math.random = () => trap('Math.random');

// Time and clock sources.
Date.now = () => trap('Date.now');
if ((globalThis as { performance?: { now?: () => number } }).performance) {
  (globalThis as { performance: { now: () => number } }).performance.now = () => trap('performance.now');
}

// Number formatting — toFixed is engine-variant.
(Number.prototype as { toFixed: (d: number) => string }).toFixed = function (_d: number) {
  return trap('Number.prototype.toFixed');
};
(Number.prototype as { toPrecision: (d: number) => string }).toPrecision = function (_d: number) {
  return trap('Number.prototype.toPrecision');
};
(Number.prototype as { toExponential: (d: number) => string }).toExponential = function (_d: number) {
  return trap('Number.prototype.toExponential');
};
(Number.prototype as { toLocaleString: () => string }).toLocaleString = function () {
  return trap('Number.prototype.toLocaleString');
};
(String.prototype as { toLocaleLowerCase: () => string }).toLocaleLowerCase = function () {
  return trap('String.prototype.toLocaleLowerCase');
};
(String.prototype as { toLocaleUpperCase: () => string }).toLocaleUpperCase = function () {
  return trap('String.prototype.toLocaleUpperCase');
};

async function main() {
  const { buildSuite } = await import('./determinism-suite');
  const suite = await buildSuite();
  let rendered = 0;
  for (const doc of suite) {
    doc.render();
    rendered++;
  }
  console.log(`✓ Renderer rendered ${rendered} canonical documents without touching any non-determinism source.`);
}

main().catch((err) => {
  if (traps.length > 0) {
    console.error(`✗ Renderer tripped trap: ${traps[traps.length - 1]}`);
    console.error('  Stack:');
    console.error(String((err as Error).stack));
    process.exit(1);
  }
  console.error('✗ Suite errored for a non-trap reason:');
  console.error(err);
  process.exit(1);
});
