#!/usr/bin/env node
/**
 * scripts/phaseC-portfolio.ts
 *
 * Operator-router portfolio: 6 distinct design briefs, each renders
 * through the rules-based intent → recipe → SVG pipeline. Shows the
 * system handles the full mood/density/scale matrix without manual
 * operator selection — this is the architecture an LLM brain will
 * eventually drive.
 *
 *   tsx scripts/phaseC-portfolio.ts [--out /tmp/phaseC-portfolio]
 */

import fs from 'fs';
import path from 'path';

import { composeIntent, type DesignIntent } from '../lib/artmath/compose/intent-router';
import { fmt2 } from '../lib/illustrator/math/det-format';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/phaseC-portfolio';
fs.mkdirSync(outDir, { recursive: true });

const briefs: { title: string; brief: string; intent: DesignIntent }[] = [
  {
    title: 'Sage botanical, half-drop',
    brief: 'Calm, organic, botanical motif for a women\'s linen scarf. Sage / cool greens, medium scale.',
    intent: {
      mood: 'botanical',
      density: 'medium',
      scale: 'medium',
      keyColor: '#5a7042',
      paletteStrategy: 'analogous',
      width: 800,
      height: 600,
      seed: 0xb01,
    },
  },
  {
    title: 'Rust geometric, straight repeat',
    brief: 'Bold, geometric, structured. Rust + complementary teal. Modern packaging or rug.',
    intent: {
      mood: 'geometric',
      density: 'medium',
      scale: 'large',
      keyColor: '#c25f3e',
      paletteStrategy: 'complementary',
      width: 800,
      height: 600,
      seed: 0xb02,
    },
  },
  {
    title: 'Indigo painterly, mirror',
    brief: 'Flowing, painterly, dreamlike. Indigo with split-complement accents. Editorial poster.',
    intent: {
      mood: 'painterly',
      density: 'dense',
      scale: 'medium',
      keyColor: '#3f5a82',
      paletteStrategy: 'split-complement',
      directionality: 'omni',
      width: 800,
      height: 600,
      seed: 0xb03,
    },
  },
  {
    title: 'Ochre meditative, ogival',
    brief: 'Calm, repetitive, meditative diamond lattice. Ochre + earth tones. Spa / yoga studio textile.',
    intent: {
      mood: 'meditative',
      density: 'sparse',
      scale: 'medium',
      keyColor: '#b08442',
      paletteStrategy: 'analogous',
      width: 800,
      height: 600,
      seed: 0xb04,
    },
  },
  {
    title: 'Plum editorial, half-drop',
    brief: 'Sparse, intellectual, editorial. Deep plum + ochre accents. Book cover / magazine pattern.',
    intent: {
      mood: 'editorial',
      density: 'sparse',
      scale: 'medium',
      keyColor: '#6f3a5a',
      paletteStrategy: 'triadic',
      width: 800,
      height: 600,
      seed: 0xb05,
    },
  },
  {
    title: 'Forest organic, mirror',
    brief: 'Living, breathing, organic. Forest greens with warm accents. Outdoor brand softgoods.',
    intent: {
      mood: 'organic',
      density: 'dense',
      scale: 'small',
      keyColor: '#3d5a3a',
      paletteStrategy: 'split-complement',
      directionality: 'omni',
      width: 800,
      height: 600,
      seed: 0xb06,
    },
  },
];

const W = 1700;
const H = 2300;
let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
body += `<text x="40" y="50" font-family="Georgia" font-size="28" fill="#39312a">Operator router portfolio</text>`;
body += `<text x="40" y="76" font-family="Georgia" font-size="14" fill="#5b4f43" font-style="italic">Six design briefs, each rendered through the rules-based intent → recipe → SVG pipeline. Same architecture an LLM brain will eventually drive.</text>`;

const cardW = 760;
const cardH = 690;
for (let i = 0; i < briefs.length; i++) {
  const b = briefs[i];
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x0 = 40 + col * (cardW + 60);
  const y0 = 110 + row * (cardH + 40);
  const { svg, recipe } = composeIntent(b.intent);
  body += `<g transform="translate(${x0} ${y0})">`;
  body += `<rect width="${cardW}" height="${cardH - 130}" fill="#fdfaf2"/>`;
  body += `<clipPath id="port-clip-${i}"><rect width="${cardW}" height="${cardH - 130}"/></clipPath>`;
  body += `<g clip-path="url(#port-clip-${i})">${svg}</g>`;
  body += `<rect width="${cardW}" height="${cardH - 130}" fill="none" stroke="#39312a" stroke-width="0.8"/>`;
  body += `</g>`;
  // Caption
  body += `<text x="${x0}" y="${y0 + cardH - 100}" font-family="Georgia" font-size="16" fill="#39312a">${b.title}</text>`;
  body += `<text x="${x0}" y="${y0 + cardH - 80}" font-family="Georgia" font-size="12" fill="#5b4f43" font-style="italic">${b.brief}</text>`;
  // Recipe summary
  body += `<text x="${x0}" y="${y0 + cardH - 56}" font-family="monospace" font-size="10" fill="#39312a">operator=${recipe.operator}  repeat=${recipe.repeat}  tile=${recipe.tileSize}px  palette=${recipe.colorway.strategy}</text>`;
  // Palette swatches
  for (let s = 0; s < recipe.colorway.colors.length; s++) {
    body += `<rect x="${x0 + s * 30}" y="${y0 + cardH - 40}" width="26" height="22" fill="${recipe.colorway.colors[s]}" stroke="#39312a" stroke-width="0.3"/>`;
  }
}

fs.writeFileSync(
  path.join(outDir, 'portfolio.svg'),
  `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
);
console.log('  ✎ portfolio.svg');
void fmt2;
console.log(`\n✓ Operator-router portfolio rendered. Open ${outDir}/portfolio.svg`);
