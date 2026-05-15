#!/usr/bin/env node
/**
 * scripts/phaseC-proof.ts
 *
 * Phase C operator proof: the second wave of pattern primitives.
 *   1. Reaction-diffusion (Gray-Scott Turing patterns, 7 presets)
 *   2. Strange attractors (Clifford / de Jong / Svensson)
 *   3. Stippling (Poisson-disk by density)
 *   4. Cross-hatching (Dürer / Rembrandt drawing techniques)
 *
 *   tsx scripts/phaseC-proof.ts [--out /tmp/phaseC]
 */

import fs from 'fs';
import path from 'path';

import {
  reactionDiffusion,
  rdFieldSvg,
  RD_PRESETS,
} from '../lib/artmath/pattern/reaction-diffusion';
import {
  iterateAttractor,
  attractorSvg,
  ATTRACTOR_PRESETS,
} from '../lib/artmath/pattern/strange-attractors';
import { stipple, stippleSvg, blobsDensity } from '../lib/artmath/pattern/stippling';
import { hatch, type HatchStyle } from '../lib/artmath/pattern/hatching';
import { fmt2 } from '../lib/illustrator/math/det-format';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/phaseC';
fs.mkdirSync(outDir, { recursive: true });

function header(text: string, sub: string, y: number): string {
  let s = `<text x="40" y="${y}" font-family="Georgia" font-size="22" fill="#39312a">${text}</text>`;
  s += `<text x="40" y="${y + 22}" font-family="Georgia" font-size="13" fill="#5b4f43" font-style="italic">${sub}</text>`;
  return s;
}

// ─── 1. Reaction-diffusion ─────────────────────────────────────────────
{
  const W = 1400;
  const H = 760;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '1. Reaction-diffusion — Gray-Scott Turing patterns',
    'Same equations, different (f, k) parameters. Each pattern is a stable solution of ∂U/∂t = Du·∇²U − UV² + f·(1 − U).',
    40,
  );

  const presets: (keyof typeof RD_PRESETS)[] = ['spots', 'stripes', 'maze', 'soliton', 'bubbles', 'mitosis', 'coral'];
  const cellW = 180;
  const cellH = 180;
  const cols = 4;
  for (let i = 0; i < presets.length; i++) {
    const p = presets[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = 40 + col * (cellW + 20);
    const y0 = 100 + row * (cellH + 70);
    const field = reactionDiffusion({
      width: cellW,
      height: cellH,
      cellSize: 2,
      steps: 3500,
      preset: p,
      seed: 0xa00 + i,
    });
    const inner = rdFieldSvg(field, { colorLow: '#fbf3df', colorHigh: '#3a2614' });
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<clipPath id="rd-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#rd-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `</g>`;
    const preset = RD_PRESETS[p];
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 18}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">${preset.label}</text>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 32}" text-anchor="middle" font-family="monospace" font-size="9" fill="#5b4f43">f=${fmt2(preset.f)} k=${fmt2(preset.k)}</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '01-reaction-diffusion.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 01-reaction-diffusion.svg');
}

// ─── 2. Strange attractors ─────────────────────────────────────────────
{
  const W = 1400;
  const H = 940;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '2. Strange attractors — Pickover, de Jong, Svensson',
    'Each point cloud is 80,000 iterations of a chaotic map. Different parameters trace radically different fractal limit sets.',
    40,
  );

  const presets: (keyof typeof ATTRACTOR_PRESETS)[] = [
    'cliffordA', 'cliffordB', 'cliffordC',
    'dejongA', 'dejongB', 'dejongC',
    'svenssonA', 'svenssonB',
  ];
  const cellW = 320;
  const cellH = 320;
  const cols = 4;
  for (let i = 0; i < presets.length; i++) {
    const key = presets[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = 40 + col * (cellW + 12);
    const y0 = 100 + row * (cellH + 60);
    const pts = iterateAttractor({ preset: key, iterations: 80000 });
    const inner = attractorSvg(pts, {
      width: cellW,
      height: cellH,
      padding: 14,
      dotR: 0.45,
      color: '#28201a',
      opacity: 0.08,
      sampleEvery: 1,
    });
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<rect width="${cellW}" height="${cellH}" fill="#fbf3df"/>`;
    body += `<clipPath id="att-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#att-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">${key} (${ATTRACTOR_PRESETS[key].kind})</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '02-strange-attractors.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 02-strange-attractors.svg');
}

