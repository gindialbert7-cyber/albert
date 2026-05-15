#!/usr/bin/env node
/**
 * scripts/phaseB-proof.ts
 *
 * Visual proof of Phase B pattern operators (the surface-design wedge):
 *   1. Wallpaper groups (5 of 17): p1, p2, pmm, p4m, p6m
 *   2. Voronoi + Centroidal Voronoi (Lloyd-relaxed)
 *   3. L-systems (5 archetypes: koch, fern, tree, plant, algae)
 *   4. Curl-noise flow fields (Fidenza-style streamlines)
 *
 *   tsx scripts/phaseB-proof.ts [--out /tmp/phaseB]
 */

import fs from 'fs';
import path from 'path';

import {
  wallpaperPattern,
  IMPLEMENTED_GROUPS,
  type WallpaperGroup,
  type TileDrawer,
} from '../lib/artmath/pattern/wallpaper-groups';
import { voronoi, voronoiSvg } from '../lib/artmath/pattern/voronoi';
import {
  archetype as lArch,
  derive,
  turtle,
  lSystemSvg,
} from '../lib/artmath/pattern/l-system';
import { flowField, flowFieldSvg } from '../lib/artmath/pattern/flow-field';
import { fmt2 } from '../lib/illustrator/math/det-format';
import { range, mulberry32 } from '../lib/illustrator/rng';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/phaseB';
fs.mkdirSync(outDir, { recursive: true });

function header(text: string, sub: string, y: number): string {
  let s = `<text x="40" y="${y}" font-family="Georgia" font-size="22" fill="#39312a">${text}</text>`;
  s += `<text x="40" y="${y + 22}" font-family="Georgia" font-size="13" fill="#5b4f43" font-style="italic">${sub}</text>`;
  return s;
}

