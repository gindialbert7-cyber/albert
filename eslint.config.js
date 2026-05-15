// ESLint flat config.
//
// The primary discipline this config enforces is the **renderer purity
// boundary** (see lib/illustrator/RENDERER_DISCIPLINE.md). Inside
// `lib/illustrator/`, no source of non-determinism may be used: no
// Math.random, no Date, no implementation-defined transcendentals, no
// locale-aware methods. Math.sin/cos/exp/log are replaced by the
// deterministic primitives in lib/illustrator/math/det-math.ts;
// Number.prototype.toFixed is replaced by lib/illustrator/math/det-format.ts.

const rendererPurityBans = [
  // Math.sin/cos/tan/exp/log/pow/atan/asin/acos/hypot/cbrt — implementation-defined
  // across JS engines. Use d-math.ts instead.
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="sin"]',
    message: 'Use dSin from lib/illustrator/math/det-math instead of Math.sin (engine-variant).' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="cos"]',
    message: 'Use dCos from lib/illustrator/math/det-math instead of Math.cos (engine-variant).' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="tan"]',
    message: 'Use dTan from lib/illustrator/math/det-math instead of Math.tan (engine-variant).' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="exp"]',
    message: 'Use dExp from lib/illustrator/math/det-math instead of Math.exp.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="log"]',
    message: 'Use dLog from lib/illustrator/math/det-math instead of Math.log.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="log2"]',
    message: 'Use dLog/LN2 from lib/illustrator/math/det-math instead of Math.log2.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="log10"]',
    message: 'Use dLog from lib/illustrator/math/det-math (then divide by LN10) instead of Math.log10.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="pow"]',
    message: 'Use dExp(b * dLog(a)) or specific integer-power code; Math.pow is engine-variant.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="atan"]',
    message: 'Use dAtan from lib/illustrator/math/det-math.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="atan2"]',
    message: 'Use dAtan2 from lib/illustrator/math/det-math.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="asin"]',
    message: 'Compute via dAtan2; Math.asin is engine-variant.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="acos"]',
    message: 'Compute via dAtan2; Math.acos is engine-variant.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="hypot"]',
    message: 'Use Math.sqrt(x*x+y*y); Math.hypot is engine-variant in extreme cases.' },
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="cbrt"]',
    message: 'Use dExp(dLog(x)/3); Math.cbrt is engine-variant.' },

  // Sources of non-determinism: time + randomness must not leak into renders.
  { selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
    message: 'Use a seeded RNG (mulberry32) from lib/illustrator/rng instead of Math.random.' },
  { selector: 'CallExpression[callee.object.name="Date"][callee.property.name="now"]',
    message: 'No Date.now in the render path — it leaks wall-clock into output.' },
  { selector: 'NewExpression[callee.name="Date"]',
    message: 'No new Date() in the render path.' },
  { selector: 'CallExpression[callee.object.name="performance"][callee.property.name="now"]',
    message: 'No performance.now in the render path.' },
  { selector: 'MemberExpression[object.name="process"][property.name="hrtime"]',
    message: 'No process.hrtime in the render path.' },
  { selector: 'CallExpression[callee.object.object.name="crypto"][callee.object.property.name="subtle"]',
    message: 'crypto.subtle is async + has platform variance — use @noble/hashes in render path.' },
  { selector: 'CallExpression[callee.object.name="crypto"][callee.property.name="randomUUID"]',
    message: 'No crypto.randomUUID in the render path.' },

  // Locale + formatting: implementation-defined.
  { selector: 'MemberExpression[object.name="Intl"]',
    message: 'No Intl.* in the render path — uses ICU which varies across platforms.' },
  { selector: 'CallExpression[callee.property.name="toFixed"]',
    message: 'Use fmt2/fmt1/fmtN from lib/illustrator/math/det-format — toFixed half-way rounding is engine-variant.' },
  { selector: 'CallExpression[callee.property.name="toPrecision"]',
    message: 'Use fmtN from lib/illustrator/math/det-format — toPrecision is engine-variant.' },
  { selector: 'CallExpression[callee.property.name="toExponential"]',
    message: 'Avoid toExponential in render path — engine-variant rounding.' },
  { selector: 'CallExpression[callee.property.name="toLocaleString"]',
    message: 'No locale-aware methods in render path.' },
];

const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['lib/illustrator/**/*.ts', 'lib/artmath/**/*.ts'],
    ignores: ['lib/illustrator/math/det-math.ts', 'lib/illustrator/math/det-format.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-restricted-syntax': ['error', ...rendererPurityBans],
    },
  },
];
