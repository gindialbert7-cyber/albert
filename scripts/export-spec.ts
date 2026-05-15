#!/usr/bin/env node
/**
 * scripts/export-spec.ts — export a textile-spec PDF for a design.
 *
 * Same brief flags as scripts/pattern.ts, plus --name (the buyer-facing
 * pattern name) and --pages (defaults to US Letter portrait).
 *
 *   tsx scripts/export-spec.ts \
 *     --brief "sage botanical scarf, sparse" \
 *     --name "Sage Sprig — Spring '26" \
 *     --out /tmp/sage-sprig-spec.pdf
 */

import fs from 'fs';

import {
  composeIntent,
  intentToRecipe,
  renderRecipe,
  type DesignIntent,
  type Mood,
  type Density,
  type Scale,
  type Directionality,
} from '../lib/artmath/compose/intent-router';
import { parseBrief } from '../lib/artmath/compose/brain';
import type { Strategy } from '../lib/artmath/color/colorway';
import { renderTextileSpec } from '../lib/artmath/print/textile-spec';

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
  console.error(`error: --${label} must be one of: ${allowed.join(', ')}`);
  process.exit(1);
}

const brief = arg('brief');
const name = arg('name') ?? 'Untitled procedural pattern';
const out = arg('out') ?? '/tmp/spec.pdf';

let intent: DesignIntent;
if (brief) {
  const overrides: Partial<DesignIntent> = {};
  const m = arg('mood'); if (m) overrides.mood = validate('mood', m, moods, 'organic');
  const d = arg('density'); if (d) overrides.density = validate('density', d, densities, 'medium');
  const s = arg('scale'); if (s) overrides.scale = validate('scale', s, scales, 'medium');
  const dir = arg('directionality'); if (dir) overrides.directionality = validate('directionality', dir, directionalities, 'omni');
  const p = arg('palette'); if (p) overrides.paletteStrategy = validate('palette', p, strategies, 'analogous');
  const c = arg('color') ?? arg('hex');
  if (c) {
    if (!/^#?[0-9a-f]{6}$/i.test(c)) {
      console.error(`error: --color must be 6-digit hex`); process.exit(1);
    }
    overrides.keyColor = c.startsWith('#') ? c : '#' + c;
  }
  overrides.width = parseInt(arg('width') ?? '2400', 10);
  overrides.height = parseInt(arg('height') ?? '1800', 10);
  overrides.seed = parseInt(arg('seed') ?? '0', 10) || 0xa770;
  intent = parseBrief(brief, overrides).intent;
} else {
  const color = arg('color') ?? arg('hex');
  if (!color) {
    console.error('error: --color or --brief required'); process.exit(1);
  }
  intent = {
    mood: validate('mood', arg('mood'), moods, 'organic'),
    density: validate('density', arg('density'), densities, 'medium'),
    scale: validate('scale', arg('scale'), scales, 'medium'),
    directionality: arg('directionality') ? validate('directionality', arg('directionality'), directionalities, 'omni') : undefined,
    keyColor: color.startsWith('#') ? color : '#' + color,
    paletteStrategy: validate('palette', arg('palette'), strategies, 'analogous'),
    width: parseInt(arg('width') ?? '2400', 10),
    height: parseInt(arg('height') ?? '1800', 10),
    seed: parseInt(arg('seed') ?? '0', 10) || 0xa770,
  };
}

console.log(`Composing "${name}"...`);
const { svg, recipe } = composeIntent(intent);
const fullSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${intent.width} ${intent.height}" width="${intent.width}" height="${intent.height}">${svg}</svg>`;

// Repeat-unit preview: render the same recipe at tileSize × tileSize asTile=true.
const tileSize = recipe.tileSize;
const repeatRecipe = intentToRecipe({ ...intent, width: tileSize, height: tileSize, asTile: true });
const repeatSvg = renderRecipe(repeatRecipe, { ...intent, width: tileSize, height: tileSize, asTile: true });
const repeatTileSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tileSize} ${tileSize}" width="${tileSize}" height="${tileSize}">${repeatSvg}</svg>`;

// Read renderer version.
let rendererVersion = 'dev';
try {
  const reg = JSON.parse(fs.readFileSync('scripts/renderer-versions.json', 'utf8'));
  rendererVersion = reg.current ?? 'dev';
} catch {}

async function main() {
console.log(`Rendering PDF...`);
const t0 = Date.now();
const pdfBytes = await renderTextileSpec({
  patternName: name,
  brief: brief ?? undefined,
  patternSvg: fullSvg,
  patternWidthPx: intent.width,
  patternHeightPx: intent.height,
  repeatTileSvg,
  repeatTileSizePx: tileSize,
  recipe,
  rendererVersion,
  print: {
    widthIn: parseFloat(arg('pageW') ?? '8.5'),
    heightIn: parseFloat(arg('pageH') ?? '11'),
    dpi: parseInt(arg('dpi') ?? '300', 10),
  },
});

fs.writeFileSync(out, pdfBytes);
const ms = Date.now() - t0;
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`  ✎ ${out} (${kb} KB, ${ms} ms)`);
console.log(`     recipe: ${recipe.operator} / ${recipe.repeat} / ${recipe.colorway.strategy}`);
}

main().catch(e => { console.error(e); process.exit(1); });
