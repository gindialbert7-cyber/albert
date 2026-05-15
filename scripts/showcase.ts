#!/usr/bin/env node
/**
 * scripts/showcase.ts
 *
 * The "this is what the system does" portfolio page. Renders a single
 * tall SVG that demonstrates:
 *   - 4 character species (rabbit, owl, fox, mouse) — each in 4 poses
 *   - 6 scene backdrops (meadow/sunset/night/forest/burrow/pond)
 *   - 20 built-in procedural props
 *   - 10 Artist style anchors, side by side, same Pip → same Pip
 *   - 1 full demonstration spread page
 *
 * Output: /tmp/showcase/{showcase.svg, showcase.png}
 *
 *   tsx scripts/showcase.ts [--out /tmp/showcase]
 */

import fs from 'fs';
import path from 'path';

import { renderPage, type Character, type Page } from '../lib/illustrator';
import { seedArtist, ALL_ANCHORS } from '../lib/illustrator/artist';
import { mulberry32 } from '../lib/illustrator/rng';
import { renderBuiltinProp, ALL_BUILTIN_PROPS } from '../lib/illustrator/builtin-props';
import { getPalette } from '../lib/illustrator/palette';
import { fusePalette } from '../lib/illustrator/palette-fuse';
import { livingLine } from '../lib/illustrator/stroke/living-line';

const outIdx = process.argv.indexOf('--out');
const outDir = outIdx >= 0 ? process.argv[outIdx + 1] : '/tmp/showcase';
fs.mkdirSync(outDir, { recursive: true });

const W = 1800;
const H = 5400;
let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;

function text(x: number, y: number, t: string, size = 18, color = '#39312a', anchor: 'start' | 'middle' = 'start', italic = false) {
  return `<text x="${x}" y="${y}" font-family="Georgia, serif" font-size="${size}" fill="${color}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}>${t}</text>`;
}

let y = 60;

// ─── Title ─────────────────────────────────────────────────────────────
body += text(W / 2, y, 'Albert Procedural Illustrator', 38, '#39312a', 'middle');
y += 36;
body += text(W / 2, y, 'A complete capability showcase — every character, scene, prop, and Artist anchor', 16, '#5b4f43', 'middle', true);
y += 60;

// ─── Section 1: 10 Artists, same Pip ───────────────────────────────────
body += text(40, y, '1. Ten Artists, same character', 24);
y += 12;
body += text(40, y, 'The same Pip rendered through all 10 internal anchors. Same parameters → same Pip; each anchor brings a different palette + line behavior + paper.', 13, '#5b4f43', 'start', true);
y += 30;

const pip: Character = {
  id: 'pip',
  name: 'Pip',
  species: 'rabbit',
  furColor: '#d8a06b',
  bellyColor: '#f4e3c2',
  noseColor: '#c97070',
  cheekColor: '#f5b6b0',
  eyeStyle: 'dot-shine',
  build: 'small-round',
  featureTilt: -6,
  scale: 1.0,
  accessory: { kind: 'scarf', color: '#5b7fb0' },
  seed: 4471,
};

