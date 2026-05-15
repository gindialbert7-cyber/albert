# Architecture v2 — primitive composition with LLM-driven scene trees

> **Status**: design draft, not yet built. Supersedes the species/backdrop/prop
> layer in v1 (`lib/illustrator/characters/*.ts`, `lib/illustrator/scenery.ts`,
> `lib/illustrator/builtin-props.ts`). The Phase A math operators
> (`lib/artmath/**`), the deterministic-math foundation, watercolor / line
> treatments, palette discipline, and composition armature stay — they
> become the primitive layer below.

## The problem v2 solves

v1 has the wrong abstraction. It's a library of *known things*: rabbit,
owl, fox, mouse, meadow, shul, kite, fire-truck. Every request that doesn't
match an entry is a hole. Build 100 entries and you'll still hit gaps.
Build 10,000 and you'll still hit gaps. A request like "Benny the boy
holding a siddur on a bimah" fails because we don't have `boy`, `siddur`,
or `bimah` in the catalog.

The fix is one abstraction level down. Don't enumerate things; enumerate
**primitives** that compose into things. An LLM (Claude) takes the request
and emits a structured scene tree of primitive operations. The renderer
executes any tree, never errors on unknown nouns, and applies the craft
discipline (variable line weight, watercolor bleed, color harmony,
composition armature, no AI tells) uniformly across whatever it draws.

## Contract

```
free-text brief  →  LLM (Claude Sonnet, structured-output)  →  SceneTree JSON
SceneTree JSON   →  procedural renderer                     →  deterministic SVG
SVG              →  resvg                                   →  PNG / PDF
```

The SceneTree schema is the load-bearing surface. It needs to be:
- **Complete enough** that any picture-book scene can be expressed
- **Coarse enough** that the LLM can populate it reliably
- **Graceful** — unknown types degrade to their closest parent, never error

## Primitive vocabulary

Four layers, top to bottom. Each layer composes from the layer below.

### Layer 1 — Scene-level

```
SceneTree {
  canvas: { w, h, aspect? }
  style: StyleSet               // applies to every primitive below
  layers: Layer[]               // back-to-front z-order
}

StyleSet {
  palette: { key: hex, strategy: 'analogous' | 'complementary' | ... }
  lineTreatment: { weight, wobble, inkPool, pressureRange }
  washTreatment: { bleed, edgeSoftness, granulation, halation }
  mood: 'warm-interior' | 'morning' | 'sunset' | 'night' | 'overcast' | ...
  armature: 'thirds' | 'harmonic14' | 'full-bouleau' | 'rabatment'
  textureOverlay: { paperGrain, brushNoise, intensity }
  // Anti-AI guardrails
  forbid: ['specular', 'bokeh', 'melt', 'perfect-symmetry']
}

Layer {
  z: number                     // back = lower
  depth?: number                // 0..1 for atmospheric perspective
  elements: Element[]
}
```

### Layer 2 — Element kinds

Every element is one of a small closed set of *kinds*. Each kind has a
schema, a parent kind (for graceful degradation), and a render rule.

```
Element =
  | Character    // any anatomical figure
  | Object       // any inanimate composed thing
  | Surface      // wall, floor, ground band, water, sky
  | Light        // light source (used by atmospheric/Sargent ops)
  | Plant        // tree, bush, vine, flower, grass
  | Architecture // column, arch, window, door, wall section
  | Text         // text overlay (caption, sign, hebrew passage)
  | Pattern      // any artmath/pattern operator output
  | Group        // nested composition with shared transform
```

### Layer 3 — Anatomical + material primitives

These are what the kinds compose from. The renderer knows how to draw
each of these and only these.

**Anatomical primitives** (Character composes from these):
```
Head        { shape: 'round'|'oval'|'angular'|'long', size, tilt }
Torso       { build: 'slim'|'average'|'sturdy'|'plump', posture: tilt+lean }
Limb        { kind: 'arm'|'leg', length, bend, end: 'hand'|'foot'|'paw'|'hoof' }
Face        { eyes, nose, mouth, brows, ears? }
Hair        { style, color, length, texture: 'straight'|'wavy'|'curly'|'fur'|'feather' }
Cloth       { kind: 'shirt'|'jacket'|'pants'|'dress'|'shawl'|'cap'|'scarf'|...
              color, fit, drape, layerOrder }
Skin        { tone: 1..10 MST, undertone: 'warm'|'cool'|'neutral' }
```

