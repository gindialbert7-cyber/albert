#!/usr/bin/env node
/**
 * scripts/sprint5-proof.ts
 *
 * Renders a synthetic source SVG (clipart-style icon) and traces +
 * restyles it through 3 different Artist anchors. Demonstrates that
 * the same source asset takes on each Artist's hand.
 *
 * In production this same pipeline runs on assets fetched from the
 * library cascade. The fetch layer is stubbed (see
 * lib/illustrator/library/clients.ts) — wire up real API keys to
 * activate.
 */

import fs from 'fs';
import path from 'path';
import { seedArtist } from '../lib/illustrator/artist';
import { restyleSvgInArtist } from '../lib/illustrator/trace/restyle';
import { mulberry32 } from '../lib/illustrator/rng';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/sprint5-proof';
fs.mkdirSync(outDir, { recursive: true });

// A clean clipart-style source: house with a triangle roof, a door,
// and two windows. This is the kind of thing SVG Repo returns for
// "house" — geometric, multiple closed shapes, all paths.
const SOURCE_SVG = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- body -->
  <path d="M 20 50 L 80 50 L 80 90 L 20 90 Z" fill="#cca" stroke="#333" stroke-width="1"/>
  <!-- roof -->
  <path d="M 15 50 L 50 20 L 85 50 Z" fill="#a44" stroke="#333" stroke-width="1"/>
  <!-- door -->
  <rect x="42" y="65" width="16" height="25" fill="#653" stroke="#333"/>
  <!-- windows -->
  <rect x="28" y="58" width="12" height="12" fill="#9cd" stroke="#333"/>
  <rect x="60" y="58" width="12" height="12" fill="#9cd" stroke="#333"/>
  <!-- chimney -->
  <rect x="62" y="28" width="6" height="14" fill="#a44" stroke="#333"/>
  <!-- door knob -->
  <circle cx="54" cy="78" r="1.5" fill="#ffd" stroke="#333"/>
</svg>`;

const W = 1200;
const H = 600;

let svg = `<text x="20" y="36" font-family="Georgia" font-size="24" fill="#39312a">Trace + restyle: one source SVG, three Artists' hands</text>`;
svg += `<text x="20" y="62" font-family="Georgia" font-size="13" fill="#39312a" font-style="italic">Same library asset, three different procedural Artists — visibly distinct restylings of the same geometry.</text>`;

const anchors = ['inkbloom', 'cobble', 'thistle'] as const;
const cardW = 360;
const cardH = 380;
const startY = 100;

// Source on left
svg += `<rect x="20" y="${startY}" width="${cardW}" height="${cardH}" fill="#ffffff" stroke="#39312a" stroke-width="0.5"/>`;
svg += `<text x="40" y="${startY + 25}" font-family="Georgia" font-size="16" fill="#39312a">source (clipart-style)</text>`;
svg += `<g transform="translate(40, ${startY + 35}) scale(3.2)">${SOURCE_SVG.replace(/^.*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>`;

for (let i = 0; i < anchors.length; i++) {
  const anchor = anchors[i];
  const artist = seedArtist('demo-' + anchor, { anchor });
  const rng = mulberry32(artist.seed);
  const x0 = 20 + (i + 1) * (cardW / 1.45 + 16) + 80;
  const restyledFragment = restyleSvgInArtist(SOURCE_SVG, {
    bbox: { x: 12, y: 36, w: cardW - 24, h: cardH - 56 },
    artist,
    rng,
  });
  svg += `<rect x="${x0}" y="${startY}" width="${cardW}" height="${cardH}" fill="${artist.paperStock}" stroke="#39312a" stroke-width="0.5"/>`;
  svg += `<text x="${x0 + 16}" y="${startY + 25}" font-family="Georgia" font-size="16" fill="${artist.inkColor}">${anchor}</text>`;
  svg += `<text x="${x0 + 16}" y="${startY + 42}" font-family="monospace" font-size="9" fill="${artist.inkColor}" opacity="0.7">${artist.id.slice(0, 18)}  ink ${artist.inkColor}  width ${artist.baseLineWidth.toFixed(2)}</text>`;
  svg += `<g transform="translate(${x0}, ${startY})">${restyledFragment}</g>`;
}

fs.writeFileSync(
  path.join(outDir, '01-trace-restyle.svg'),
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#fbf7ec"/>
  ${svg}
</svg>`,
);
console.log(`  ✎ ${path.join(outDir, '01-trace-restyle.svg')}`);
console.log(`\nDone. Open ${outDir}/ to inspect.`);
