#!/usr/bin/env node
/**
 * scripts/benny-shul.ts — render Benny in shul.
 *
 * Benny is a young rabbit. Standing on the bimah/floor of the synagogue,
 * facing the Aron Kodesh, wearing a kippah and tallit. Warm amber light
 * from the Ner Tamid and the Star of David window above.
 *
 *   tsx scripts/benny-shul.ts            # /tmp/benny-shul.png + .svg
 *   tsx scripts/benny-shul.ts --out my.png
 */

import fs from 'fs';
import { Resvg } from '@resvg/resvg-js';

import { renderPage, type Story, type Character, type Page } from '../lib/illustrator';
import { fmt2 } from '../lib/illustrator/math/det-format';

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const out = arg('out') ?? '/tmp/benny-shul.png';

// Benny — a young cream-colored rabbit.
const benny: Character = {
  id: 'benny',
  name: 'Benny',
  species: 'rabbit',
  furColor: '#e8d8b4',        // warm cream — visible against deep wood
  bellyColor: '#f6ecd0',
  noseColor: '#c87a72',
  cheekColor: '#f0b5ad',
  eyeStyle: 'dot-shine',
  build: 'small-round',
  featureTilt: -3,
  scale: 1.15,
  accessory: { kind: 'none' },  // kippah overlaid manually
  seed: 7613,
};

// Page: Benny standing on the shul floor, facing the ark.
const page: Page = {
  id: 'benny-shul',
  canvas: { width: 900, height: 700 },
  caption: 'Benny stood in shul, his heart quiet, his kippah just so.',
  backdrop: 'shul',
  mood: 'forest',  // warm interior palette
  background: [],
  characters: [
    {
      characterId: 'benny',
      pose: {
        facing: 'forward',
        arms: 'hold-front',
        legs: 'stand',
        eyes: 'open',
        mouth: 'small',
        headTilt: 4,
      },
      placement: { x: 450, y: 620, scale: 1.35 },
    },
  ],
  foreground: [],
};

const story: Story = {
  id: 'benny-in-shul',
  title: 'Benny in shul',
  author: 'Albert',
  cast: [benny],
  pages: [page],
};

console.log('Rendering Benny in shul...');
const baseSvg = renderPage(page, story.cast);

// Manually overlay kippah + tallit. The page renderer produced an
// SVG with the rabbit; we splice these in before the closing </svg>.
// Benny's head crown sits at roughly (placement.x, placement.y - body+head).
const placement = page.characters![0].placement;
const px = placement.x;
const py = placement.y;
const scale = benny.scale * (placement.scale ?? 1);

// Rabbit anatomy (from drawRabbit): foot at py, body extends up.
// bodyH ≈ 70 * scale, head sits at (bodyCy - bodyR - bodyH/2 - eyeRise).
// Head crown is roughly placement.y - 130*scale.
const headTopY = py - 145 * scale;
const headCx = px;

// Kippah — small navy skullcap on the head crown.
const kippahColor = '#1f3a6d';
const kippahHighlight = '#2d54a0';
const kippahW = 36 * scale;
const kippahH = 12 * scale;
const kippahCy = headTopY + 4 * scale;
const kippahOverlay =
  `<g>` +
  `<path d="M ${fmt2(headCx - kippahW / 2)} ${fmt2(kippahCy + 1)} Q ${fmt2(headCx)} ${fmt2(kippahCy - kippahH)} ${fmt2(headCx + kippahW / 2)} ${fmt2(kippahCy + 1)} Z" fill="${kippahColor}" stroke="#0f1d3a" stroke-width="1.2"/>` +
  `<path d="M ${fmt2(headCx - kippahW * 0.25)} ${fmt2(kippahCy - kippahH * 0.35)} Q ${fmt2(headCx - kippahW * 0.05)} ${fmt2(kippahCy - kippahH * 0.85)} ${fmt2(headCx + kippahW * 0.15)} ${fmt2(kippahCy - kippahH * 0.5)}" fill="none" stroke="${kippahHighlight}" stroke-width="1.2" opacity="0.65"/>` +
  `</g>`;

