#!/usr/bin/env node
/**
 * scripts/phaseA-proof.ts
 *
 * Visual proof of Phase A foundation operators:
 *   1. Atmospheric perspective (Beer-Lambert depth blend)
 *   2. Sfumato chromatic edge bands (OKLab Bezier)
 *   3. Sargent value-temperature coupling (single-α hue rotation)
 *   4. Bouleau armature for composition (deterministic geometry)
 *   5. Notan value-pattern operators (Big T, steelyard, three-spot)
 *
 *   tsx scripts/phaseA-proof.ts [--out /tmp/phaseA]
 */

import fs from 'fs';
import path from 'path';

import {
  applyAtmospheric,
  atmosphericVeilSvg,
  CLEAR_DAY_ATMOSPHERE,
  SUNSET_ATMOSPHERE,
  FOG_ATMOSPHERE,
  layerEdgeBlur,
} from '../lib/artmath/perspective/atmospheric';
import { sfumatoEdgeSvg, sfumatoColorAt } from '../lib/artmath/edges/sfumato';
import { sargentRamp, sargentCoupledColor } from '../lib/artmath/color/sargent-coupling';
import {
  bouleauLines,
  bouleauPoints,
  rabatmentLines,
} from '../lib/artmath/composition/armature';
import {
  bigT,
  steelyard,
  threeSpot,
  checkNotan,
} from '../lib/artmath/value/notan';
import { fmt2 } from '../lib/illustrator/math/det-format';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/phaseA';
fs.mkdirSync(outDir, { recursive: true });

const W = 1200;

function header(text: string, sub: string, y: number): string {
  let s = `<text x="40" y="${y}" font-family="Georgia" font-size="22" fill="#39312a">${text}</text>`;
  s += `<text x="40" y="${y + 22}" font-family="Georgia" font-size="13" fill="#5b4f43" font-style="italic">${sub}</text>`;
  return s;
}

