/**
 * Mouse renderer.
 *
 * Children's-book mouse: small round body, OVERSIZED round ears (the
 * mouse signature), long thin tail, tiny pink nose, beady eyes,
 * sometimes whiskers. Same parametric anatomy → byte-identical mouse
 * across pages.
 */

import type { Pt } from '../geometry';
import { handStroke } from '../drawing';
import type { Rng } from '../rng';
import type { Character, Pose, Placement } from '../character';
import { characterRng } from '../character';
import type { Palette } from '../palette';
import { watercolorWash, darken, lighten } from '../watercolor';
import { fmt2 } from '../math/det-format';
import { dSin, dCos } from '../math/det-math';
import { sargentCoupledColor } from '../../artmath/color/sargent-coupling';

export function drawMouse(
  c: Character,
  pose: Pose,
  place: Placement,
  rng: Rng,
  palette: Palette,
): string {
  const r = characterRng(c, 'mouse');
  const scale = c.scale * (place.scale ?? 1);
  const facingMul = pose.facing === 'left' ? -1 : pose.facing === 'right' ? 1 : 0;

  const ox = place.x;
  const oy = place.y;

  // Mouse is smaller than rabbit
  const bodyH = 55 * scale;
  const bodyW = 50 * scale;
  const headR = 30 * scale;

  const bodyCx = ox;
  const bodyCy = oy - bodyH / 2 - 8 * scale;
  const headCx = bodyCx + dSin(((pose.headTilt ?? 0) * Math.PI) / 180) * 5 * scale;
  const headCy = bodyCy - bodyH / 2 - headR * 0.5;

  let svg = '';

  // ── Tail (long, thin, curly — drawn behind body) ─────────────────
  svg += tailSvg(c, bodyCx, bodyCy, bodyW, bodyH, scale, facingMul, palette);

  // ── Body ─────────────────────────────────────────────────────────
  const bodyPoly = ovalPoly(bodyCx, bodyCy, bodyW * 0.5, bodyH * 0.5, 20, r, 0.06);
  svg += watercolorWash(bodyPoly, r, { color: c.furColor, opacity: 0.65, bleed: 4 });
  // Sargent shadow wash on lower-right
  const mouseShadowColor = sargentCoupledColor(c.furColor, -0.16, 0.7);
  const mouseShadowPoly = bodyPoly.map(
    ([x, y]) => [x + bodyW * 0.1, y + bodyH * 0.1] as Pt,
  );
  svg += watercolorWash(mouseShadowPoly, r, { color: mouseShadowColor, opacity: 0.32, bleed: 2, edge: 0.05 });
  const belly = ovalPoly(bodyCx, bodyCy + bodyH * 0.16, bodyW * 0.3, bodyH * 0.32, 14, r, 0.06);
  svg += watercolorWash(belly, r, { color: c.bellyColor, opacity: 0.82, bleed: 2, edge: 0.1 });
  svg += handStroke(bodyPoly, r, { color: palette.ink, width: 1.2, closed: true, overshoot: 0, wobble: 0.5 });

  // ── Legs (small + close together) ────────────────────────────────
  svg += legsSvg(pose, bodyCx, bodyCy + bodyH * 0.42, bodyW, scale, r, c, palette);

  // ── Arms ─────────────────────────────────────────────────────────
  svg += armsSvg(pose, bodyCx, bodyCy - bodyH * 0.05, bodyW, scale, r, c, palette);

  // ── Head ─────────────────────────────────────────────────────────
  const headPoly = ovalPoly(headCx, headCy, headR, headR * 0.92, 22, r, 0.05);
  svg += watercolorWash(headPoly, r, { color: c.furColor, opacity: 0.65, bleed: 4 });

  // ── Ears (large round, behind the head — the signature) ─────────
  svg += earsSvg(c, headCx, headCy, headR, scale, r, palette);

  // Muzzle patch (small lighter oval under nose area)
  const muzzleY = headCy + headR * 0.3;
  const muzzle = ovalPoly(headCx, muzzleY, headR * 0.42, headR * 0.36, 14, r, 0.06);
  svg += watercolorWash(muzzle, r, { color: c.bellyColor, opacity: 0.8, bleed: 2, edge: 0.08 });

  svg += handStroke(headPoly, r, { color: palette.ink, width: 1.2, closed: true, overshoot: 0, wobble: 0.5 });

  // ── Face details ─────────────────────────────────────────────────
  svg += faceSvg(c, pose, headCx, headCy, headR, scale, r, palette);

  // ── Accessory ────────────────────────────────────────────────────
  svg += accessorySvg(c, pose, headCx, headCy, bodyCx, bodyCy, bodyW, headR, scale, r, palette);

  return svg;
}