// Tallit — cream-and-white prayer shawl draped over shoulders. Two
// blue/black stripes near the bottom of each side.
const tallitColor = '#fdf6e3';
const stripeColor = '#1f3a6d';
const shoulderY = py - 88 * scale;
const tallitOverlay =
  `<g>` +
  // Left drape
  `<path d="M ${fmt2(px - 50 * scale)} ${fmt2(shoulderY - 4 * scale)} ` +
    `L ${fmt2(px - 58 * scale)} ${fmt2(shoulderY + 30 * scale)} ` +
    `L ${fmt2(px - 26 * scale)} ${fmt2(shoulderY + 36 * scale)} ` +
    `L ${fmt2(px - 22 * scale)} ${fmt2(shoulderY + 2 * scale)} Z" fill="${tallitColor}" stroke="#a89870" stroke-width="0.8"/>` +
  // Right drape
  `<path d="M ${fmt2(px + 22 * scale)} ${fmt2(shoulderY + 2 * scale)} ` +
    `L ${fmt2(px + 26 * scale)} ${fmt2(shoulderY + 36 * scale)} ` +
    `L ${fmt2(px + 58 * scale)} ${fmt2(shoulderY + 30 * scale)} ` +
    `L ${fmt2(px + 50 * scale)} ${fmt2(shoulderY - 4 * scale)} Z" fill="${tallitColor}" stroke="#a89870" stroke-width="0.8"/>` +
  // Stripes — left
  `<line x1="${fmt2(px - 56 * scale)}" y1="${fmt2(shoulderY + 23 * scale)}" x2="${fmt2(px - 25 * scale)}" y2="${fmt2(shoulderY + 28 * scale)}" stroke="${stripeColor}" stroke-width="1.8"/>` +
  `<line x1="${fmt2(px - 55 * scale)}" y1="${fmt2(shoulderY + 28 * scale)}" x2="${fmt2(px - 25 * scale)}" y2="${fmt2(shoulderY + 32 * scale)}" stroke="${stripeColor}" stroke-width="1.2"/>` +
  // Stripes — right
  `<line x1="${fmt2(px + 25 * scale)}" y1="${fmt2(shoulderY + 28 * scale)}" x2="${fmt2(px + 56 * scale)}" y2="${fmt2(shoulderY + 23 * scale)}" stroke="${stripeColor}" stroke-width="1.8"/>` +
  `<line x1="${fmt2(px + 25 * scale)}" y1="${fmt2(shoulderY + 32 * scale)}" x2="${fmt2(px + 55 * scale)}" y2="${fmt2(shoulderY + 28 * scale)}" stroke="${stripeColor}" stroke-width="1.2"/>` +
  // Tzitzit fringes (4 small lines hanging from each corner)
  `<line x1="${fmt2(px - 58 * scale)}" y1="${fmt2(shoulderY + 30 * scale)}" x2="${fmt2(px - 58 * scale)}" y2="${fmt2(shoulderY + 40 * scale)}" stroke="${tallitColor}" stroke-width="0.7"/>` +
  `<line x1="${fmt2(px - 55 * scale)}" y1="${fmt2(shoulderY + 30 * scale)}" x2="${fmt2(px - 53 * scale)}" y2="${fmt2(shoulderY + 41 * scale)}" stroke="${tallitColor}" stroke-width="0.7"/>` +
  `<line x1="${fmt2(px + 55 * scale)}" y1="${fmt2(shoulderY + 30 * scale)}" x2="${fmt2(px + 53 * scale)}" y2="${fmt2(shoulderY + 41 * scale)}" stroke="${tallitColor}" stroke-width="0.7"/>` +
  `<line x1="${fmt2(px + 58 * scale)}" y1="${fmt2(shoulderY + 30 * scale)}" x2="${fmt2(px + 58 * scale)}" y2="${fmt2(shoulderY + 40 * scale)}" stroke="${tallitColor}" stroke-width="0.7"/>` +
  `</g>`;

// Splice overlays in just before </svg>.
const finalSvg = baseSvg.replace('</svg>', tallitOverlay + kippahOverlay + '</svg>');

if (out.endsWith('.svg')) {
  fs.writeFileSync(out, finalSvg);
  console.log(`  ✎ ${out}`);
} else {
  const resvg = new Resvg(finalSvg, { fitTo: { mode: 'width', value: 1800 } });
  fs.writeFileSync(out, resvg.render().asPng());
  fs.writeFileSync(out.replace(/\.(png|jpg|jpeg)$/i, '.svg'), finalSvg);
  console.log(`  ✎ ${out}`);
  console.log(`  ✎ ${out.replace(/\.(png|jpg|jpeg)$/i, '.svg')}`);
}
