#!/usr/bin/env node
/**
 * scripts/phaseB-textile.ts
 *
 * The full Phase B textile-spec demo: combine a pattern motif
 * (voronoi-based, L-system-based, or wallpaper-group-based) with a
 * colorway pack and the 5 repeat modes. Renders one printable spec
 * page per pattern — the format a textile buyer or print broker expects
 * to see.
 *
 *   tsx scripts/phaseB-textile.ts [--out /tmp/phaseB-textile]
 */

import fs from 'fs';
import path from 'path';

import { colorway, colorwayPack, type Colorway } from '../lib/artmath/color/colorway';
import { repeatTile, type RepeatMode, repeatDescription } from '../lib/artmath/pattern/repeat-modes';
import { voronoi, voronoiSvg } from '../lib/artmath/pattern/voronoi';
import { archetype as lArch, derive, turtle, lSystemSvg } from '../lib/artmath/pattern/l-system';
import { fmt2 } from '../lib/illustrator/math/det-format';
import { range, mulberry32 } from '../lib/illustrator/rng';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/phaseB-textile';
fs.mkdirSync(outDir, { recursive: true });

// ─── motif renderers ───────────────────────────────────────────────────

function voronoiMotifTile(cw: Colorway): (tileW: number, tileH: number, seed: number) => string {
  return (tileW, tileH, seed) => {
    const cells = voronoi({
      count: 18,
      width: tileW,
      height: tileH,
      seed,
      stride: 3,
      relax: 3,
    });
    return voronoiSvg(
      cells,
      (cell, rng) => cw.colors[Math.floor(rng() * cw.colors.length)],
      { stroke: cw.colors[0], strokeWidth: 0.6, seed },
    );
  };
}

function fernSprigTile(cw: Colorway): (tileW: number, tileH: number, seed: number) => string {
  return (tileW, tileH, seed) => {
    const sys = lArch('fern', 3);
    const str = derive(sys, seed);
    const segments = turtle(str, sys, {
      x: tileW / 2,
      y: tileH * 0.97,
      heading: -Math.PI / 2,
    });
    // Background tint
    let svg = `<rect width="${tileW}" height="${tileH}" fill="${cw.paper}"/>`;
    svg += lSystemSvg(segments, {
      stroke: cw.colors[1] ?? cw.colors[0],
      strokeWidth: 1.4,
      leafWidth: 0.25,
    });
    return svg;
  };
}

function dottedPetalTile(cw: Colorway): (tileW: number, tileH: number, seed: number) => string {
  return (tileW, tileH, seed) => {
    const rng = mulberry32(seed);
    let svg = `<rect width="${tileW}" height="${tileH}" fill="${cw.paper}"/>`;
    // Big petal
    const cx = tileW / 2;
    const cy = tileH / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 2 * Math.PI + range(rng, -0.1, 0.1);
      const r = tileW * 0.18;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      svg += `<ellipse cx="${fmt2(px)}" cy="${fmt2(py)}" rx="${fmt2(tileW * 0.13)}" ry="${fmt2(tileW * 0.07)}" transform="rotate(${fmt2((a * 180) / Math.PI)} ${fmt2(px)} ${fmt2(py)})" fill="${cw.colors[2] ?? cw.colors[1] ?? cw.colors[0]}" opacity="0.85"/>`;
    }
    svg += `<circle cx="${fmt2(cx)}" cy="${fmt2(cy)}" r="${fmt2(tileW * 0.08)}" fill="${cw.colors[3] ?? cw.colors[0]}"/>`;
    // Small scatter dots
    const dots = 8;
    for (let i = 0; i < dots; i++) {
      const x = rng() * tileW;
      const y = rng() * tileH;
      svg += `<circle cx="${fmt2(x)}" cy="${fmt2(y)}" r="${fmt2(range(rng, 1, 3.5))}" fill="${cw.colors[Math.floor(rng() * cw.colors.length)]}" opacity="0.7"/>`;
    }
    return svg;
  };
}

// ─── spec page renderer ────────────────────────────────────────────────

type MotifMaker = (cw: Colorway) => (tileW: number, tileH: number, seed: number) => string;

