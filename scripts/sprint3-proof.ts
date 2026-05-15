#!/usr/bin/env node
/**
 * scripts/sprint3-proof.ts
 *
 * Seeds 10 author IDs, one per anchor. Renders a quick visual signature
 * for each (palette swatches + a sample stroke + line-width + paper).
 *
 * Verifies (a) all 10 anchors produce distinguishable styles, (b)
 * within-anchor sampling stays within bounded regions, (c) cross-anchor
 * variance is visible at a glance.
 *
 *   tsx scripts/sprint3-proof.ts --out /tmp/sprint3-proof
 */

import fs from 'fs';
import path from 'path';

import { seedArtist, ALL_ANCHORS } from '../lib/illustrator/artist';
import { mulberry32 } from '../lib/illustrator/rng';
import { livingLine } from '../lib/illustrator/stroke/living-line';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/sprint3-proof';
fs.mkdirSync(outDir, { recursive: true });

// ── Page 1: every anchor, sample card ───────────────────────────────────
{
  const W = 1200;
  const cardW = 220;
  const cardH = 320;
  const cols = 5;
  const rows = 2;
  const H = rows * cardH + 80;

  let svg = `<text x="20" y="32" font-family="Georgia" font-size="22" fill="#39312a">10 Artists, one per anchor — same author ID prefix, anchor explicit</text>`;
  svg += `<text x="20" y="56" font-family="Georgia" font-size="13" fill="#39312a" font-style="italic">Each card shows the Artist's paper, ink color, palette, baseline stroke, and key parameters.</text>`;

  for (let i = 0; i < ALL_ANCHORS.length; i++) {
    const anchor = ALL_ANCHORS[i];
    const artist = seedArtist('demo-author-' + anchor, { anchor });
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = 20 + col * (cardW + 16);
    const y0 = 80 + row * (cardH + 16);

    // Card background uses the Artist's paper stock
    svg += `<rect x="${x0}" y="${y0}" width="${cardW}" height="${cardH}" fill="${artist.paperStock}" stroke="#39312a" stroke-width="0.5" opacity="0.95"/>`;

    // Anchor name + ID
    svg += `<text x="${x0 + 12}" y="${y0 + 26}" font-family="Georgia" font-weight="bold" font-size="18" fill="${artist.inkColor}">${anchor}</text>`;
    svg += `<text x="${x0 + 12}" y="${y0 + 44}" font-family="monospace" font-size="9" fill="${artist.inkColor}" opacity="0.7">${artist.id.slice(0, 16)}</text>`;

    // Palette swatches
    artist.palette.forEach((c, ci) => {
      svg += `<rect x="${x0 + 12 + ci * 32}" y="${y0 + 60}" width="28" height="28" fill="${c}" stroke="#39312a" stroke-width="0.3"/>`;
    });

    // Stroke sample at this Artist's params (line + arc + closed shape).
    const rng = mulberry32(artist.seed);
    const strokeY = y0 + 130;
    svg += `<g transform="translate(${x0 + 12}, ${strokeY})">` +
      livingLine({
        from: [0, 0],
        to: [180, 0],
        width: artist.baseLineWidth * 1.4,
        color: artist.inkColor,
        anticipation: artist.anticipationHook,
        followThrough: artist.followThroughOvershoot,
        endPool: artist.endpointInkPool,
      }, rng) +
      '</g>';
    svg += `<g transform="translate(${x0 + 12}, ${strokeY + 26})">` +
      livingLine({
        from: [0, 30],
        to: [180, 30],
        mid: [90, 0],
        width: artist.baseLineWidth * 1.6,
        color: artist.inkColor,
        anticipation: artist.anticipationHook,
        followThrough: artist.followThroughOvershoot,
        endPool: artist.endpointInkPool * 0.7,
        curvatureCoupling: artist.pressureCurvatureCoupling,
      }, rng) +
      '</g>';

    // Key parameters annotation
    const params = [
      `width ${artist.baseLineWidth.toFixed(2)}→${artist.lineWidthMax.toFixed(2)}`,
      `fill ${artist.fillMode.slice(0, 14)}`,
      `wash ${artist.washOpacity.toFixed(2)} bleed ${artist.washBleed.toFixed(1)}`,
      `paper ${artist.paperStock}`,
      `h:b ratio ${artist.headToBodyRatio.toFixed(2)}`,
      `density ${artist.propDensity}`,
    ];
    params.forEach((p, pi) => {
      svg += `<text x="${x0 + 12}" y="${y0 + 230 + pi * 14}" font-family="monospace" font-size="10" fill="${artist.inkColor}" opacity="0.85">${p}</text>`;
    });
  }

  fs.writeFileSync(
    path.join(outDir, '01-ten-anchors.svg'),
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#fbf7ec"/>
  ${svg}
</svg>`,
  );
  console.log(`  ✎ ${path.join(outDir, '01-ten-anchors.svg')}`);
}

// ── Page 2: same anchor, ten different author IDs — bounded variance ──
{
  const W = 1200;
  const cardW = 220;
  const cardH = 200;
  const cols = 5;
  const rows = 2;
  const H = rows * cardH + 80;
  const anchor = 'inkbloom';

  let svg = `<text x="20" y="32" font-family="Georgia" font-size="22" fill="#39312a">10 Artists, same anchor (${anchor}) — different author IDs</text>`;
  svg += `<text x="20" y="56" font-family="Georgia" font-size="13" fill="#39312a" font-style="italic">All within the anchor's bounded region but each visibly distinct.</text>`;

  for (let i = 0; i < 10; i++) {
    const artist = seedArtist('author-' + String(i).padStart(2, '0'), { anchor });
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = 20 + col * (cardW + 16);
    const y0 = 80 + row * (cardH + 16);

    svg += `<rect x="${x0}" y="${y0}" width="${cardW}" height="${cardH}" fill="${artist.paperStock}" stroke="#39312a" stroke-width="0.5" opacity="0.95"/>`;
    svg += `<text x="${x0 + 12}" y="${y0 + 22}" font-family="monospace" font-size="10" fill="${artist.inkColor}">${artist.id.slice(0, 18)}</text>`;

    // palette
    artist.palette.forEach((c, ci) => {
      svg += `<rect x="${x0 + 12 + ci * 32}" y="${y0 + 32}" width="28" height="28" fill="${c}" stroke="#39312a" stroke-width="0.3"/>`;
    });

    // stroke sample
    const rng = mulberry32(artist.seed);
    svg += `<g transform="translate(${x0 + 12}, ${y0 + 100})">` +
      livingLine({
        from: [0, 0],
        to: [180, 0],
        width: artist.baseLineWidth * 1.4,
        color: artist.inkColor,
        anticipation: artist.anticipationHook,
        followThrough: artist.followThroughOvershoot,
        endPool: artist.endpointInkPool,
      }, rng) +
      '</g>';
    svg += `<g transform="translate(${x0 + 12}, ${y0 + 130})">` +
      livingLine({
        from: [0, 30],
        to: [180, 30],
        mid: [90, 5],
        width: artist.baseLineWidth * 1.6,
        color: artist.inkColor,
        anticipation: artist.anticipationHook,
        followThrough: artist.followThroughOvershoot,
        curvatureCoupling: artist.pressureCurvatureCoupling,
      }, rng) +
      '</g>';

    svg += `<text x="${x0 + 12}" y="${y0 + 180}" font-family="monospace" font-size="9" fill="${artist.inkColor}" opacity="0.8">w ${artist.baseLineWidth.toFixed(2)} / wash ${artist.washOpacity.toFixed(2)} / hookDb ${artist.anticipationHook.toFixed(3)}</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '02-same-anchor-ten-authors.svg'),
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#fbf7ec"/>
  ${svg}
</svg>`,
  );
  console.log(`  ✎ ${path.join(outDir, '02-same-anchor-ten-authors.svg')}`);
}

// ── Determinism check: same authorId → same Artist (5 times) ──────────
{
  const artists = Array.from({ length: 5 }, () => seedArtist('determinism-check', { anchor: 'thistle' }));
  const baseline = JSON.stringify(artists[0]);
  const allMatch = artists.every((a) => JSON.stringify(a) === baseline);
  if (!allMatch) {
    console.error('✗ Artist seeding is NOT deterministic');
    process.exit(1);
  }
  console.log('✓ Artist seeding is deterministic (5 runs identical for same authorId).');
}

console.log(`\nDone. Open ${outDir}/ to inspect.`);