function ovalPoly(cx: number, cy: number, rx: number, ry: number, n: number, rng: Rng, irreg: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const m = 1 + (rng() - 0.5) * 2 * irreg;
    pts.push([cx + dCos(a) * rx * m, cy + dSin(a) * ry * m]);
  }
  return pts;
}

function tailSvg(
  c: Character, bx: number, by: number, bodyW: number, bodyH: number,
  scale: number, facingMul: number, palette: Palette,
): string {
  const sign = facingMul === 0 ? -1 : -facingMul;
  const baseX = bx + sign * bodyW * 0.4;
  const baseY = by + bodyH * 0.1;
  // Long curving tail (Q + Q for an S-curve)
  const midX = baseX + sign * 18 * scale;
  const midY = baseY - 8 * scale;
  const endX = baseX + sign * 26 * scale;
  const endY = baseY + 8 * scale;
  return `<path d="M${fmt2(baseX)} ${fmt2(baseY)} Q${fmt2(midX)} ${fmt2(midY)} ${fmt2(baseX + sign * 14 * scale)} ${fmt2(baseY + 4 * scale)} Q${fmt2(midX + sign * 8 * scale)} ${fmt2(midY + 16 * scale)} ${fmt2(endX)} ${fmt2(endY)}" stroke="${palette.ink}" stroke-width="${fmt2(1.4 * scale)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
}

function earsSvg(
  c: Character, hx: number, hy: number, headR: number,
  scale: number, rng: Rng, palette: Palette,
): string {
  let svg = '';
  for (const sign of [-1, 1]) {
    // Big round ears, positioned to the sides of the head top
    const cxE = hx + sign * headR * 0.75;
    const cyE = hy - headR * 0.65;
    const rE = headR * 0.55;
    // Outer ear (fur color, full size)
    const outer = ovalPoly(cxE, cyE, rE, rE * 0.95, 16, rng, 0.07);
    svg += watercolorWash(outer, rng, { color: c.furColor, opacity: 0.7, bleed: 2 });
    svg += handStroke(outer, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    // Inner ear (pink, smaller)
    const inner = ovalPoly(cxE, cyE + 1 * scale, rE * 0.6, rE * 0.55, 12, rng, 0.05);
    svg += watercolorWash(inner, rng, { color: c.cheekColor, opacity: 0.7, bleed: 1, edge: 0.1 });
  }
  return svg;
}

function legsSvg(
  pose: Pose, cx: number, cy: number, bodyW: number,
  scale: number, rng: Rng, c: Character, palette: Palette,
): string {
  const legR = 7 * scale;
  let svg = '';
  if (pose.legs === 'sit') {
    const ly = cy + 3 * scale;
    for (const sign of [-1, 1]) {
      const lx = cx + sign * bodyW * 0.16;
      const poly = ovalPoly(lx, ly, legR, legR * 0.85, 12, rng, 0.1);
      svg += watercolorWash(poly, rng, { color: c.bellyColor, opacity: 0.7, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  } else {
    for (const sign of [-1, 1]) {
      const lx = cx + sign * bodyW * 0.2;
      const ly = cy + 4 * scale;
      const poly = ovalPoly(lx, ly, legR * 0.9, legR * 1.0, 12, rng, 0.08);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  }
  return svg;
}

function armsSvg(
  pose: Pose, cx: number, cy: number, bodyW: number,
  scale: number, rng: Rng, c: Character, palette: Palette,
): string {
  let svg = '';
  const armR = 5 * scale;
  if (pose.arms === 'down') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.4;
      const ay = cy + 14 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  } else if (pose.arms === 'wave') {
    const sign = 1;
    const ax = cx + sign * bodyW * 0.5;
    const ay = cy - 18 * scale;
    const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
    svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
    svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    const ox = cx - sign * bodyW * 0.4;
    const oy = cy + 14 * scale;
    const poly2 = ovalLine(cx - sign * bodyW * 0.28, cy, ox, oy, armR);
    svg += watercolorWash(poly2, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
    svg += handStroke(poly2, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  } else if (pose.arms === 'reach-up') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.3;
      const ay = cy - 22 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  } else {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.13;
      const ay = cy + 12 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  }
  return svg;
}

function ovalLine(x1: number, y1: number, x2: number, y2: number, r: number): Pt[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  return [
    [x1 + px * r, y1 + py * r],
    [x2 + px * r, y2 + py * r],
    [x2 - px * r, y2 - py * r],
    [x1 - px * r, y1 - py * r],
  ];
}

function faceSvg(
  c: Character, pose: Pose, hx: number, hy: number, headR: number,
  scale: number, rng: Rng, palette: Palette,
): string {
  let svg = '';
  // Beady close-set eyes (mouse signature)
  const eyeY = hy - headR * 0.05;
  const eyeDx = headR * 0.22; // closer together than rabbit/owl
  const eyeR = 2.5 * scale;
  for (const sign of [-1, 1]) {
    const ex = hx + sign * eyeDx;
    if (pose.eyes === 'closed' || (pose.eyes === 'wink-left' && sign === -1) || (pose.eyes === 'wink-right' && sign === 1)) {
      svg += `<path d="M${fmt2(ex - eyeR * 1.4)} ${fmt2(eyeY)} Q${fmt2(ex)} ${fmt2(eyeY + eyeR * 1.2)} ${fmt2(ex + eyeR * 1.4)} ${fmt2(eyeY)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(1.2 * scale)}" stroke-linecap="round"/>`;
    } else {
      svg += `<circle cx="${fmt2(ex)}" cy="${fmt2(eyeY)}" r="${fmt2(eyeR)}" fill="${palette.ink}"/>`;
      svg += `<circle cx="${fmt2(ex + eyeR * 0.3)}" cy="${fmt2(eyeY - eyeR * 0.4)}" r="${fmt2(eyeR * 0.35)}" fill="#ffffff" opacity="0.92"/>`;
    }
  }

  // Cheek blush
  for (const sign of [-1, 1]) {
    const cxC = hx + sign * headR * 0.45;
    const cyC = hy + headR * 0.16;
    svg += `<ellipse cx="${fmt2(cxC)}" cy="${fmt2(cyC)}" rx="${fmt2(5 * scale)}" ry="${fmt2(3 * scale)}" fill="${c.cheekColor}" opacity="0.55"/>`;
  }

  // Tiny round pink nose
  const noseY = hy + headR * 0.28;
  svg += `<circle cx="${fmt2(hx)}" cy="${fmt2(noseY)}" r="${fmt2(2.5 * scale)}" fill="${c.noseColor}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;

  // Mouth: tiny W shape (mouse smile)
  const mouthY = noseY + 3.5 * scale;
  const w = 3.5 * scale;
  if (pose.mouth === 'smile' || pose.mouth === 'small') {
    svg += `<path d="M${fmt2(hx)} ${fmt2(noseY + 2 * scale)} L${fmt2(hx)} ${fmt2(mouthY)} M${fmt2(hx - w)} ${fmt2(mouthY)} Q${fmt2(hx - w / 2)} ${fmt2(mouthY + 1.5 * scale)} ${fmt2(hx)} ${fmt2(mouthY)} Q${fmt2(hx + w / 2)} ${fmt2(mouthY + 1.5 * scale)} ${fmt2(hx + w)} ${fmt2(mouthY)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(0.9 * scale)}" stroke-linecap="round"/>`;
  } else if (pose.mouth === 'open-o') {
    svg += `<ellipse cx="${fmt2(hx)}" cy="${fmt2(mouthY + 1 * scale)}" rx="${fmt2(1.5 * scale)}" ry="${fmt2(2 * scale)}" fill="${darken(c.cheekColor, 0.2)}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}"/>`;
  }

  // Long whiskers (mouse signature)
  for (let i = 0; i < 3; i++) {
    for (const sign of [-1, 1]) {
      const wx0 = hx + sign * headR * 0.2;
      const wy0 = noseY + 1 * scale + i * 1.5 * scale;
      const wx1 = wx0 + sign * (10 + i * 2.5) * scale;
      const wy1 = wy0 + (i - 1) * 1.5 * scale;
      svg += handStroke([[wx0, wy0], [wx1, wy1]], rng, {
        color: palette.inkSoft, width: 0.4 * scale, opacity: 0.7,
        wobble: 0.3, passes: 1, overshoot: 0,
      });
    }
  }
  void lighten;
  return svg;
}

