/**
 * Brain — natural language → structured DesignIntent.
 *
 * This layer translates a free-text design brief like "calm botanical
 * pattern for a women's silk scarf in sage green" into the typed
 * `DesignIntent` shape that the intent router consumes.
 *
 * Today: rule-based keyword extraction across an extensive vocabulary
 * map. Suitable as a baseline and as the runtime fallback when no LLM
 * is reachable.
 *
 * Tomorrow: the same function signature, but the implementation makes
 * a Claude Sonnet 4.6 call (with prompt caching and a structured-
 * output schema) and returns a DesignIntent with higher fidelity. The
 * call cost is bounded by the prompt cache: ~$0.0005 per brief at
 * Sonnet rates, well inside the cost-per-image budget.
 *
 * The point is: the architecture is operational without an LLM.
 * Customers can use the rule-based path while we add the LLM brain
 * behind a feature flag, validate quality, and dial it in.
 */

import { colorway, type Strategy } from '../color/colorway';
import type {
  DesignIntent,
  Mood,
  Density,
  Scale,
  Directionality,
} from './intent-router';

// ─── Vocabulary maps ───────────────────────────────────────────────────

const MOOD_KEYWORDS: Record<Mood, string[]> = {
  organic: ['organic', 'natural', 'living', 'flowing', 'soft', 'gentle', 'fluid', 'wavy', 'curvy'],
  geometric: ['geometric', 'angular', 'sharp', 'crisp', 'bold', 'clean', 'minimal', 'sharp', 'edged', 'tile', 'mosaic'],
  painterly: ['painterly', 'painted', 'brushed', 'dreamlike', 'misty', 'foggy', 'soft-focus', 'impressionist', 'watercolor'],
  editorial: ['editorial', 'magazine', 'book', 'cover', 'sparse', 'minimal', 'intellectual', 'modern', 'restrained'],
  botanical: ['botanical', 'floral', 'leaf', 'leaves', 'flower', 'fern', 'plant', 'garden', 'forest', 'fauna', 'flora', 'vine'],
  meditative: ['meditative', 'zen', 'calm', 'peaceful', 'serene', 'quiet', 'minimal', 'sparse', 'spa', 'yoga', 'breath'],
};

const DENSITY_KEYWORDS: Record<Density, string[]> = {
  sparse: ['sparse', 'minimal', 'open', 'airy', 'breathing', 'light', 'few', 'simple'],
  medium: ['medium', 'balanced', 'moderate', 'regular'],
  dense: ['dense', 'busy', 'rich', 'packed', 'crowded', 'full', 'lush', 'heavy', 'thick', 'maximal'],
};

const SCALE_KEYWORDS: Record<Scale, string[]> = {
  small: ['small', 'tiny', 'fine', 'delicate', 'micro', 'subtle'],
  medium: ['medium', 'mid', 'standard'],
  large: ['large', 'big', 'bold', 'oversized', 'large-scale', 'statement'],
};

const DIRECTIONALITY_KEYWORDS: Record<Directionality, string[]> = {
  omni: ['omni', 'omnidirectional', 'allover', 'all-over', 'scattered', 'random'],
  horizontal: ['horizontal', 'row', 'rows', 'banded', 'striped horizontally'],
  vertical: ['vertical', 'column', 'columns', 'striped vertically', 'cascading'],
  radial: ['radial', 'concentric', 'medallion', 'centered', 'sunburst'],
  diagonal: ['diagonal', 'oblique', 'slanted', 'tilted'],
};

const STRATEGY_KEYWORDS: Record<Strategy, string[]> = {
  monochrome: ['monochrome', 'mono', 'single-color', 'tonal'],
  analogous: ['analogous', 'similar', 'harmonious', 'related'],
  complementary: ['complementary', 'complement', 'contrast', 'contrasting', 'opposite'],
  'split-complement': ['split-complement', 'split-complementary'],
  triadic: ['triadic', 'triad', 'three-color'],
  tetradic: ['tetradic', 'tetrad', 'four-color', 'square'],
  shades: ['shades', 'gradient', 'tonal-scale'],
};

// Common color words → hex (curated for textile vocabulary).
const COLOR_WORDS: Record<string, string> = {
  red: '#b03a2e',
  crimson: '#8e2c2c',
  rust: '#c25f3e',
  orange: '#d97534',
  copper: '#a66232',
  amber: '#c08144',
  ochre: '#b08442',
  mustard: '#c9a44a',
  yellow: '#c9b14a',
  cream: '#e8d8a8',
  ivory: '#e8dfc4',
  lime: '#9bb24a',
  olive: '#6b7240',
  sage: '#5a7042',
  green: '#3a6741',
  forest: '#3d5a3a',
  emerald: '#246443',
  teal: '#3a7a7a',
  sea: '#5a8c9e',
  seaglass: '#85a8aa',
  cyan: '#3a8aa8',
  sky: '#6e9ab5',
  blue: '#3f5a82',
  navy: '#283d5a',
  indigo: '#3a3d70',
  cobalt: '#2f4584',
  purple: '#5a3d70',
  violet: '#6f4a85',
  plum: '#6f3a5a',
  lilac: '#a78bb0',
  pink: '#c47a8c',
  rose: '#b04566',
  blush: '#d9a8aa',
  brown: '#6a4a32',
  chocolate: '#3a261a',
  taupe: '#7a6a5a',
  stone: '#a09a8a',
  charcoal: '#3a3636',
  black: '#1a1612',
  white: '#f8f3e6',
  grey: '#7a7474',
  gray: '#7a7474',
};

const HEX_PATTERN = /#[0-9a-f]{6}/gi;

// ─── Parser ────────────────────────────────────────────────────────────

