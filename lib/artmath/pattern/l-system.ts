/**
 * L-systems (Lindenmayer systems) — parametric grammars for botanical
 * forms.
 *
 * Aristid Lindenmayer (1968) introduced these formal string-rewriting
 * grammars to model biological growth. Repeated substitution of an axiom
 * by production rules grows an arbitrarily complex string; turtle-
 * graphics interpretation turns it into a fractal botanical figure.
 *
 * This module ships:
 *   - deterministic D0L-systems (single rule per symbol)
 *   - stochastic L-systems (alternative rules with probabilities)
 *   - parametric symbols (length, angle, width with continuous params)
 *   - turtle interpretation to a polyline list ready for SVG
 *
 * Five built-in archetypes (Prusinkiewicz "Algorithmic Beauty of Plants"):
 *   - 'koch'      Koch snowflake fractal
 *   - 'fern'      Barnsley-style fern (stochastic branching)
 *   - 'tree'      monopodial tree with self-similar branches
 *   - 'plant'     spineless herbaceous plant (Pythagoras tree variant)
 *   - 'algae'     original Lindenmayer algae growth (A → AB, B → A)
 *
 * Sources:
 *   - Prusinkiewicz & Lindenmayer 1990, "The Algorithmic Beauty of Plants"
 *   - Lindenmayer 1968, "Mathematical models for cellular interactions"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { dSin, dCos } from '../../illustrator/math/det-math';
import { mulberry32, type Rng } from '../../illustrator/rng';

/** A production rule: when `symbol` is encountered, replace it with one
 *  of `replacements`. With multiple replacements, `weight` selects
 *  stochastically. */
export type Rule = {
  symbol: string;
  replacements: { text: string; weight: number }[];
};

export type LSystem = {
  /** Starting string. */
  axiom: string;
  /** Production rules. Symbols without a rule pass through unchanged. */
  rules: Rule[];
  /** Number of derivation iterations. */
  iterations: number;
  /** Turtle parameters. */
  angle: number; // turn angle in radians
  step: number; // step length in pixels per F/G
};

/** Build a built-in L-system archetype. */
export function archetype(
  kind: 'koch' | 'fern' | 'tree' | 'plant' | 'algae',
  scale: number = 8,
): LSystem {
  const DEG = Math.PI / 180;
  switch (kind) {
    case 'koch':
      return {
        axiom: 'F',
        rules: [{ symbol: 'F', replacements: [{ text: 'F+F--F+F', weight: 1 }] }],
        iterations: 4,
        angle: 60 * DEG,
        step: scale,
      };
    case 'fern':
      return {
        axiom: 'X',
        rules: [
          {
            symbol: 'X',
            replacements: [
              { text: 'F+[[X]-X]-F[-FX]+X', weight: 0.7 },
              { text: 'F-[[X]+X]+F[+FX]-X', weight: 0.3 },
            ],
          },
          { symbol: 'F', replacements: [{ text: 'FF', weight: 1 }] },
        ],
        iterations: 5,
        angle: 25 * DEG,
        step: scale,
      };
    case 'tree':
      return {
        axiom: 'F',
        rules: [
          {
            symbol: 'F',
            replacements: [{ text: 'FF+[+F-F-F]-[-F+F+F]', weight: 1 }],
          },
        ],
        iterations: 4,
        angle: 22.5 * DEG,
        step: scale,
      };
    case 'plant':
      return {
        axiom: 'X',
        rules: [
          { symbol: 'X', replacements: [{ text: 'F+[[X]-X]-F[-FX]+X', weight: 1 }] },
          { symbol: 'F', replacements: [{ text: 'FF', weight: 1 }] },
        ],
        iterations: 5,
        angle: 25 * DEG,
        step: scale,
      };
    case 'algae':
      return {
        axiom: 'A',
        rules: [
          { symbol: 'A', replacements: [{ text: 'AB', weight: 1 }] },
          { symbol: 'B', replacements: [{ text: 'A', weight: 1 }] },
        ],
        iterations: 7,
        angle: 0,
        step: scale,
      };
  }
}