// ─── 1. Atmospheric perspective ────────────────────────────────────────
{
  const H = 600;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header('1. Atmospheric perspective — Beer-Lambert depth blend', 'Same red rectangle at 5 depths × 3 atmosphere models. Saturation drops, hue shifts toward haze color, contrast compresses.', 40);

  const atmospheres = [
    { name: 'clear day', model: CLEAR_DAY_ATMOSPHERE },
    { name: 'sunset', model: SUNSET_ATMOSPHERE },
    { name: 'fog', model: FOG_ATMOSPHERE },
  ];
  const baseColor = '#c84a3e';
  const stops = [0, 0.25, 0.5, 0.75, 1.0];
  const cellW = 90;
  const cellH = 90;
  const startY = 100;

  for (let row = 0; row < atmospheres.length; row++) {
    const a = atmospheres[row];
    body += `<text x="40" y="${startY + row * (cellH + 30) + 50}" font-family="monospace" font-size="12" fill="#39312a">${a.name}</text>`;
    for (let i = 0; i < stops.length; i++) {
      const x = 200 + i * (cellW + 12);
      const y = startY + row * (cellH + 30);
      const col = applyAtmospheric(baseColor, stops[i], a.model);
      body += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${col}" stroke="#39312a" stroke-width="0.5"/>`;
      body += `<text x="${x + cellW / 2}" y="${y + cellH + 14}" text-anchor="middle" font-family="monospace" font-size="10" fill="#39312a">d=${stops[i]}  blur=${fmt2(layerEdgeBlur(stops[i], a.model))}px</text>`;
    }
  }

  // Depth-veiled landscape demo
  const sceneY = startY + atmospheres.length * (cellH + 30) + 80;
  body += header('Same demo as atmospheric veil overlay (5-band landscape):', '', sceneY - 30);
  // Five horizontal bands at increasing depth
  const sceneH = 200;
  const bandH = sceneH / 5;
  for (let i = 0; i < 5; i++) {
    const depth = i / 4;
    const y = sceneY + i * bandH;
    body += `<rect x="40" y="${y}" width="${W - 80}" height="${bandH}" fill="${applyAtmospheric('#7a8c5e', depth, CLEAR_DAY_ATMOSPHERE)}"/>`;
    body += `<text x="50" y="${y + 14}" font-family="monospace" font-size="9" fill="#fff" opacity="0.85">d=${fmt2(depth)}</text>`;
  }

  void atmosphericVeilSvg;
  fs.writeFileSync(
    path.join(outDir, '01-atmospheric.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 01-atmospheric.svg');
}

// ─── 2. Sfumato chromatic edges ────────────────────────────────────────
{
  const H = 700;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header('2. Sfumato — chromatic Bezier edge in OKLab', 'NOT a value gradient: hue rotates through the band toward warm midpoint. Three intensities × multiple band-widths.', 40);

  // Color pair: skin shadow side / lit side
  const colorA = '#7e5640'; // shadow-side warm-brown
  const colorB = '#e8c79a'; // lit-side warm-cream

  // Row 1: three intensities at width 30
  const edge: import('../lib/illustrator/geometry').Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    edge.push([200 + i * 50, 200]);
  }
  const intensities = [0, 0.5, 1.0];
  for (let i = 0; i < intensities.length; i++) {
    const y = 110 + i * 100;
    const e: import('../lib/illustrator/geometry').Pt[] = edge.map((p) => [p[0], y]);
    body += `<text x="40" y="${y + 38}" font-family="monospace" font-size="11" fill="#39312a">chromaticity=${fmt2(intensities[i])}</text>`;
    body += sfumatoEdgeSvg(e, colorA, colorB, {
      width: 60,
      warmShiftDeg: -10,
      chromaticity: intensities[i],
      bands: 16,
    });
  }

  // Sample swatches showing the chromatic Bezier vs. straight lerp
  body += header('Chromatic Bezier (top) vs. straight RGB lerp (bottom) — same endpoints:', '', 460);
  const swatches = 9;
  for (let i = 0; i < swatches; i++) {
    const t = i / (swatches - 1);
    const x = 200 + i * 90;
    const cBezier = sfumatoColorAt(t, colorA, colorB, { warmShiftDeg: -10, chromaticity: 1.0 });
    body += `<rect x="${x}" y="490" width="80" height="80" fill="${cBezier}" stroke="#39312a" stroke-width="0.3"/>`;
    // Straight RGB lerp for comparison
    const a = parseInt(colorA.slice(1), 16);
    const b = parseInt(colorB.slice(1), 16);
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const lr = Math.round(ar + (br - ar) * t);
    const lg = Math.round(ag + (bg - ag) * t);
    const lb = Math.round(ab + (bb - ab) * t);
    const cLerp = '#' + ((lr << 16) | (lg << 8) | lb).toString(16).padStart(6, '0');
    body += `<rect x="${x}" y="580" width="80" height="80" fill="${cLerp}" stroke="#39312a" stroke-width="0.3"/>`;
    body += `<text x="${x + 40}" y="675" text-anchor="middle" font-family="monospace" font-size="9" fill="#39312a">t=${fmt2(t)}</text>`;
  }

  fs.writeFileSync(
    path.join(outDir, '02-sfumato.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 02-sfumato.svg');
}

// ─── 3. Sargent value-temperature coupling ─────────────────────────────
{
  const H = 600;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header('3. Sargent value-temperature coupling — single α controls hue shift per ΔV', 'Each row: same base color, 7-stop value ramp. Top row α=0 (Bouguereau, dead). Bottom row α=1 (Sargent, alive).', 40);

  const baseColors = ['#a07153', '#7a8b6b', '#5b7fb0', '#c47f5b'];
  const alphas = [0, 0.3, 0.6, 0.9];
  const stopsCount = 7;

  for (let row = 0; row < alphas.length; row++) {
    const alpha = alphas[row];
    body += `<text x="40" y="${110 + row * 110 + 60}" font-family="monospace" font-size="11" fill="#39312a">α=${fmt2(alpha)}</text>`;
    for (let col = 0; col < baseColors.length; col++) {
      const base = baseColors[col];
      const ramp = sargentRamp(base, stopsCount, alpha, 0.5);
      const groupY = 110 + row * 110;
      const groupX = 200 + col * 230;
      for (let i = 0; i < ramp.length; i++) {
        const cellW = 30;
        body += `<rect x="${groupX + i * cellW}" y="${groupY}" width="${cellW}" height="80" fill="${ramp[i]}"/>`;
      }
    }
  }

  // Single-color drill-down: visualize the hue rotation
  body += header('Single-color drill: skin tone with α=1, rotated hue per value step.', 'Watch the cool-shadow → warm-light shift. This is what makes Sargent\'s portraits feel lit.', 540);
  const skinBase = '#b8866a';
  const stops = 11;
  for (let i = 0; i < stops; i++) {
    const t = (i / (stops - 1)) - 0.5;
    const c = sargentCoupledColor(skinBase, t * 0.45, 1.0);
    body += `<rect x="${100 + i * 95}" y="565" width="85" height="20" fill="${c}"/>`;
  }

  fs.writeFileSync(
    path.join(outDir, '03-sargent-coupling.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 03-sargent-coupling.svg');
}

// ─── 4. Bouleau armature ───────────────────────────────────────────────
{
  const H = 600;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header('4. Bouleau armature — deterministic compositional geometry', 'Three densities of the rectangle armature. Power-points marked. Used to snap focal subject placement.', 40);

  const cellW = 360;
  const cellH = 280;
  const cellY = 100;
  const cellH_ = cellH;
  const levels = ['thirds', 'harmonic14', 'full'] as const;
  const labels = ['rule of thirds (4 lines, 4 power points)', 'harmonic 14 (Bouleau canon)', 'full Bouleau (+reciprocal-diagonals)'];

  for (let i = 0; i < levels.length; i++) {
    const x0 = 40 + i * (cellW + 20);
    const lines = bouleauLines(cellW, cellH_, levels[i]);
    const points = bouleauPoints(cellW, cellH_, levels[i]);
    body += `<rect x="${x0}" y="${cellY}" width="${cellW}" height="${cellH_}" fill="#fbf5e9" stroke="#39312a" stroke-width="0.8"/>`;
    body += `<text x="${x0 + cellW / 2}" y="${cellY + cellH_ + 26}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">${labels[i]}</text>`;
    for (const line of lines) {
      body += `<line x1="${x0 + line.from[0]}" y1="${cellY + line.from[1]}" x2="${x0 + line.to[0]}" y2="${cellY + line.to[1]}" stroke="#a85a3e" stroke-width="0.8" opacity="0.65"/>`;
    }
    for (const p of points) {
      body += `<circle cx="${x0 + p[0]}" cy="${cellY + p[1]}" r="5" fill="#a85a3e" stroke="#39312a" stroke-width="0.7"/>`;
    }
  }

  // Rabatment demo
  body += header('Rabatment lines for non-square rectangle (Vermeer\'s "Pearl Earring" anchors here):', '', 470);
  const rcw = 800;
  const rch = 80;
  const rx = 200;
  const ry = 490;
  body += `<rect x="${rx}" y="${ry}" width="${rcw}" height="${rch}" fill="#fbf5e9" stroke="#39312a" stroke-width="0.8"/>`;
  for (const line of rabatmentLines(rcw, rch)) {
    body += `<line x1="${rx + line.from[0]}" y1="${ry + line.from[1]}" x2="${rx + line.to[0]}" y2="${ry + line.to[1]}" stroke="#a85a3e" stroke-width="2" opacity="0.7"/>`;
  }
  // Both rabatment squares outlined
  body += `<rect x="${rx}" y="${ry}" width="${rch}" height="${rch}" fill="none" stroke="#7e6a52" stroke-width="0.5" stroke-dasharray="3 3"/>`;
  body += `<rect x="${rx + rcw - rch}" y="${ry}" width="${rch}" height="${rch}" fill="none" stroke="#7e6a52" stroke-width="0.5" stroke-dasharray="3 3"/>`;

  fs.writeFileSync(
    path.join(outDir, '04-armature.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 04-armature.svg');
}

// ─── 5. Notan value-pattern operators ──────────────────────────────────
{
  const H = 700;
  let body = `<rect width="${W}" height="${H}" fill="#fbf7ec"/>`;
  body += header('5. Notan value-pattern operators — masterpiece composition skeletons', 'Big T (Powell), Steelyard (Payne), Three-Spot (Sargent). Each pattern reads at thumbnail; each passes the dominance/unequal rules.', 40);

  // Map value bins to grayscale hex
  const valueColor: Record<number, string> = { 1: '#262626', 2: '#5a5247', 3: '#9b8f7b', 4: '#d4c8ad', 5: '#f6efe1' };

  const patterns = [
    { name: 'Big T (stem under bar)', mask: bigT(360, 280, { stemX: 0.55, barY: 0.30, darkBin: 2, lightBin: 4 }) },
    { name: 'Steelyard (auto-balanced)', mask: steelyard(360, 280, { fulcrumX: 0.55, bigMassX: 0.32, massY: 0.55, bigRadius: 0.22, smallRadius: 0.06, darkBin: 2, lightBin: 4 }) },
    { name: 'Three-spot (Sargent lanterns)', mask: threeSpot(360, 280) },
  ];

  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i];
    const x0 = 40 + i * (360 + 20);
    const y0 = 100;
    // Render mask as small grid of cells
    const gx = 60, gy = 47;
    for (let j = 0; j < gy; j++) {
      for (let k = 0; k < gx; k++) {
        const cx = (k + 0.5) * (360 / gx);
        const cy = (j + 0.5) * (280 / gy);
        const v = p.mask.at(cx, cy);
        body += `<rect x="${x0 + k * (360 / gx)}" y="${y0 + j * (280 / gy)}" width="${360 / gx + 0.5}" height="${280 / gy + 0.5}" fill="${valueColor[v]}"/>`;
      }
    }
    body += `<rect x="${x0}" y="${y0}" width="360" height="280" fill="none" stroke="#39312a" stroke-width="0.6"/>`;
    body += `<text x="${x0 + 180}" y="${y0 + 308}" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">${p.name}</text>`;
    const check = checkNotan(p.mask);
    body += `<text x="${x0 + 180}" y="${y0 + 326}" text-anchor="middle" font-family="monospace" font-size="9" fill="${check.passes ? '#3a6f3a' : '#a85a3e'}">${check.passes ? '✓ passes' : '✗ ' + check.reasons.join('; ')} (dominance ${fmt2(check.dominanceShare)})</text>`;
  }

  // Show 5-value scale
  body += header('5-value scale (1=black, 5=white):', '', 480);
  for (let v = 1; v <= 5; v++) {
    body += `<rect x="${100 + (v - 1) * 130}" y="500" width="120" height="80" fill="${valueColor[v]}" stroke="#39312a" stroke-width="0.4"/>`;
    body += `<text x="${100 + (v - 1) * 130 + 60}" y="600" text-anchor="middle" font-family="monospace" font-size="11" fill="#39312a">value ${v}</text>`;
  }

  // Validation note
  body += `<text x="40" y="640" font-family="Georgia" font-size="14" fill="#39312a" font-style="italic">Validation rules enforced: dominance > 0.5 (one bin owns the canvas), smallest non-zero share &lt; 0.15 (unequal beats balance).</text>`;
  body += `<text x="40" y="666" font-family="Georgia" font-size="14" fill="#39312a" font-style="italic">Result: each pattern is a target mask the renderer can constrain its element value choices against.</text>`;

  fs.writeFileSync(
    path.join(outDir, '05-notan.svg'),
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`,
  );
  console.log('  ✎ 05-notan.svg');
}

console.log(`\n✓ Phase A foundation operators rendered. Open ${outDir}/`);
