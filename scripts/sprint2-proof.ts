#!/usr/bin/env node
/**
 * scripts/sprint2-proof.ts
 *
 * Renders the same content with the legacy handStroke renderer and the
 * new livingLine renderer side-by-side, plus a chroma-cap demonstration,
 * for visual review of Sprint 2 work.
 *
 *   tsx scripts/sprint2-proof.ts --out /tmp/sprint2-proof
 */

import fs from 'fs';
import path from 'path';
import { mulberry32 } from '../lib/illustrator/rng';
import { handStroke } from '../lib/illustrator/drawing';
import { livingLine, livingPath } from '../lib/illustrator/stroke/living-line';
import { clampChroma } from '../lib/illustrator/colors/oklab';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/sprint2-proof';
fs.mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 800;

// Common test paths: a wavy curve, a closed blob, a short straight line.
const wavyCurve: [number, number][] = [
  [100, 200], [200, 150], [350, 220], [500, 160], [650, 240], [780, 200],
];
const blob: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const r = 60 + (i % 3) * 4;
  blob.push([400 + Math.cos(a) * r, 500 + Math.sin(a) * r]);
}
const shortLine: [number, number][] = [[100, 400], [400, 410]];

function wrapSvg(inner: string, w = W, h = H): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#f6efe1"/>
  ${inner}
</svg>`;
}

// ── Comparison 1: handStroke vs livingLine on a wavy curve ──────────────
{
  const rng1 = mulberry32(12345);
  const rng2 = mulberry32(12345);
  const left =
    `<text x="20" y="30" font-family="Georgia" font-size="20" fill="#39312a">Legacy handStroke</text>` +
    `<g transform="translate(0, 0)">${handStroke(wavyCurve, rng1, { color: '#39312a', width: 2.2 })}</g>` +
    `<g transform="translate(0, 300)">${handStroke(blob, rng1, { color: '#39312a', width: 1.8, closed: true })}</g>` +
    `<g transform="translate(0, 600)">${handStroke(shortLine, rng1, { color: '#39312a', width: 2.0 })}</g>`;

  const right =
    `<text x="620" y="30" font-family="Georgia" font-size="20" fill="#39312a">livingLine (Euler + Plamondon + spine+feather)</text>` +
    `<g transform="translate(600, 0)">${(() => {
      // chain through wavy curve as living path
      return livingPath(wavyCurve, rng2, { width: 2.2, color: '#39312a' });
    })()}</g>` +
    `<g transform="translate(600, 300)">${livingPath([...blob, blob[0]], rng2, { width: 1.8, color: '#39312a', anticipation: 0, followThrough: 0, endPool: 0 })}</g>` +
    `<g transform="translate(600, 600)">${livingLine({ from: shortLine[0], to: shortLine[1], width: 2.0, color: '#39312a' }, rng2)}</g>`;

  // Vertical separator
  const sep = `<line x1="600" y1="0" x2="600" y2="${H}" stroke="#39312a" stroke-width="0.5" opacity="0.2"/>`;

  fs.writeFileSync(path.join(outDir, '01-handStroke-vs-livingLine.svg'), wrapSvg(left + right + sep));
  console.log(`  ✎ ${path.join(outDir, '01-handStroke-vs-livingLine.svg')}`);
}

// ── Comparison 2: line-aliveness properties demonstrated individually ────
{
  const rng = mulberry32(42);
  let svg = `<text x="20" y="30" font-family="Georgia" font-size="20" fill="#39312a">Living-line properties (each labeled)</text>`;

  // 1. anticipation hook
  svg += `<text x="20" y="100" font-family="Georgia" font-size="14" fill="#39312a">1. Anticipation hook (start)</text>`;
  svg += `<g transform="translate(0, 100)">${livingLine({ from: [200, 30], to: [800, 30], width: 3, anticipation: 0.08, followThrough: 0, endPool: 0 }, rng)}</g>`;

  // 2. follow-through + ink pool
  svg += `<text x="20" y="200" font-family="Georgia" font-size="14" fill="#39312a">2. Follow-through + ink pool (end)</text>`;
  svg += `<g transform="translate(0, 200)">${livingLine({ from: [200, 30], to: [800, 30], width: 3, anticipation: 0, followThrough: 0.1, endPool: 1.0 }, rng)}</g>`;

  // 3. variable width via Plamondon profile
  svg += `<text x="20" y="300" font-family="Georgia" font-size="14" fill="#39312a">3. Plamondon variable width (peak mid-stroke)</text>`;
  svg += `<g transform="translate(0, 300)">${livingLine({ from: [200, 30], to: [800, 30], width: 4, anticipation: 0, followThrough: 0, endPool: 0 }, rng)}</g>`;

  // 4. curvature coupling
  svg += `<text x="20" y="420" font-family="Georgia" font-size="14" fill="#39312a">4. Pressure-curvature coupling (thicker on bend)</text>`;
  svg += `<g transform="translate(0, 420)">${livingLine({ from: [200, 50], to: [800, 50], mid: [500, 0], width: 3, curvatureCoupling: 0.5 }, rng)}</g>`;

  // 5. paper grain mask
  svg += `<text x="20" y="540" font-family="Georgia" font-size="14" fill="#39312a">5. Paper grain mask (more aggressive)</text>`;
  svg += `<g transform="translate(0, 540)">${livingLine({ from: [200, 30], to: [800, 30], width: 4, grainStrength: 1.0 }, rng)}</g>`;

  // 6. no straight lines (clothoid skew)
  svg += `<text x="20" y="660" font-family="Georgia" font-size="14" fill="#39312a">6. "Straight" line is actually a shallow clothoid arc</text>`;
  svg += `<g transform="translate(0, 660)">${livingLine({ from: [200, 30], to: [800, 30], width: 2 }, rng)}</g>`;

  fs.writeFileSync(path.join(outDir, '02-line-properties.svg'), wrapSvg(svg, W, H));
  console.log(`  ✎ ${path.join(outDir, '02-line-properties.svg')}`);
}

// ── Comparison 3: chroma cap on a hot palette ──────────────────────────
{
  const hotPalette = [
    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ffff', '#0066ff', '#9900ff', '#ff00ff',
  ];
  const W3 = 1000;
  const H3 = 400;
  let svg = `<text x="20" y="30" font-family="Georgia" font-size="20" fill="#39312a">Chroma cap (MAX_CHROMA_OKLAB = 0.18)</text>`;
  svg += `<text x="20" y="60" font-family="Georgia" font-size="14" fill="#39312a">Top row: input (Midjourney-style hot)</text>`;
  svg += `<text x="20" y="80" font-family="Georgia" font-size="14" fill="#39312a">Bottom row: after clampChroma (architectural cap)</text>`;
  hotPalette.forEach((c, i) => {
    const x = 50 + i * 110;
    const after = clampChroma(c);
    svg += `<rect x="${x}" y="120" width="80" height="80" fill="${c}"/>`;
    svg += `<text x="${x}" y="215" font-family="monospace" font-size="11" fill="#39312a">${c}</text>`;
    svg += `<rect x="${x}" y="250" width="80" height="80" fill="${after}"/>`;
    svg += `<text x="${x}" y="345" font-family="monospace" font-size="11" fill="#39312a">${after}</text>`;
  });
  fs.writeFileSync(path.join(outDir, '03-chroma-cap.svg'), wrapSvg(svg, W3, H3));
  console.log(`  ✎ ${path.join(outDir, '03-chroma-cap.svg')}`);
}

console.log(`\nDone. Open ${outDir}/ to inspect.`);
