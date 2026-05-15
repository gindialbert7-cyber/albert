# Renderer Discipline: The Purity Boundary

The illustrator's core promise is byte-identical output from the same
parameters, on any conforming machine, for the next decade. This
document is the contract that makes that promise enforceable.

## The Rule

Everything inside `lib/illustrator/` is a **pure function of its inputs**:

```
render(scene_params: SerializableInt) -> svg_bytes: string
```

Same inputs ⇒ same bytes, byte-for-byte. No exceptions.

Anything that injects environment-dependent variance into the output
chain — wall-clock time, OS-level randomness, implementation-defined
math, locale-aware formatting, multithreaded merge order, GPU
fast-math, ICU updates — is forbidden in this directory.

## What's enforced statically (eslint.config.js)

The flat ESLint config forbids these in `lib/illustrator/**`:

| Forbidden | Reason | Use instead |
|---|---|---|
| `Math.sin`, `cos`, `tan` | TC39 §21.3 implementation-approximated; engines disagree | `dSin`, `dCos`, `dTan` from `math/det-math` |
| `Math.exp`, `log`, `log2`, `log10`, `pow` | Same | `dExp`, `dLog` from `math/det-math` |
| `Math.atan`, `atan2`, `asin`, `acos` | Same | `dAtan`, `dAtan2` from `math/det-math` |
| `Math.hypot`, `cbrt` | Engine-variant | Compose from basic ops |
| `Math.random` | Engine-defined PRNG | `mulberry32(seed)` from `rng` |
| `Date.now()`, `new Date()` | Wall-clock leaks into output | Pass timestamps as inputs if needed (and don't render them) |
| `performance.now()` | Same | Same |
| `crypto.subtle.*`, `crypto.randomUUID` | Async + platform variance | `@noble/hashes` for deterministic hashing |
| `Intl.*` | ICU updates independently of engine | Hand-roll formatters |
| `n.toFixed(d)` | Half-way rounding implementation-defined | `fmtN(n, d)` from `math/det-format` |
| `n.toPrecision`, `toExponential`, `toLocaleString` | Same | Same |

The bans are AST-based (`no-restricted-syntax`) and run in CI on every
PR touching `lib/illustrator/`.

## What's enforced at runtime (scripts/determinism-monkey-trap.ts)

Defense-in-depth: in CI, we render the canonical suite with `Math.sin`,
`Date.now`, `Math.random`, `toFixed`, `Intl`, and ~20 other forbidden
identifiers monkey-patched to throw. If any of these is reached at
runtime — even via dynamic property access the static analyzer missed
— CI fails immediately.

## What's enforced over time (scripts/determinism-ci.ts)

The canonical 38-document suite (every backdrop × every mood × character
sheets) is hashed with SHA-256 and the hashes committed to
`scripts/determinism-golden.json`. On every PR, the suite re-renders
on Linux x86-64 + Linux ARM64 + macOS ARM64, and every output must hash
identically to the golden file. Any divergence blocks merge.

If a change is intentionally aesthetic-affecting, the developer runs
`tsx scripts/determinism-ci.ts --update` and the renderer-output-version
must be bumped (see `RENDERER_VERSIONING.md` — TBD).

## Allowed operations

These ARE bit-exact across all conforming JavaScript engines and are
freely allowed in the renderer:

- Basic arithmetic: `+`, `-`, `*`, `/`, `%`
- `Math.sqrt`, `abs`, `floor`, `ceil`, `round`, `trunc`, `sign`, `min`, `max`
- `Math.fround`, `Math.imul`, `Math.clz32`
- Bitwise ops: `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`
- `Number.prototype.toString()` (default, no args — spec-stable Grisu/Ryu)
- `Number.isFinite`, `Number.isInteger`, `Number.isNaN`
- `Math.PI`, `Math.E`, `Math.LN2`, `Math.LN10` etc. (compile-time constants)
- `Map` and `Set` iteration (insertion order, spec-guaranteed)
- `Array.prototype.sort` with an explicit total-order numeric comparator
- `JSON.stringify` with a key-sorted replacer (or sorted input)

If you need something not on either list and you're unsure, ask before
using.

## What lives OUTSIDE the boundary

- ML inference (quality scoring, CLIP embedding, VLM captioning): quantize
  outputs to integer buckets BEFORE they cross into the renderer.
- Wall-clock and analytics: handled by callers (CLI, web app).
- Sort orders that depend on user locale or sub-millisecond timestamps:
  handled by callers; the renderer takes a pre-sorted list.

The boundary is conceptually:

```
┌─────────────────────────────────────────────┐
│ Caller (app, CLI, web service)              │
│   - reads files, network, time, RNG entropy │
│   - runs ML models, scores, picks           │
│   - serializes the result to scene_params   │
└────────────────────┬────────────────────────┘
                     │ SerializableInt — no floats from network
                     │ or ML; only inputs the caller authored
                     ▼
┌─────────────────────────────────────────────┐
│ lib/illustrator/  ← THE PURITY BOUNDARY     │
│   pure (scene_params) → svg_bytes           │
│   no time, no entropy, no ICU, no engine    │
│   variance, no GPU                          │
└─────────────────────────────────────────────┘
```

## Why this matters

Every dollar of the product moat lives downstream of this discipline:

- **Character consistency across a 30-page book** depends on Pip's
  parameter sheet rendering byte-identically every page. One stray
  `Math.random()` breaks the entire pitch.
- **Series consistency across books** depends on the same.
- **Reproducible re-renders ten years later** depend on the same.
- **The KDP-disclosure framing** ("procedural / parametric, deterministic")
  depends on actually being deterministic.

We have already found and fixed one violation (a `Math.random()` in
`paperVignette` that broke determinism for every page render). The
ESLint + monkey-trap + golden-hash CI together exist so the next
violation never ships.

## Updating this document

If you add a new forbidden identifier or a new exception, also update:

1. `eslint.config.js` (`rendererPurityBans`)
2. `scripts/determinism-monkey-trap.ts` (the patches)
3. The tables in this file

Then run `tsx scripts/determinism-ci.ts --update` and commit with a
renderer-output-version bump.