function accessorySvg(
  c: Character, _pose: Pose, hx: number, hy: number, _bx: number, by: number,
  _bodyW: number, headR: number, scale: number, rng: Rng, palette: Palette,
): string {
  const a = c.accessory;
  if (a.kind === 'none') return '';
  let svg = '';
  if (a.kind === 'scarf') {
    const ny = (hy + headR * 0.9 + by - 25 * scale) / 2;
    const w = headR * 1.0;
    const poly: Pt[] = [
      [hx - w, ny - 3 * scale], [hx + w, ny - 3 * scale],
      [hx + w, ny + 6 * scale], [hx - w, ny + 6 * scale],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.75, bleed: 1.5 });
    svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.5, overshoot: 0 });
  } else if (a.kind === 'bowtie') {
    const ny = (hy + headR * 0.9 + by - 25 * scale) / 2;
    const w = 10 * scale;
    const h = 6 * scale;
    const poly: Pt[] = [
      [hx - w, ny - h], [hx - 1.5 * scale, ny - 1 * scale], [hx - w, ny + h],
      [hx + w, ny + h], [hx + 1.5 * scale, ny - 1 * scale], [hx + w, ny - h],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.85, bleed: 1 });
    svg += handStroke(poly, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0 });
  } else if (a.kind === 'flower') {
    const fx = hx - headR * 0.85;
    const fy = hy - headR * 0.5;
    const petals = 5;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2;
      const px = fx + dCos(ang) * 4 * scale;
      const py = fy + dSin(ang) * 4 * scale;
      svg += `<circle cx="${fmt2(px)}" cy="${fmt2(py)}" r="${fmt2(2.8 * scale)}" fill="${a.color}" opacity="0.85" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
    }
    svg += `<circle cx="${fmt2(fx)}" cy="${fmt2(fy)}" r="${fmt2(2 * scale)}" fill="${c.bellyColor}"/>`;
  } else if (a.kind === 'hat') {
    const tx = hx;
    const ty = hy - headR * 0.95;
    const brimW = headR * 0.9;
    const brim: Pt[] = [
      [tx - brimW, ty + 1 * scale], [tx + brimW, ty + 1 * scale],
      [tx + brimW * 0.6, ty - 1 * scale], [tx - brimW * 0.6, ty - 1 * scale],
    ];
    svg += watercolorWash(brim, rng, { color: a.color, opacity: 0.85, bleed: 1 });
    svg += handStroke(brim, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.5, overshoot: 0 });
    const crownW = headR * 0.55;
    const crownH = headR * 0.55;
    const crown: Pt[] = [
      [tx - crownW * 0.5, ty - 1 * scale], [tx - crownW * 0.4, ty - crownH],
      [tx + crownW * 0.4, ty - crownH], [tx + crownW * 0.5, ty - 1 * scale],
    ];
    svg += watercolorWash(crown, rng, { color: a.color, opacity: 0.9, bleed: 1 });
    svg += handStroke(crown, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.5, overshoot: 0 });
  }
  return svg;
}