**Material primitives** (Object/Surface/Architecture composes from these):
```
Material =
  | { kind: 'wood',    color, grainDensity, plankWidth?, finish: 'rough'|'polished' }
  | { kind: 'cloth',   color, weave: 'flat'|'velvet'|'linen', drape, foldCount }
  | { kind: 'stone',   color, roughness, mortar? }
  | { kind: 'paper',   color, grain }
  | { kind: 'metal',   color, finish: 'matte'|'brushed' } // no specular ever
  | { kind: 'glass',   tint, opacity, leadlinePattern? }  // no reflection
  | { kind: 'foliage', color, leafShape, density }
  | { kind: 'fur',     color, length, direction }
  | { kind: 'water',   color, surfaceTexture: 'still'|'ripple'|'wave' }

Geometry =
  | { kind: 'box',      w, h, d?, orientation }
  | { kind: 'cylinder', r, h }
  | { kind: 'sphere',   r }
  | { kind: 'arch',     w, h, archRadius }
  | { kind: 'plane',    w, h, fold? }
  | { kind: 'polyline', points, smoothness, closed }
  | { kind: 'bezier',   controls }
```

### Layer 4 — Render primitives (already built in v1)

These never change between scenes. They're the "ink" the renderer uses.

```
handStroke(points, params)         lib/illustrator/drawing.ts
watercolorWash(polygon, params)    lib/illustrator/watercolor.ts
hatchFill(polygon, params)         lib/illustrator/drawing.ts
clampChroma(hex)                   lib/illustrator/colors/oklab.ts
applyAtmospheric(color, depth)     lib/artmath/perspective/atmospheric.ts
sargentCoupledColor(...)           lib/artmath/color/sargent-coupling.ts
sfumatoEdgeSvg(...)                lib/artmath/edges/sfumato.ts
bouleauPoints(w, h, density)       lib/artmath/composition/armature.ts
... (all 27 operators in lib/artmath/)
```

## Graceful degradation

Every kind has a fallback chain. Unknown values get rendered by the nearest
known ancestor.

```
human-child → Character (anatomy=humanoid, scale=childlike)
rabbit      → Character (anatomy=quadruped, scale=small, hasEars=long)
torah-scroll→ Object    (geometry=cylinder, material=parchment+wood)
siddur      → Object    (geometry=book-open, material=paper, fill=hebrew-text-pattern)
bimah       → Architecture (geometry=raised-platform, material=wood)
tallit      → Cloth     (kind=shawl, weave=linen, color=cream, stripes=true)
```

The LLM emits `{ "type": "siddur", ... }` and the renderer maps it through
`siddur → Object → book-open primitive`. If the LLM emits a totally
unknown type like `{ "type": "menorah" }`, the renderer falls back to
`Object` with an empty fill rather than erroring. The LLM is responsible
for providing enough composition detail (geometry, material) that even an
unknown type renders sensibly.

## Worked example — "Benny in shul"

What the LLM emits (Claude Sonnet, given the brief + the SceneTree schema):