function specPage(
  title: string,
  subtitle: string,
  motif: MotifMaker,
  baseColor: string,
  outPath: string,
): void {
  const W = 1400;
  const H = 1700;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;

  // Title
  body += `<text x="40" y="50" font-family="Georgia" font-size="28" fill="#39312a">${title}</text>`;
  body += `<text x="40" y="76" font-family="Georgia" font-size="14" fill="#5b4f43" font-style="italic">${subtitle}</text>`;
  body += `<text x="40" y="96" font-family="monospace" font-size="11" fill="#5b4f43">key color ${baseColor}</text>`;

  // Section 1: 5 repeat modes (single colorway, the analogous one)
  const cwAnalog = colorway(baseColor, 'analogous');
  body += `<text x="40" y="140" font-family="Georgia" font-size="18" fill="#39312a">Repeat modes (analogous colorway)</text>`;
  const modes: RepeatMode[] = ['straight', 'half-drop', 'brick', 'mirror', 'ogival'];
  const previewW = 245;
  const previewH = 245;
  for (let i = 0; i < modes.length; i++) {
    const x0 = 40 + i * (previewW + 16);
    const y0 = 160;
    const tileW = 70;
    const tileH = 70;
    const tile = motif(cwAnalog);
    const inner = repeatTile(
      (rng, tw, th) => tile(tw, th, Math.floor(rng() * 0xffff)),
      {
        mode: modes[i],
        tileW,
        tileH,
        canvasW: previewW,
        canvasH: previewH,
        seed: 0xb01,
      },
    );
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<clipPath id="rep-clip-${i}"><rect width="${previewW}" height="${previewH}"/></clipPath>`;
    body += `<g clip-path="url(#rep-clip-${i})">${inner}</g>`;
    body += `<rect width="${previewW}" height="${previewH}" fill="none" stroke="#39312a" stroke-width="0.8"/>`;
    body += `</g>`;
    body += `<text x="${x0 + previewW / 2}" y="${y0 + previewH + 18}" text-anchor="middle" font-family="monospace" font-size="12" fill="#39312a">${modes[i]}</text>`;
    body += `<text x="${x0 + previewW / 2}" y="${y0 + previewH + 34}" text-anchor="middle" font-family="monospace" font-size="9" fill="#5b4f43">${repeatDescription(modes[i])}</text>`;
  }

  // Section 2: 6 colorways (one repeat mode: half-drop, the workhorse)
  body += `<text x="40" y="500" font-family="Georgia" font-size="18" fill="#39312a">Colorway pack (half-drop repeat)</text>`;
  const pack = colorwayPack(baseColor);
  for (let i = 0; i < pack.length; i++) {
    const x0 = 40 + (i % 3) * (430 + 20);
    const y0 = 520 + Math.floor(i / 3) * (300 + 60);
    const cw = pack[i];
    const tile = motif(cw);
    const previewW2 = 430;
    const previewH2 = 280;
    const tileW = 90;
    const tileH = 90;
    const inner = repeatTile(
      (rng, tw, th) => tile(tw, th, Math.floor(rng() * 0xffff)),
      {
        mode: 'half-drop',
        tileW,
        tileH,
        canvasW: previewW2,
        canvasH: previewH2,
        seed: 0xc01 + i,
      },
    );
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<clipPath id="cw-clip-${i}"><rect width="${previewW2}" height="${previewH2}"/></clipPath>`;
    body += `<g clip-path="url(#cw-clip-${i})">${inner}</g>`;
    body += `<rect width="${previewW2}" height="${previewH2}" fill="none" stroke="#39312a" stroke-width="0.8"/>`;
    body += `</g>`;
    // Swatch row beneath
    const sx = x0;
    const sy = y0 + previewH2 + 8;
    body += `<text x="${sx}" y="${sy + 12}" font-family="monospace" font-size="11" fill="#39312a">${cw.strategy}</text>`;
    for (let k = 0; k < cw.colors.length; k++) {
      const swx = sx + 90 + k * 36;
      body += `<rect x="${swx}" y="${sy + 2}" width="32" height="18" fill="${cw.colors[k]}" stroke="#39312a" stroke-width="0.4"/>`;
      body += `<text x="${swx + 16}" y="${sy + 32}" text-anchor="middle" font-family="monospace" font-size="7" fill="#5b4f43">${cw.colors[k]}</text>`;
    }
  }

  fs.writeFileSync(
    outPath,
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ ' + path.basename(outPath));
}

// ─── render three motifs ──────────────────────────────────────────────

specPage(
  'Voronoi motif — Sea Glass',
  'Cellular tessellation, 18 sites per tile, 3 Lloyd iterations. Suggested use: lightweight upholstery, lining, gift wrap.',
  voronoiMotifTile,
  '#5a8c9e',
  path.join(outDir, 'spec-voronoi-seaglass.svg'),
);

specPage(
  'Fern sprig motif — Forest Floor',
  'Stochastic L-system fern, 3 iterations, single sprig per tile. Suggested use: women\'s scarves, dress fabric, pajamas.',
  fernSprigTile,
  '#5a7042',
  path.join(outDir, 'spec-fern-forest.svg'),
);

specPage(
  'Six-petal floral — Spiced Tile',
  'Geometric floral with scattered confetti dots. Suggested use: ceramic decals, table linen, packaging.',
  dottedPetalTile,
  '#c25f3e',
  path.join(outDir, 'spec-floral-spiced.svg'),
);

console.log(`\n✓ Phase B textile spec pages rendered. Open ${outDir}/`);