const cardW = 170;
const cardH = 220;
for (let i = 0; i < ALL_ANCHORS.length; i++) {
  const anchor = ALL_ANCHORS[i];
  const artist = seedArtist('showcase-' + anchor, { anchor });
  const x0 = 40 + i * (cardW + 4);
  const y0 = y;
  body += `<rect x="${x0}" y="${y0}" width="${cardW}" height="${cardH}" fill="${artist.paperStock}" stroke="#39312a" stroke-width="0.5"/>`;
  // Render Pip into a small page
  const miniPage: Page = {
    id: 'mini-' + anchor,
    backdrop: 'meadow',
    mood: 'day',
    canvas: { width: cardW, height: cardH },
    seed: i * 100,
    characters: [{ characterId: 'pip', pose: { facing: 'forward', arms: 'down', legs: 'stand', eyes: 'open', mouth: 'smile', headTilt: 0 }, placement: { x: cardW / 2, y: cardH - 18 } }],
  };
  const pageSvg = renderPage(miniPage, [pip], artist);
  // Extract just the inner content (between <svg> tags) and embed translated
  const inner = pageSvg.replace(/^[^>]*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  body += `<g transform="translate(${x0}, ${y0})">${inner}</g>`;
  body += text(x0 + cardW / 2, y0 + cardH + 18, anchor, 12, artist.inkColor, 'middle');
}
y += cardH + 50;

// ─── Section 2: Four species ───────────────────────────────────────────
body += text(40, y, '2. Four species — same family of hand', 24);
y += 12;
body += text(40, y, 'Rabbit, owl, fox, and mouse. Each is a parametric anatomy rig; the Artist parameters drive the line and palette in unified style.', 13, '#5b4f43', 'start', true);
y += 30;

const speciesCharacters: Character[] = [
  pip,
  {
    id: 'olwyn', name: 'Olwyn', species: 'owl',
    furColor: '#a07866', bellyColor: '#f1dfb8', noseColor: '#b67c4a', cheekColor: '#e6a890',
    eyeStyle: 'dot-shine', build: 'small-round', featureTilt: -3, scale: 1.05,
    accessory: { kind: 'bowtie', color: '#7a8b6b' }, seed: 1729,
  },
  {
    id: 'redd', name: 'Redd', species: 'fox',
    furColor: '#c47446', bellyColor: '#f1dfb8', noseColor: '#3a2a1c', cheekColor: '#e29080',
    eyeStyle: 'dot-shine', build: 'small-round', featureTilt: -2, scale: 1.0,
    accessory: { kind: 'scarf', color: '#5b7fb0' }, seed: 4242,
  },
  {
    id: 'whisker', name: 'Whisker', species: 'mouse',
    furColor: '#a89889', bellyColor: '#f0e3d0', noseColor: '#d090a0', cheekColor: '#e08a7e',
    eyeStyle: 'dot-shine', build: 'small-round', featureTilt: 0, scale: 1.0,
    accessory: { kind: 'flower', color: '#e9788b' }, seed: 333,
  },
];

const speciesCardW = 350;
const speciesCardH = 320;
const speciesArtist = seedArtist('showcase-species', { anchor: 'pip' });
for (let i = 0; i < speciesCharacters.length; i++) {
  const c = speciesCharacters[i];
  const x0 = 40 + i * (speciesCardW + 14);
  const y0 = y;
  body += `<rect x="${x0}" y="${y0}" width="${speciesCardW}" height="${speciesCardH}" fill="${speciesArtist.paperStock}" stroke="#39312a" stroke-width="0.5"/>`;
  const miniPage: Page = {
    id: 'species-' + c.id,
    backdrop: 'meadow',
    mood: 'day',
    canvas: { width: speciesCardW, height: speciesCardH },
    seed: 8000 + i,
    characters: [{ characterId: c.id, pose: { facing: 'forward', arms: 'down', legs: 'stand', eyes: 'open', mouth: 'smile', headTilt: 0 }, placement: { x: speciesCardW / 2, y: speciesCardH - 30 } }],
  };
  const pageSvg = renderPage(miniPage, [c], speciesArtist);
  const inner = pageSvg.replace(/^[^>]*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  body += `<g transform="translate(${x0}, ${y0})">${inner}</g>`;
  body += text(x0 + speciesCardW / 2, y0 + speciesCardH + 18, `${c.name} — ${c.species}`, 14, '#39312a', 'middle');
}
y += speciesCardH + 50;

// ─── Section 3: 20 built-in props ──────────────────────────────────────
body += text(40, y, '3. Twenty built-in procedural props', 24);
y += 12;
body += text(40, y, 'Hand-coded children\'s-book vocabulary the system has out of the box. Each renders in the active Artist\'s hand.', 13, '#5b4f43', 'start', true);
y += 30;

const propW = 160;
const propH = 160;
const propCols = 10;
const propPalette = fusePalette(getPalette('day'), seedArtist('showcase-props', { anchor: 'pip' }));
for (let i = 0; i < ALL_BUILTIN_PROPS.length; i++) {
  const name = ALL_BUILTIN_PROPS[i];
  const col = i % propCols;
  const row = Math.floor(i / propCols);
  const x0 = 40 + col * (propW + 4);
  const y0 = y + row * (propH + 26);
  body += `<rect x="${x0}" y="${y0}" width="${propW}" height="${propH}" fill="${propPalette.paper}" stroke="#39312a" stroke-width="0.4"/>`;
  body += `<g transform="translate(${x0 + propW / 2}, ${y0 + propH / 2})">${renderBuiltinProp(name, 0, 0, 1.0, 12345 + i, propPalette)}</g>`;
  body += text(x0 + propW / 2, y0 + propH + 14, name, 10, propPalette.ink, 'middle');
}
y += 2 * (propH + 26) + 30;

// ─── Section 4: Six backdrops ──────────────────────────────────────────
body += text(40, y, '4. Six scene backdrops', 24);
y += 12;
body += text(40, y, 'Procedural sky / mountains / hills / grass / trees, each in 6 mood palettes. Shown here in their default mood.', 13, '#5b4f43', 'start', true);
y += 30;

const bdW = 270;
const bdH = 200;
// Show 9 backdrops in 3 rows × 3 cols (was 6 in 1 row × 6)
const backdrops: Array<{ id: Page['backdrop']; mood: Page['mood']; name: string }> = [
  { id: 'meadow', mood: 'day', name: 'meadow / day' },
  { id: 'meadow-sunset', mood: 'sunset', name: 'meadow-sunset' },
  { id: 'night-sky', mood: 'night', name: 'night-sky' },
  { id: 'forest-clearing', mood: 'forest', name: 'forest-clearing' },
  { id: 'burrow-interior', mood: 'day', name: 'burrow-interior' },
  { id: 'pond', mood: 'day', name: 'pond' },
  { id: 'snow-hills', mood: 'snow', name: 'snow-hills' },
  { id: 'beach', mood: 'day', name: 'beach' },
  { id: 'mountain-peak', mood: 'day', name: 'mountain-peak' },
];
const bdArtist = seedArtist('showcase-bd', { anchor: 'pip' });
const bdCols = 6;
for (let i = 0; i < backdrops.length; i++) {
  const b = backdrops[i];
  const col = i % bdCols;
  const row = Math.floor(i / bdCols);
  const x0 = 40 + col * (bdW + 8);
  const y0 = y + row * (bdH + 30);
  const page: Page = {
    id: 'bd-' + b.id + '-' + b.mood,
    backdrop: b.id,
    mood: b.mood,
    canvas: { width: bdW, height: bdH },
    seed: 9000 + i,
  };
  const inner = renderPage(page, [], bdArtist).replace(/^[^>]*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  body += `<g transform="translate(${x0}, ${y0})">${inner}</g>`;
  body += `<rect x="${x0}" y="${y0}" width="${bdW}" height="${bdH}" fill="none" stroke="#39312a" stroke-width="0.5"/>`;
  body += text(x0 + bdW / 2, y0 + bdH + 18, b.name, 11, '#39312a', 'middle');
}
y += 2 * (bdH + 30) + 30;

// ─── Section 5: living-line property demo ─────────────────────────────
body += text(40, y, '5. The "living line" — 12 properties per stroke', 24);
y += 12;
body += text(40, y, 'Every line passes through Euler-spiral fitting, Plamondon velocity, anticipation hook, follow-through ink pool, spine + feather. Architecturally cannot produce the AI-signature artifacts.', 13, '#5b4f43', 'start', true);
y += 30;

const llRng = mulberry32(7);
const llArtist = seedArtist('showcase-ll', { anchor: 'pip' });
const llCardW = 1700;
const llCardH = 60;
const llExamples = [
  'anticipation hook before stroke start',
  'Plamondon variable width (peak mid-stroke)',
  'follow-through with ink pool at end',
  'paper grain breaks the dab footprint',
];
for (let i = 0; i < llExamples.length; i++) {
  const y0 = y + i * (llCardH + 6);
  body += text(40, y0 + 22, llExamples[i], 12, '#39312a');
  body += `<g transform="translate(450, ${y0 + 30})">${livingLine({
    from: [0, 0], to: [1200, 0],
    width: 3.5, color: llArtist.inkColor,
    anticipation: 0.05, followThrough: 0.08, endPool: 1.2,
    grainStrength: 0.7, curvatureCoupling: 0.3,
  }, llRng)}</g>`;
}
y += llExamples.length * (llCardH + 6) + 40;

// ─── Section 6: full sample page ──────────────────────────────────────
body += text(40, y, '6. A complete page', 24);
y += 12;
body += text(40, y, 'Multiple characters, built-in props, backdrop, caption — what a real picture-book spread looks like, rendered end-to-end.', 13, '#5b4f43', 'start', true);
y += 30;

const fullArtist = seedArtist('showcase-full', { anchor: 'pip' });
const fullPage: Page = {
  id: 'full-demo',
  caption: 'Pip and his friends set off across the morning fields together.',
  backdrop: 'meadow',
  mood: 'morning',
  background: [
    { kind: 'sun', x: 660, y: 110, r: 36, rays: true, z: 0 },
    { kind: 'cloud', x: 200, y: 90, w: 80, z: 1 },
    { kind: 'builtin', name: 'cottage', x: 130, y: 470, scale: 0.95, z: 2 },
    { kind: 'tree', x: 720, y: 470, h: 200, z: 2 },
    { kind: 'bird', x: 500, y: 130, scale: 0.9, z: 3 },
  ],
  characters: [
    { characterId: 'pip', pose: { facing: 'right', arms: 'down', legs: 'walk', eyes: 'open', mouth: 'smile', headTilt: 0 }, placement: { x: 320, y: 540, scale: 1.0 } },
    { characterId: 'redd', pose: { facing: 'right', arms: 'down', legs: 'walk', eyes: 'open', mouth: 'smile', headTilt: 0 }, placement: { x: 430, y: 540, scale: 1.0 } },
    { characterId: 'whisker', pose: { facing: 'right', arms: 'wave', legs: 'walk', eyes: 'open', mouth: 'smile', headTilt: 0 }, placement: { x: 540, y: 555, scale: 0.85 } },
  ],
  foreground: [
    { kind: 'flower', x: 180, y: 565, scale: 0.9 },
    { kind: 'flower', x: 230, y: 568, scale: 0.85 },
    { kind: 'butterfly', x: 580, y: 380, scale: 1.0 },
  ],
};
const fullInner = renderPage(fullPage, [pip, speciesCharacters[2], speciesCharacters[3]], fullArtist)
  .replace(/^[^>]*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
body += `<g transform="translate(40, ${y})">${fullInner}</g>`;
y += 660;

// ─── Footer ────────────────────────────────────────────────────────────
body += text(W / 2, y, 'Generated by lib/illustrator — pure code, deterministic, zero ML inference.', 13, '#5b4f43', 'middle', true);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;

const outPath = path.join(outDir, 'showcase.svg');
fs.writeFileSync(outPath, svg);
console.log('✓ Wrote ' + outPath + ' (' + (svg.length / 1024).toFixed(0) + ' KB)');