function pickEnumByKeywords<T extends string>(
  text: string,
  map: Record<T, string[]>,
  fallback: T,
): T {
  const t = text.toLowerCase();
  // Score each candidate; pick the highest. Ties resolve to first declared.
  // Exact category-name match (e.g. "botanical" → 'botanical') gets a
  // 3x weight so it beats incidental keyword overlaps.
  let best: T = fallback;
  let bestScore = 0;
  for (const k of Object.keys(map) as T[]) {
    let score = 0;
    for (const kw of map[k]) {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(t)) {
        // The category's own name gets triple weight.
        score += kw.toLowerCase() === k.toLowerCase() ? 3 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

function pickColor(text: string): string {
  const t = text.toLowerCase();
  // 1. Explicit hex.
  const hexes = t.match(HEX_PATTERN);
  if (hexes && hexes.length > 0) return hexes[0];
  // 2. Color word match.
  for (const word of Object.keys(COLOR_WORDS)) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    if (re.test(t)) return COLOR_WORDS[word];
  }
  // 3. Default to a neutral sage.
  return '#5a7042';
}

export type BriefParseResult = {
  intent: DesignIntent;
  /** Free-text words the parser matched, for transparency. */
  matched: {
    mood: string[];
    density: string[];
    scale: string[];
    direction: string[];
    palette: string[];
    color: string;
  };
};

/** Turn a free-text design brief into a structured DesignIntent.
 *
 * Defaults: 1200×800 canvas, seed 0xa770, palette 'analogous', mood 'organic'.
 * Override any field via `overrides`. */
export function parseBrief(
  brief: string,
  overrides: Partial<DesignIntent> = {},
): BriefParseResult {
  const mood = pickEnumByKeywords<Mood>(brief, MOOD_KEYWORDS, 'organic');
  const density = pickEnumByKeywords<Density>(brief, DENSITY_KEYWORDS, 'medium');
  const scale = pickEnumByKeywords<Scale>(brief, SCALE_KEYWORDS, 'medium');
  const direction = pickEnumByKeywords<Directionality>(brief, DIRECTIONALITY_KEYWORDS, 'omni');
  const paletteStrategy = pickEnumByKeywords<Strategy>(brief, STRATEGY_KEYWORDS, 'analogous');
  const color = pickColor(brief);

  // Matched-keyword report for transparency.
  const matched = {
    mood: MOOD_KEYWORDS[mood].filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(brief)),
    density: DENSITY_KEYWORDS[density].filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(brief)),
    scale: SCALE_KEYWORDS[scale].filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(brief)),
    direction: DIRECTIONALITY_KEYWORDS[direction].filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(brief)),
    palette: STRATEGY_KEYWORDS[paletteStrategy].filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(brief)),
    color,
  };

  const intent: DesignIntent = {
    mood,
    density,
    scale,
    directionality: matched.direction.length > 0 ? direction : undefined,
    keyColor: color,
    paletteStrategy,
    width: 1200,
    height: 800,
    seed: 0xa770,
    ...overrides,
  };

  // Sanity-check the colorway can be built (so we fail fast if a hex
  // would crash downstream).
  void colorway(intent.keyColor, intent.paletteStrategy ?? 'analogous');

  return { intent, matched };
}

// ─── LLM brain (Claude API call, optional) ─────────────────────────────

/** When ANTHROPIC_API_KEY is set, use Claude to extract intent. Falls
 *  back silently to the rule-based parser on any error so the system
 *  always works. */
export async function parseBriefWithLLM(
  brief: string,
  overrides: Partial<DesignIntent> = {},
  options: { model?: string; timeoutMs?: number } = {},
): Promise<BriefParseResult> {
  const key = typeof process !== 'undefined' && process.env ? process.env.ANTHROPIC_API_KEY : undefined;
  if (!key) {
    // No API key → fall back to rule-based.
    return parseBrief(brief, overrides);
  }
  const model = options.model ?? 'claude-haiku-4-5-20251001';
  const timeoutMs = options.timeoutMs ?? 8000;

  const systemPrompt = `You parse free-text textile-pattern design briefs into a strict JSON schema.

Respond with ONLY a JSON object — no prose, no markdown fences — matching this shape:
{
  "mood": "organic" | "geometric" | "painterly" | "editorial" | "botanical" | "meditative",
  "density": "sparse" | "medium" | "dense",
  "scale": "small" | "medium" | "large",
  "directionality": "omni" | "horizontal" | "vertical" | "radial" | "diagonal" | null,
  "keyColor": string,  // 6-digit hex like "#5a7042"
  "paletteStrategy": "monochrome" | "analogous" | "complementary" | "split-complement" | "triadic" | "tetradic" | "shades"
}

Use the most accurate single value from each enum. If unspecified, infer from context.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Brief: ${brief}` }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      // API error — fall back.
      return parseBrief(brief, overrides);
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    // Extract JSON.
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return parseBrief(brief, overrides);
    const parsed = JSON.parse(m[0]) as Partial<DesignIntent>;
    // Validate hex.
    if (typeof parsed.keyColor === 'string' && !/^#?[0-9a-f]{6}$/i.test(parsed.keyColor)) {
      delete parsed.keyColor;
    }
    // Merge defaults + parsed + caller overrides.
    const fallback = parseBrief(brief, overrides);
    const intent: DesignIntent = {
      ...fallback.intent,
      ...parsed,
      ...overrides,
    };
    // Re-validate via colorway (throws on bad hex).
    void colorway(intent.keyColor, intent.paletteStrategy ?? 'analogous');
    return {
      intent,
      matched: { ...fallback.matched, color: intent.keyColor },
    };
  } catch {
    return parseBrief(brief, overrides);
  }
}