```json
{
  "canvas": { "w": 900, "h": 700 },
  "style": {
    "palette": { "key": "#8a4423", "strategy": "analogous" },
    "lineTreatment": { "weight": 1.2, "wobble": 0.45, "pressureRange": [0.4, 1.3] },
    "washTreatment": { "bleed": 4, "edgeSoftness": 0.6, "granulation": 0.3 },
    "mood": "warm-interior",
    "armature": "thirds",
    "textureOverlay": { "paperGrain": 0.4, "brushNoise": 0.2 },
    "forbid": ["specular", "bokeh", "melt", "perfect-symmetry"]
  },
  "layers": [
    {
      "z": 0, "depth": 0.7,
      "elements": [
        { "type": "wall",   "material": { "kind": "stone", "color": "#efe0bd", "roughness": 0.2 }, "extent": "full" },
        { "type": "window", "geometry": { "kind": "arch", "w": 90, "h": 90 }, "placement": { "x": 0.5, "y": 0.2 },
          "fill": { "kind": "stained-glass", "motif": "star-of-david", "color": "#fcd989" } }
      ]
    },
    {
      "z": 1, "depth": 0.5,
      "elements": [
        { "type": "column", "material": { "kind": "wood", "color": "#c9a574" }, "geometry": { "kind": "cylinder", "r": 22, "h": 380 }, "placement": { "x": 0.18, "y": 0.6 } },
        { "type": "column", "material": { "kind": "wood", "color": "#c9a574" }, "geometry": { "kind": "cylinder", "r": 22, "h": 380 }, "placement": { "x": 0.82, "y": 0.6 } },
        { "type": "ark",    "geometry": { "kind": "arch", "w": 290, "h": 280 },
          "placement": { "x": 0.5, "y": 0.55 },
          "parts": [
            { "type": "frame",     "material": { "kind": "wood", "color": "#6d4423", "finish": "polished" } },
            { "type": "parochet",  "material": { "kind": "cloth", "color": "#8a2828", "weave": "velvet", "foldCount": 6 },
              "motif": { "kind": "luchot", "color": "#d6a73a" } }
          ] },
        { "type": "ner-tamid", "placement": { "x": 0.5, "y": 0.27 },
          "parts": [
            { "type": "chain",    "material": { "kind": "metal", "color": "#2c1a0a", "finish": "matte" } },
            { "type": "lamp",     "geometry": { "kind": "sphere", "r": 10 }, "material": { "kind": "metal", "color": "#b88a3c", "finish": "matte" } },
            { "type": "flame",    "lightColor": "#ffd266", "intensity": 0.7 }
          ] }
      ]
    },
    {
      "z": 2, "depth": 0.1,
      "elements": [
        { "type": "floor",  "material": { "kind": "wood", "color": "#7a5232", "grainDensity": 0.5, "plankWidth": 110 } },
        { "type": "character",
          "anatomy": "human-child",
          "appearance": {
            "skinTone": 4, "skinUndertone": "warm",
            "hair":  { "style": "side-swept-short", "color": "#3a2310", "texture": "wavy" },
            "eyes":  { "color": "#5a3a18", "size": "large", "shape": "round" },
            "brows": { "weight": "soft", "color": "#3a2310" },
            "mouth": "small-smile"
          },
          "clothing": [
            { "kind": "shirt",       "material": { "kind": "cloth", "color": "#ffffff", "weave": "flat" } },
            { "kind": "tie",         "material": { "kind": "cloth", "color": "#b03030", "weave": "flat" }, "style": "narrow" },
            { "kind": "suit-jacket", "material": { "kind": "cloth", "color": "#181818", "weave": "flat", "foldCount": 2 } },
            { "kind": "suit-pants",  "material": { "kind": "cloth", "color": "#181818", "weave": "flat" } },
            { "kind": "kippah",      "material": { "kind": "cloth", "color": "#2a3a70", "weave": "flat" }, "placement": "crown" },
            { "kind": "shoes",       "material": { "kind": "cloth", "color": "#1a1a1a", "weave": "flat" } }
          ],
          "pose": { "facing": "forward", "torsoLean": 0, "armLeft": "down-relaxed", "armRight": "hold-book-chest", "legs": "stand-feet-together" },
          "expression": { "gaze": "up-toward-ark", "warmth": 0.8 },
          "placement": { "x": 0.5, "y": 0.85, "scale": 0.7 },
          "props": [
            { "type": "siddur", "geometry": { "kind": "book-open", "w": 60, "h": 80 },
              "material": { "kind": "paper", "color": "#fdf6e3", "grain": 0.3 },
              "fill": { "kind": "hebrew-text-pattern", "rows": 12 },
              "held": "armRight" }
          ] }
      ]
    }
  ],
  "caption": "Benny stood in shul, his heart quiet, his siddur open in his small hands."
}
```

The renderer reads this tree and produces SVG by, for each element:
1. Looking up the element kind → render rule
2. Composing its material × geometry × placement
3. Applying the StyleSet uniformly (palette discipline, line treatment, wash, etc.)
4. Falling back to ancestor kind for unknown types

## Build order

Six concrete chunks. Each takes 3-7 days and is independently shippable.

**Chunk 1 — Schema + LLM contract.** Write the TypeScript types for
SceneTree / StyleSet / Element / Material / Geometry. Build the Claude
Sonnet prompt with the schema embedded and JSON-mode output. Validate
LLM output against the types. Test with 10 sample briefs.

