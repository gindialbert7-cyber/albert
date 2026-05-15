#!/usr/bin/env node
/**
 * scripts/pattern.ts — CLI for the procedural pattern generator.
 *
 * Generate a pattern from a design intent. Output is SVG + PNG (and
 * optionally PDF if --pdf is given).
 *
 * Usage:
 *   tsx scripts/pattern.ts \
 *     --mood organic --color "#5a7042" --palette analogous \
 *     --density medium --scale medium \
 *     --width 1200 --height 800 \
 *     --seed 42 \
 *     --out /tmp/pattern.png
 *
 * All flags optional except --color (or --hex); defaults give a
 * reasonable mid-density organic motif.
 *
 * Examples:
 *   # Rust geometric, mirror repeat
 *   tsx scripts/pattern.ts --color "#c25f3e" --mood geometric --palette complementary
 *
 *   # Sage botanical, sparse density, large scale
 *   tsx scripts/pattern.ts --color "#5a7042" --mood botanical --density sparse --scale large
 */

import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

import {
  composeIntent,
  type DesignIntent,
  type Mood,
  type Density,
  type Scale,
  type Directionality,
} from '../lib/artmath/compose/intent-router';
import { parseBrief } from '../lib/artmath/compose/brain';
import type { Strategy } from '../lib/artmath/color/colorway';

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const moods: Mood[] = ['organic', 'geometric', 'painterly', 'editorial', 'botanical', 'meditative'];
const densities: Density[] = ['sparse', 'medium', 'dense'];
const scales: Scale[] = ['small', 'medium', 'large'];
const directionalities: Directionality[] = ['omni', 'horizontal', 'vertical', 'radial', 'diagonal'];
const strategies: Strategy[] = ['monochrome', 'analogous', 'complementary', 'split-complement', 'triadic', 'tetradic', 'shades'];

function validate<T extends string>(label: string, value: string | undefined, allowed: T[], fallback: T): T {
  if (!value) return fallback;
  if ((allowed as string[]).includes(value)) return value as T;
  console.error(`error: --${label} must be one of: ${allowed.join(', ')} (got "${value}")`);
  process.exit(1);
}

const brief = arg('brief');
let intent: DesignIntent;
let matched: ReturnType<typeof parseBrief>['matched'] | null = null;

if (brief) {
  // Free-text brief mode: parse via brain, then allow per-flag overrides.
  const overrides: Partial<DesignIntent> = {};
  const m = arg('mood');
  if (m) overrides.mood = validate('mood', m, moods, 'organic');
  const d = arg('density');
  if (d) overrides.density = validate('density', d, densities, 'medium');
  const s = arg('scale');
  if (s) overrides.scale = validate('scale', s, scales, 'medium');
  const dir = arg('directionality');
  if (dir) overrides.directionality = validate('directionality', dir, directionalities, 'omni');
  const p = arg('palette');
  if (p) overrides.paletteStrategy = validate('palette', p, strategies, 'analogous');
  const c = arg('color') ?? arg('hex');
  if (c) {
    if (!/^#?[0-9a-f]{6}$/i.test(c)) {
      console.error(`error: --color must be 6-digit hex (got "${c}")`);
      process.exit(1);
    }
    overrides.keyColor = c.startsWith('#') ? c : '#' + c;
  }
  overrides.width = parseInt(arg('width') ?? '1200', 10);
  overrides.height = parseInt(arg('height') ?? '800', 10);
  overrides.seed = parseInt(arg('seed') ?? '0', 10) || 0xa770;
  overrides.asTile = arg('tile') === 'true';
  const parsed = parseBrief(brief, overrides);
  intent = parsed.intent;
  matched = parsed.matched;
  console.log('Brief:', JSON.stringify(brief));
  console.log('Parsed matches:');
  console.log('  mood:        ', intent.mood, matched.mood.length ? `(${matched.mood.join(', ')})` : '(default)');
  console.log('  density:     ', intent.density, matched.density.length ? `(${matched.density.join(', ')})` : '(default)');
  console.log('  scale:       ', intent.scale, matched.scale.length ? `(${matched.scale.join(', ')})` : '(default)');
  if (intent.directionality) {
    console.log('  direction:   ', intent.directionality, `(${matched.direction.join(', ')})`);
  }
  console.log('  palette:     ', intent.paletteStrategy, matched.palette.length ? `(${matched.palette.join(', ')})` : '(default)');
  console.log('  color:       ', matched.color);
  console.log('');
} else {
  const color = arg('color') ?? arg('hex');
  if (!color) {
    console.error('error: --color is required (e.g. --color "#5a7042"), or use --brief "..."');
    process.exit(1);
  }
  if (!/^#?[0-9a-f]{6}$/i.test(color)) {
    console.error(`error: --color must be 6-digit hex (got "${color}")`);
    process.exit(1);
  }
  intent = {
    mood: validate('mood', arg('mood'), moods, 'organic'),
    density: validate('density', arg('density'), densities, 'medium'),
    scale: validate('scale', arg('scale'), scales, 'medium'),
    directionality: arg('directionality')
      ? validate('directionality', arg('directionality'), directionalities, 'omni')
      : undefined,
    keyColor: color.startsWith('#') ? color : '#' + color,
    paletteStrategy: validate('palette', arg('palette'), strategies, 'analogous'),
    width: parseInt(arg('width') ?? '1200', 10),
    height: parseInt(arg('height') ?? '800', 10),
    seed: parseInt(arg('seed') ?? '0', 10) || 0xa770,
    asTile: arg('tile') === 'true',
  };
}

const out = arg('out') ?? '/tmp/pattern.png';
const ext = path.extname(out).toLowerCase();

console.log('Intent:');
console.log('  mood:        ', intent.mood);
console.log('  density:     ', intent.density);
console.log('  scale:       ', intent.scale);
if (intent.directionality) console.log('  direction:   ', intent.directionality);
console.log('  key color:   ', intent.keyColor);
console.log('  palette:     ', intent.paletteStrategy);
console.log('  canvas:      ', `${intent.width}×${intent.height}`);
console.log('  seed:        ', intent.seed);

const t0 = Date.now();
const { svg, recipe } = composeIntent(intent);
const tCompose = Date.now() - t0;

console.log('\nRecipe:');
console.log('  operator:    ', recipe.operator);
console.log('  repeat:      ', recipe.repeat);
console.log('  tile size:   ', recipe.tileSize);
console.log('  palette:     ', recipe.colorway.colors.join(' '));
console.log('  compose time:', tCompose, 'ms');

const fullSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${intent.width} ${intent.height}" width="${intent.width}" height="${intent.height}">${svg}</svg>`;

if (ext === '.svg') {
  fs.writeFileSync(out, fullSvg);
  console.log(`\n  → ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
} else {
  // Render PNG via resvg.
  const t1 = Date.now();
  const resvg = new Resvg(fullSvg, { fitTo: { mode: 'width', value: intent.width } });
  const png = resvg.render().asPng();
  fs.writeFileSync(out, png);
  // Also write the SVG alongside for inspection.
  const svgPath = out.replace(/\.(png|jpg|jpeg)$/i, '.svg');
  fs.writeFileSync(svgPath, fullSvg);
  console.log(`\n  → ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB, render ${Date.now() - t1} ms)`);
  console.log(`  → ${svgPath} (${(fs.statSync(svgPath).size / 1024).toFixed(1)} KB)`);
}
