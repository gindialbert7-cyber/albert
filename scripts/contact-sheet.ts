#!/usr/bin/env node
/**
 * scripts/contact-sheet.ts — generate N seed variations of one brief.
 *
 * Textile designers don't pick a single pattern; they pick from a sheet
 * of variations. This script renders the same DesignIntent across N
 * distinct seeds and lays them out on a single contact sheet (PNG +
 * SVG, optionally PDF).
 *
 *   tsx scripts/contact-sheet.ts \
 *     --brief "sage botanical scarf, sparse" \
 *     --count 12 --out /tmp/sage-sheet.png
 *
 *   tsx scripts/contact-sheet.ts \
 *     --color "#c25f3e" --mood geometric --palette complementary \
 *     --count 8 --cols 4 --tile 400 \
 *     --out /tmp/rust-sheet.png
 */

import fs from 'fs';
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
  console.error(`error: --${label} must be one of: ${allowed.join(', ')}`);
  process.exit(1);
}

const brief = arg('brief');
const count = parseInt(arg('count') ?? '12', 10);
const cols = parseInt(arg('cols') ?? '4', 10);
const tile = parseInt(arg('tile') ?? '320', 10);
const out = arg('out') ?? '/tmp/contact-sheet.png';
const baseSeed = parseInt(arg('seed') ?? '0', 10) || 0xa770;

let baseIntent: DesignIntent;
if (brief) {
  const overrides: Partial<DesignIntent> = {};
  const m = arg('mood'); if (m) overrides.mood = validate('mood', m, moods, 'organic');
  const d = arg('density'); if (d) overrides.density = validate('density', d, densities, 'medium');
  const s = arg('scale'); if (s) overrides.scale = validate('scale', s, scales, 'medium');
  const dir = arg('directionality'); if (dir) overrides.directionality = validate('directionality', dir, directionalities, 'omni');
  const p = arg('palette'); if (p) overrides.paletteStrategy = validate('palette', p, strategies, 'analogous');
  const c = arg('color') ?? arg('hex');
  if (c) overrides.keyColor = c.startsWith('#') ? c : '#' + c;
  overrides.width = tile;
  overrides.height = tile;
  baseIntent = parseBrief(brief, overrides).intent;
} else {
  const color = arg('color') ?? arg('hex');
  if (!color) { console.error('--color or --brief required'); process.exit(1); }
  baseIntent = {
    mood: validate('mood', arg('mood'), moods, 'organic'),
    density: validate('density', arg('density'), densities, 'medium'),
    scale: validate('scale', arg('scale'), scales, 'medium'),
    directionality: arg('directionality') ? validate('directionality', arg('directionality'), directionalities, 'omni') : undefined,
    keyColor: color.startsWith('#') ? color : '#' + color,
    paletteStrategy: validate('palette', arg('palette'), strategies, 'analogous'),
    width: tile,
    height: tile,
  };
}

const rows = Math.ceil(count / cols);
const margin = 18;
const sheetW = cols * tile + (cols + 1) * margin;
const sheetH = rows * (tile + 40) + 80;

// Render each tile to PNG separately to avoid resvg node-count limits
// on giant composed SVGs. Then composite via SVG <image> elements that
// embed the per-tile PNGs as base64.
console.log(`Composing ${count} variations at ${tile}×${tile}...`);
type TilePayload = { png: string; recipe: ReturnType<typeof composeIntent>['recipe']; seed: number };
const tiles: TilePayload[] = [];
for (let i = 0; i < count; i++) {
  const seed = baseSeed + i * 7919;
  const intent: DesignIntent = { ...baseIntent, seed };
  const { svg, recipe } = composeIntent(intent);
  const fullSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tile} ${tile}" width="${tile}" height="${tile}">${svg}</svg>`;
  const resvg = new Resvg(fullSvg, { fitTo: { mode: 'width', value: tile } });
  const png = resvg.render().asPng().toString('base64');
  tiles.push({ png, recipe, seed });
  process.stdout.write('.');
}
console.log(' done');

let svgBody = `<rect width="${sheetW}" height="${sheetH}" fill="#fbf7ec"/>`;
svgBody += `<text x="${margin}" y="32" font-family="Georgia" font-size="20" fill="#39312a">Contact sheet — ${count} seed variations</text>`;
svgBody += `<text x="${margin}" y="54" font-family="Georgia" font-size="12" fill="#5b4f43" font-style="italic">${brief ?? `${baseIntent.mood} ${baseIntent.density} ${baseIntent.scale}, key ${baseIntent.keyColor}, ${baseIntent.paletteStrategy}`}</text>`;
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = margin + col * (tile + margin);
  const y = 80 + row * (tile + 40);
  svgBody += `<image x="${x}" y="${y}" width="${tile}" height="${tile}" xlink:href="data:image/png;base64,${t.png}"/>`;
  svgBody += `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
  svgBody += `<text x="${x + tile / 2}" y="${y + tile + 14}" text-anchor="middle" font-family="monospace" font-size="9" fill="#39312a">seed ${t.seed} · ${t.recipe.operator}</text>`;
  svgBody += `<text x="${x + tile / 2}" y="${y + tile + 26}" text-anchor="middle" font-family="monospace" font-size="8" fill="#5b4f43">${t.recipe.repeat} · ${t.recipe.colorway.strategy}</text>`;
}
const sheetSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${sheetW} ${sheetH}" width="${sheetW}" height="${sheetH}">${svgBody}</svg>`;

if (out.endsWith('.svg')) {
  fs.writeFileSync(out, sheetSvg);
} else {
  const resvg = new Resvg(sheetSvg, { fitTo: { mode: 'width', value: sheetW } });
  fs.writeFileSync(out, resvg.render().asPng());
  fs.writeFileSync(out.replace(/\.(png|jpg|jpeg)$/i, '.svg'), sheetSvg);
}
console.log(`✎ ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
