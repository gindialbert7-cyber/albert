#!/usr/bin/env node
/**
 * scripts/phaseD-proof.ts
 *
 * Phase D pattern operators — three additional aesthetic axes:
 *   1. Phyllotaxis (sunflower / golden-angle spirals)
 *   2. Truchet tiles (1704 — 4 variants)
 *
 *   tsx scripts/phaseD-proof.ts [--out /tmp/phaseD]
 */

import fs from 'fs';
import path from 'path';

import {
  phyllotaxis,
  phyllotaxisSvg,
  phyllotaxisPetals,
} from '../lib/artmath/pattern/phyllotaxis';
import { truchet, type TruchetVariant } from '../lib/artmath/pattern/truchet';
import { colorway } from '../lib/artmath/color/colorway';
import { fmt2 } from '../lib/illustrator/math/det-format';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/phaseD';
fs.mkdirSync(outDir, { recursive: true });

function header(text: string, sub: string, y: number): string {
  let s = `<text x="40" y="${y}" font-family="Georgia" font-size="22" fill="#39312a">${text}</text>`;
  s += `<text x="40" y="${y + 22}" font-family="Georgia" font-size="13" fill="#5b4f43" font-style="italic">${sub}</text>`;
  return s;
}

// ─── 1. Phyllotaxis ───────────────────────────────────────────────────
{
  const W = 1400;
  const H = 760;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '1. Phyllotaxis — golden-angle spiral arrangement (Vogel 1979)',
    'Each seed placed at angle k·137.5° (golden angle) and radius √k. Single parameter set, four visual treatments.',
    40,
  );

  const cellW = 320;
  const cellH = 320;
  const cw = colorway('#5a7042', 'analogous');

  // Panel 1: classic sunflower dot pattern
  const seeds = phyllotaxis({ count: 800, scale: 7 });
  const inner1 = phyllotaxisSvg(seeds, {
    cx: cellW / 2,
    cy: cellH / 2,
    dotR: (s) => 1.6 + (s.index / 800) * 2.0,
    rings: 5,
    palette: cw.colors,
  });
  body += `<g transform="translate(40 100)">`;
  body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
  body += `<g>${inner1}</g>`;
  body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
  body += `</g>`;
  body += `<text x="${40 + cellW / 2}" y="${100 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">800-seed sunflower</text>`;

  // Panel 2: petal arrangement (daisy)
  const seeds2 = phyllotaxis({ count: 120, scale: 12 });
  const inner2 = phyllotaxisPetals(seeds2, {
    cx: cellW / 2,
    cy: cellH / 2,
    petalRx: 18,
    petalRy: 7,
    color: (s) => cw.colors[(s.index + 1) % cw.colors.length],
    seed: 0xfeed,
  });
  body += `<g transform="translate(${40 + cellW + 20} 100)">`;
  body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
  body += `<g>${inner2}</g>`;
  body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
  body += `</g>`;
  body += `<text x="${40 + cellW + 20 + cellW / 2}" y="${100 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">120-petal daisy</text>`;

  // Panel 3: subspiral (skip=8 → 8-armed Fibonacci spiral emerges)
  const seeds3 = phyllotaxis({ count: 600, scale: 8, skip: 1 });
  const inner3 = phyllotaxisSvg(seeds3, {
    cx: cellW / 2,
    cy: cellH / 2,
    dotR: 2.5,
    color: (s) => (s.index % 8 === 0 ? '#a85a3e' : '#39312a'),
  });
  body += `<g transform="translate(${40 + 2 * (cellW + 20)} 100)">`;
  body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
  body += `<g>${inner3}</g>`;
  body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
  body += `</g>`;
  body += `<text x="${40 + 2 * (cellW + 20) + cellW / 2}" y="${100 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">8-armed Fibonacci spiral</text>`;

  // Panel 4: dense single color, large scale
  const seeds4 = phyllotaxis({ count: 1800, scale: 5 });
  const inner4 = phyllotaxisSvg(seeds4, {
    cx: cellW / 2,
    cy: cellH / 2,
    dotR: 1.1,
    color: '#3a2614',
  });
  body += `<g transform="translate(${40 + 3 * (cellW + 20)} 100)">`;
  body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
  body += `<g>${inner4}</g>`;
  body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
  body += `</g>`;
  body += `<text x="${40 + 3 * (cellW + 20) + cellW / 2}" y="${100 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">1800-seed pine cone</text>`;

  void fmt2;
  fs.writeFileSync(
    path.join(outDir, '01-phyllotaxis.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 01-phyllotaxis.svg');
}

// ─── 2. Truchet tiles ─────────────────────────────────────────────────
{
  const W = 1400;
  const H = 760;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '2. Truchet tiles — 1704 randomized-tile tessellations',
    'Single tile with random orientation per cell. Four variants: triangle (classic), arc (Smith-Pollack), diagonal (minimalist), maze (Hilbert-like).',
    40,
  );

  const variants: TruchetVariant[] = ['triangle', 'arc', 'diagonal', 'maze'];
  const cellW = 320;
  const cellH = 320;
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const x0 = 40 + i * (cellW + 20);
    const y0 = 100;
    const inner = truchet({
      variant: v,
      width: cellW,
      height: cellH,
      tileSize: v === 'maze' ? 28 : 32,
      color: '#39312a',
      background: '#fdfaf2',
      strokeWidth: v === 'maze' ? 3 : 8,
      seed: 0xa0 + i,
    });
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<clipPath id="tru-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#tru-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">${v}</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '02-truchet.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 02-truchet.svg');
}

console.log(`\n✓ Phase D operators rendered. Open ${outDir}/`);