// ─── 1. Wallpaper groups ───────────────────────────────────────────────
{
  const W = 1200;
  const H = 900;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '1. Wallpaper groups — 5 of the 17 plane-symmetry tilings',
    'Same primitive tile (asymmetric leaf-blob) repeated under each group\'s operations. Notice how lattice, rotations, and mirrors transform the same shape.',
    40,
  );

  // The drawer paints an asymmetric leaf-blob to make the group symmetry
  // obvious by contrast.
  const leafDrawer: TileDrawer = (rng, size) => {
    const c1 = `hsl(${Math.floor(rng() * 30 + 130)} 32% 38%)`;
    const c2 = `hsl(${Math.floor(rng() * 20 + 25)} 45% 50%)`;
    const r = size * 0.32;
    // Asymmetric petal: ellipse off-center + small triangle stem
    return (
      `<ellipse cx="${fmt2(size * 0.55)}" cy="${fmt2(size * 0.45)}" rx="${fmt2(r)}" ry="${fmt2(r * 0.6)}" fill="${c1}" transform="rotate(-22 ${fmt2(size * 0.55)} ${fmt2(size * 0.45)})"/>` +
      `<polygon points="${fmt2(size * 0.4)},${fmt2(size * 0.75)} ${fmt2(size * 0.5)},${fmt2(size * 0.45)} ${fmt2(size * 0.6)},${fmt2(size * 0.75)}" fill="${c2}" opacity="0.85"/>` +
      `<circle cx="${fmt2(size * 0.72)}" cy="${fmt2(size * 0.30)}" r="${fmt2(size * 0.06)}" fill="#fbf7ec" opacity="0.7"/>`
    );
  };

  const cellW = 360;
  const cellH = 360;
  const cols = 3;
  for (let i = 0; i < IMPLEMENTED_GROUPS.length; i++) {
    const g = IMPLEMENTED_GROUPS[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = 40 + col * (cellW + 20);
    const y0 = 100 + row * (cellH + 60);
    const inner = wallpaperPattern(leafDrawer, {
      group: g as WallpaperGroup,
      canvasW: cellW,
      canvasH: cellH,
      tileSize: 60,
      seed: 0xa770,
    });
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
    body += `<clipPath id="clip-${g}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#clip-${g})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.8"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 24}" text-anchor="middle" font-family="monospace" font-size="13" fill="#39312a">${g}</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '01-wallpaper-groups.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 01-wallpaper-groups.svg');
}

// ─── 2. Voronoi ────────────────────────────────────────────────────────
{
  const W = 1200;
  const H = 600;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '2. Voronoi tessellation — raw vs. Lloyd-relaxed (Centroidal)',
    'Same 80 random sites, left: raw Voronoi (chaotic cell sizes). Right: 5 iterations of Lloyd\'s algorithm (uniform cells, "soap-bubble" tiling).',
    40,
  );

  const cellW = 540;
  const cellH = 420;
  // Same seed → same initial sites; difference is relax count.
  const palette = ['#6e8b4f', '#a89c63', '#c25f3e', '#7b5b85', '#3f6a82', '#c89455', '#586a44', '#a1545f'];
  for (let i = 0; i < 2; i++) {
    const x0 = 40 + i * (cellW + 20);
    const y0 = 100;
    const cells = voronoi({
      count: 80,
      width: cellW,
      height: cellH,
      seed: 0x10a,
      stride: 3,
      relax: i === 0 ? 0 : 5,
    });
    const inner = voronoiSvg(
      cells,
      (cell, rng) => palette[Math.floor(rng() * palette.length)],
      { stroke: '#3a3128', strokeWidth: 0.8, seed: 0x100 + i },
    );
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<clipPath id="vor-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#vor-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.8"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 24}" text-anchor="middle" font-family="monospace" font-size="12" fill="#39312a">${i === 0 ? 'raw Voronoi (relax=0)' : 'CVT (Lloyd relax=5)'}</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '02-voronoi.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 02-voronoi.svg');
}

// ─── 3. L-systems ──────────────────────────────────────────────────────
{
  const W = 1200;
  const H = 700;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '3. L-systems — algorithmic botany via string-rewriting grammars',
    'Five archetypes. Stochastic alternatives where present (fern) produce unique-yet-coherent plants each seed.',
    40,
  );

  const archs = ['koch', 'fern', 'tree', 'plant', 'algae'] as const;
  const cellW = 220;
  const cellH = 460;
  for (let i = 0; i < archs.length; i++) {
    const kind = archs[i];
    const sys = lArch(kind, kind === 'koch' ? 4 : 6);
    const str = derive(sys, 0xb01 + i);
    const startX = cellW / 2;
    const startY = kind === 'koch' ? cellH * 0.45 : cellH * 0.95;
    const segments = turtle(str, sys, { x: startX, y: startY, heading: -Math.PI / 2 });

    const inner = lSystemSvg(segments, {
      stroke: kind === 'algae' ? '#5a7042' : '#3a2614',
      strokeWidth: kind === 'algae' ? 6 : 1.8,
      leafWidth: 0.3,
    });
    const x0 = 40 + i * (cellW + 12);
    const y0 = 100;
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
    body += `<clipPath id="ls-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#ls-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="12" fill="#39312a">${kind}</text>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 38}" text-anchor="middle" font-family="monospace" font-size="9" fill="#5b4f43">${segments.length} segments</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '03-l-systems.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 03-l-systems.svg');
}

// ─── 4. Curl-noise flow fields ─────────────────────────────────────────
{
  const W = 1200;
  const H = 700;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '4. Curl-noise flow fields — Fidenza-style streamlines',
    'Same noise field, three frequencies. Streamlines are advected through the divergence-free curl of the noise; separation prevents crossings.',
    40,
  );

  const freqs = [0.002, 0.005, 0.012];
  const cellW = 360;
  const cellH = 500;
  const palette = ['#2a2a2a', '#a85a3e', '#3f6a82'];
  for (let i = 0; i < freqs.length; i++) {
    const x0 = 40 + i * (cellW + 20);
    const y0 = 100;
    const lines = flowField({
      width: cellW,
      height: cellH,
      freq: freqs[i],
      seed: 0xfeed + i * 17,
      lines: 200,
      maxSteps: 600,
      stepLen: 1.6,
      separation: 9,
    });
    // Color streamlines deterministically (each line a slight variation).
    let inner = '';
    const rng = mulberry32(0x1234 + i);
    for (const line of lines) {
      const baseColor = palette[Math.floor(rng() * palette.length)];
      const sw = range(rng, 0.7, 2.4);
      const op = range(rng, 0.55, 0.95);
      inner += flowFieldSvg([line], { stroke: baseColor, strokeWidth: sw, opacity: op });
    }
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
    body += `<clipPath id="ff-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#ff-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 24}" text-anchor="middle" font-family="monospace" font-size="12" fill="#39312a">freq ${freqs[i]} → ${lines.length} streamlines</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '04-flow-field.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 04-flow-field.svg');
}

console.log(`\n✓ Phase B pattern operators rendered. Open ${outDir}/`);