/** Apply L-system derivation. */
export function derive(sys: LSystem, seed: number = 0): string {
  const rng = mulberry32(seed);
  const ruleMap = new Map(sys.rules.map((r) => [r.symbol, r] as const));
  let s = sys.axiom;
  for (let it = 0; it < sys.iterations; it++) {
    let out = '';
    for (const ch of s) {
      const rule = ruleMap.get(ch);
      if (!rule) {
        out += ch;
        continue;
      }
      if (rule.replacements.length === 1) {
        out += rule.replacements[0].text;
      } else {
        // Stochastic selection.
        const total = rule.replacements.reduce((a, r) => a + r.weight, 0);
        const pick = rng() * total;
        let acc = 0;
        let chosen = rule.replacements[0].text;
        for (const r of rule.replacements) {
          acc += r.weight;
          if (pick <= acc) {
            chosen = r.text;
            break;
          }
        }
        out += chosen;
      }
    }
    s = out;
  }
  return s;
}

export type TurtleState = { x: number; y: number; heading: number };

export type TurtleSegment = {
  /** Start point. */
  from: [number, number];
  /** End point. */
  to: [number, number];
  /** Branch depth (push/pop nesting level). 0 = trunk. */
  depth: number;
};

/** Interpret an L-system string as turtle graphics. Returns line segments. */
export function turtle(
  str: string,
  sys: LSystem,
  start: TurtleState = { x: 0, y: 0, heading: -Math.PI / 2 },
): TurtleSegment[] {
  const stack: TurtleState[] = [];
  let cur: TurtleState = { ...start };
  const segments: TurtleSegment[] = [];
  let depth = 0;
  for (const ch of str) {
    switch (ch) {
      case 'F':
      case 'G':
      case 'A':
      case 'B': {
        const nx = cur.x + dCos(cur.heading) * sys.step;
        const ny = cur.y + dSin(cur.heading) * sys.step;
        segments.push({ from: [cur.x, cur.y], to: [nx, ny], depth });
        cur = { x: nx, y: ny, heading: cur.heading };
        break;
      }
      case 'f': {
        // Move without drawing.
        cur = {
          x: cur.x + dCos(cur.heading) * sys.step,
          y: cur.y + dSin(cur.heading) * sys.step,
          heading: cur.heading,
        };
        break;
      }
      case '+':
        cur = { ...cur, heading: cur.heading + sys.angle };
        break;
      case '-':
        cur = { ...cur, heading: cur.heading - sys.angle };
        break;
      case '[':
        stack.push({ ...cur });
        depth += 1;
        break;
      case ']':
        if (stack.length > 0) cur = stack.pop()!;
        depth = Math.max(0, depth - 1);
        break;
      // Other symbols pass through silently.
    }
  }
  return segments;
}

/** Render turtle segments as an SVG fragment. */
export function lSystemSvg(
  segments: TurtleSegment[],
  opts: {
    stroke?: string;
    strokeWidth?: number;
    /** If set, width tapers from `strokeWidth` at depth 0 down to
     *  `strokeWidth * leafWidth` at max depth. */
    leafWidth?: number;
  } = {},
): string {
  const stroke = opts.stroke ?? '#3a2614';
  const sw = opts.strokeWidth ?? 1.2;
  const leafWidth = opts.leafWidth ?? 0.4;
  let maxDepth = 0;
  for (const s of segments) {
    if (s.depth > maxDepth) maxDepth = s.depth;
  }
  let svg = '';
  for (const s of segments) {
    const t = maxDepth > 0 ? s.depth / maxDepth : 0;
    const w = sw * (1 - t * (1 - leafWidth));
    svg += `<line x1="${fmt2(s.from[0])}" y1="${fmt2(s.from[1])}" x2="${fmt2(s.to[0])}" y2="${fmt2(s.to[1])}" stroke="${stroke}" stroke-width="${fmt2(w)}" stroke-linecap="round"/>`;
  }
  return svg;
}