// ─── 3. Stippling ──────────────────────────────────────────────────────
{
  const W = 1400;
  const H = 500;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '3. Stippling — Poisson-disk by density',
    'Density function = sum of Gaussian blobs. Dots are Poisson-disk-distributed with adaptive radius. Seurat / Dürer engraving aesthetic.',
    40,
  );

  // Build a density field: three blobs forming a soft "portrait" silhouette.
  const cellW = 420;
  const cellH = 340;
  // Three different blob configurations.
  const configs = [
    {
      title: 'sparse — single blob',
      blobs: [{ x: cellW / 2, y: cellH / 2, r: 110, strength: 1.0 }],
    },
    {
      title: 'pair — two highlights',
      blobs: [
        { x: cellW * 0.32, y: cellH * 0.45, r: 90, strength: 1.0 },
        { x: cellW * 0.70, y: cellH * 0.60, r: 110, strength: 0.85 },
      ],
    },
    {
      title: 'cluster — five overlapping',
      blobs: [
        { x: cellW * 0.30, y: cellH * 0.50, r: 80, strength: 1.0 },
        { x: cellW * 0.50, y: cellH * 0.35, r: 70, strength: 0.95 },
        { x: cellW * 0.70, y: cellH * 0.55, r: 75, strength: 0.95 },
        { x: cellW * 0.55, y: cellH * 0.70, r: 60, strength: 0.85 },
        { x: cellW * 0.40, y: cellH * 0.20, r: 50, strength: 0.75 },
      ],
    },
  ];

  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const density = blobsDensity(cfg.blobs);
    const pts = stipple({
      width: cellW,
      height: cellH,
      density,
      method: 'poisson',
      rMin: 3,
      rMax: 14,
      seed: 0xb00 + i,
    });
    const inner = stippleSvg(pts, {
      densityFn: density,
      rMin: 0.5,
      rMax: 1.4,
      color: '#1a1612',
    });
    const x0 = 40 + i * (cellW + 16);
    const y0 = 100;
    body += `<g transform="translate(${x0} ${y0})">`;
    body += `<rect width="${cellW}" height="${cellH}" fill="#fdfaf2"/>`;
    body += `<clipPath id="stip-clip-${i}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
    body += `<g clip-path="url(#stip-clip-${i})">${inner}</g>`;
    body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `</g>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 22}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">${cfg.title}</text>`;
    body += `<text x="${x0 + cellW / 2}" y="${y0 + cellH + 38}" text-anchor="middle" font-family="monospace" font-size="9" fill="#5b4f43">${pts.length} dots</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '03-stippling.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 03-stippling.svg');
}

// ─── 4. Cross-hatching ─────────────────────────────────────────────────
{
  const W = 1400;
  const H = 800;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header(
    '4. Cross-hatching — Dürer / Rembrandt tonal rendering',
    'Tone built from parallel pen strokes. Four styles × four tone levels.',
    40,
  );

  const styles: HatchStyle[] = ['parallel', 'cross', 'triple', 'rembrandt'];
  const tones = [0.20, 0.40, 0.65, 0.90];
  const cellW = 160;
  const cellH = 130;
  const rowOffset = 110;
  for (let row = 0; row < styles.length; row++) {
    const style = styles[row];
    body += `<text x="40" y="${rowOffset + row * (cellH + 30) + cellH / 2 + 5}" font-family="monospace" font-size="12" fill="#39312a">${style}</text>`;
    for (let col = 0; col < tones.length; col++) {
      const x0 = 180 + col * (cellW + 12);
      const y0 = rowOffset + row * (cellH + 30);
      const inner = hatch({
        width: cellW,
        height: cellH,
        tone: tones[col],
        style,
        angle: Math.PI / 4,
        minSpacing: 2.5,
        maxSpacing: 14,
        jitter: 0.3,
        seed: 0xc00 + row * 7 + col,
      });
      body += `<g transform="translate(${x0} ${y0})">`;
      body += `<rect width="${cellW}" height="${cellH}" fill="#fcf6e7"/>`;
      body += `<clipPath id="hatch-clip-${row}-${col}"><rect width="${cellW}" height="${cellH}"/></clipPath>`;
      body += `<g clip-path="url(#hatch-clip-${row}-${col})">${inner}</g>`;
      body += `<rect width="${cellW}" height="${cellH}" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
      body += `</g>`;
      if (row === 0) {
        body += `<text x="${x0 + cellW / 2}" y="${y0 - 8}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">tone ${fmt2(tones[col])}</text>`;
      }
    }
  }

  fs.writeFileSync(
    path.join(outDir, '04-hatching.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 04-hatching.svg');
}

console.log(`\n✓ Phase C operators rendered. Open ${outDir}/`);