**Chunk 2 — Material primitives.** Implement renderers for wood, cloth,
stone, paper, metal, glass, foliage, fur, water. Each takes a geometry
+ style and emits an SVG fragment in the v1 watercolor + handStroke
style. ~9 small modules.

**Chunk 3 — Geometry primitives.** Box, cylinder, sphere, arch, plane,
polyline, bezier — all rendered with the discipline (hand-stroke
outline, watercolor fill, no specular). These are mostly trigonometry.

**Chunk 4 — Anatomy engine for humanoid.** One unified Character
renderer that handles human-child, human-adult, and stylized animal
(via skeletal proportions parameter). Replaces the 4 hardcoded species.
Pose system: forward-kinematics joint chain so any pose the LLM emits
renders correctly.

**Chunk 5 — Compound types + fallback.** ark, ner-tamid, siddur, bimah,
torah-scroll, menorah, kippah, tallit, etc. Each is just a JSON
template that composes from material + geometry. Easy to add hundreds.
Implement graceful degradation: unknown type → parent kind.

**Chunk 6 — Style discipline + page composition.** The StyleSet
applies *uniformly* to every element. Bouleau armature drives placement
of focal subjects. Atmospheric perspective per layer depth. Sargent
value-temperature coupling at edges. The 8 anti-AI forbids enforced
structurally.

Total: ~6 weeks to working v2 that handles any picture-book scene.

## What gets thrown away from v1

- `lib/illustrator/characters/{rabbit,owl,fox,mouse}.ts` — replaced by
  one anatomy engine. The anatomical parameters that make a "rabbit"
  vs "owl" become data, not code.
- `lib/illustrator/scenery.ts` (the per-backdrop case statements) —
  replaced by layered surface + architecture elements. Each existing
  backdrop becomes a JSON template.
- `lib/illustrator/builtin-props.ts` — replaced by compound types built
  from material + geometry. Each existing prop becomes a JSON template.

## What survives intact

- All of `lib/illustrator/math/*` (deterministic math foundation)
- All of `lib/illustrator/drawing.ts` (handStroke, hatchFill)
- All of `lib/illustrator/watercolor.ts` (washes, bleed, granulation)
- All of `lib/illustrator/colors/oklab.ts` (OKLab + chroma cap)
- All of `lib/illustrator/rng.ts` (seeded determinism)
- All 27 operators in `lib/artmath/**`
- The intent router + brain (`lib/artmath/compose/*`) — extended to
  emit SceneTree instead of choosing among hardcoded operators
- The print export (`lib/artmath/print/*`)
- The CLI and lookbook scripts

## Open design questions to settle before code

1. **Pose representation.** Skeletal joint angles? Or named pose presets
   with parameters? Skeletal is more flexible but harder for the LLM to
   populate reliably. Probably hybrid: named presets that parameterize
   a skeleton.

2. **Hebrew text fill.** Real Hebrew glyphs from the font allowlist
   (`Frank Ruehl CLM`)? Or stylized "Hebrew-looking" line pattern? For
   a Jewish children's book, real glyphs probably matter — but they
   require font embedding in the SVG, which changes our determinism
   story slightly.

3. **Face features.** Eye/nose/mouth as discrete primitives, or one
   parameterized "face" with style knobs? The Pixar-Benny image has a
   very specific eye style (large, glossy, dark iris); we need that
   knob accessible without ten branches of code.

4. **Cloth physics.** Real fold simulation, or templated drape per
   garment type? Template is simpler; physics gives better generalization.
   Probably template-with-perturbation for v2, real physics later.

5. **The `forbid` list.** Currently advisory; should it be enforced
   structurally? E.g., reject any render path that produces a specular
   highlight. That's a big lift in the renderer.

6. **Determinism with LLM in the loop.** Claude output isn't byte-
   deterministic. Either we cache the LLM response per (brief, seed) so
   the SAME scene tree is reused, or we accept that the LLM step
   introduces stochasticity and only the *render* of a tree is byte-
   identical. Probably the former.

---

This doc is the design surface. Open issues above are real and worth
arguing before code is written. Once we agree on the schema and the
six open questions, I'll start with Chunk 1 (the types + LLM contract)
and we iterate from there.
