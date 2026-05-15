/**
 * Fox renderer.
 *
 * Children's-book fox: orange-amber fur with white belly + cheeks +
 * tail tip, pointed muzzle, large triangle ears, narrow almond eyes,
 * bushy tail. Same parametric anatomy → byte-identical fox across
 * pages, regardless of pose.
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

export function drawFox(
  c: Character,
  pose: Pose,
  place: Placement,
  rng: Rng,
  palette: Palette,
): string {
  const r = characterRng(c, 'fox');
  const scale = c.scale * (place.scale ?? 1);
  const facingMul = pose.facing === 'left' ? -1 : pose.facing === 'right' ? 1 : 0;

  const ox = place.x;
  const oy = place.y;

  // Fox is leaner than rabbit/owl, taller and longer
  const bodyH = 70 * scale;
  const bodyW = 60 * scale;
  const headR = 34 * scale;

  const bodyCx = ox;
  const bodyCy = oy - bodyH / 2 - 10 * scale;
  const headCx = bodyCx + dSin(((pose.headTilt ?? 0) * Math.PI) / 180) * 8 * scale;
  const headCy = bodyCy - bodyH / 2 - headR * 0.55;

  let svg = '';

  // ── Bushy tail (behind body, opposite of facing direction) ────────
  svg += tailSvg(c, bodyCx, bodyCy, bodyW, bodyH, scale, facingMul, r, palette);

  // ── Body ─────────────────────────────────────────────────────────
  const bodyPoly = ovalPoly(bodyCx, bodyCy, bodyW * 0.5, bodyH * 0.5, 22, r, 0.07);
  svg += watercolorWash(bodyPoly, r, { color: c.furColor, opacity: 0.62, bleed: 5 });
  // Sargent shadow wash on lower-right
  const foxShadowColor = sargentCoupledColor(c.furColor, -0.18, 0.7);
  const foxShadowPoly = bodyPoly.map(
    ([x, y]) => [x + bodyW * 0.12, y + bodyH * 0.12] as Pt,
  );
  svg += watercolorWash(foxShadowPoly, r, { color: foxShadowColor, opacity: 0.35, bleed: 3, edge: 0.05 });
  // White belly + chest patch
  const belly = ovalPoly(bodyCx, bodyCy + bodyH * 0.18, bodyW * 0.32, bodyH * 0.4, 16, r, 0.06);
  svg += watercolorWash(belly, r, { color: c.bellyColor, opacity: 0.85, bleed: 3, edge: 0.1 });
  svg += handStroke(bodyPoly, r, {
    color: palette.ink, width: 1.3, closed: true, overshoot: 0, wobble: 0.6,
  });

  // ── Legs ─────────────────────────────────────────────────────────
  svg += legsSvg(pose, bodyCx, bodyCy + bodyH * 0.42, bodyW, scale, r, c, palette);

  // ── Arms ─────────────────────────────────────────────────────────
  svg += armsSvg(pose, bodyCx, bodyCy - bodyH * 0.05, bodyW, scale, r, c, palette);

  // ── Head (tapered toward muzzle) ─────────────────────────────────
  const headPoly = headShape(headCx, headCy, headR, scale, r);
  svg += watercolorWash(headPoly, r, { color: c.furColor, opacity: 0.62, bleed: 5 });

  // White cheek/muzzle patch (the signature fox mark)
  const muzzleY = headCy + headR * 0.35;
  const muzzle = ovalPoly(headCx, muzzleY, headR * 0.5, headR * 0.45, 14, r, 0.07);
  svg += watercolorWash(muzzle, r, { color: c.bellyColor, opacity: 0.85, bleed: 2, edge: 0.08 });

  svg += handStroke(headPoly, r, {
    color: palette.ink, width: 1.3, closed: true, overshoot: 0, wobble: 0.6,
  });

  // ── Triangle ears (large, pointed, behind/beside head) ───────────
  svg += earsSvg(c, headCx, headCy, headR, scale, r, palette);

  // ── Face: narrow almond eyes, small triangular nose, smile ───────
  svg += faceSvg(c, pose, headCx, headCy, headR, scale, r, palette);

  // ── Accessory ────────────────────────────────────────────────────
  svg += accessorySvg(c, pose, headCx, headCy, bodyCx, bodyCy, bodyW, headR, scale, r, palette);

  return svg;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function ovalPoly(cx: number, cy: number, rx: number, ry: number, n: number, rng: Rng, irreg: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const m = 1 + (rng() - 0.5) * 2 * irreg;
    pts.push([cx + dCos(a) * rx * m, cy + dSin(a) * ry * m]);
  }
  return pts;
}

function headShape(cx: number, cy: number, r: number, scale: number, rng: Rng): Pt[] {
  // Slightly elongated toward the bottom (toward the muzzle).
  const pts: Pt[] = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // Stretch the lower half slightly toward "down" axis.
    const stretch = 1 + 0.12 * Math.max(0, dSin(a));
    const m = 1 + (rng() - 0.5) * 0.05;
    pts.push([cx + dCos(a) * r * m, cy + dSin(a) * r * stretch * m]);
  }
  void scale;
  return pts;
}

function tailSvg(
  c: Character, bx: number, by: number, bodyW: number, bodyH: number,
  scale: number, facingMul: number, rng: Rng, palette: Palette,
): string {
  let svg = '';
  // Tail curls up and back. Use a series of overlapping circles to make a fluffy curve.
  const sign = facingMul === 0 ? -1 : -facingMul; // opposite of facing
  const baseX = bx + sign * bodyW * 0.45;
  const baseY = by + bodyH * 0.15;

  // Build a sequence of points forming a curved tail.
  const points: { x: number; y: number; r: number }[] = [];
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    // S-curve outward then up.
    const angle = -Math.PI * 0.35 - t * Math.PI * 0.5;
    const dist = (10 + i * 7) * scale;
    points.push({
      x: baseX + sign * dist * dCos(angle),
      y: baseY + dist * dSin(angle),
      r: (10 - i * 1.2) * scale,
    });
  }

  // Render as overlapping watercolor blobs.
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const blob: Pt[] = [];
    const n = 14;
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      const m = 1 + (rng() - 0.5) * 0.1;
      blob.push([p.x + dCos(a) * p.r * m, p.y + dSin(a) * p.r * 0.9 * m]);
    }
    const color = i === points.length - 1
      ? c.bellyColor // white tail tip
      : darken(c.furColor, 0.03);
    svg += watercolorWash(blob, rng, { color, opacity: 0.7, bleed: 2 });
    svg += handStroke(blob, rng, {
      color: palette.ink, width: 0.9, closed: true, wobble: 0.5, overshoot: 0, passes: 1,
    });
  }
  return svg;
}

function earsSvg(
  c: Character, hx: number, hy: number, headR: number,
  scale: number, rng: Rng, palette: Palette,
): string {
  let svg = '';
  const tiltDeg = c.featureTilt;
  for (const sign of [-1, 1]) {
    const baseX = hx + sign * headR * 0.7;
    const baseY = hy - headR * 0.45;
    const tipX = baseX + sign * 4 * scale + dSin((tiltDeg * Math.PI) / 180) * 3 * scale;
    const tipY = baseY - 28 * scale;
    const ear: Pt[] = [
      [baseX - sign * 5 * scale, baseY + 3 * scale],
      [tipX, tipY],
      [baseX + sign * 7 * scale, baseY + 2 * scale],
    ];
    svg += watercolorWash(ear, rng, { color: c.furColor, opacity: 0.7, bleed: 2 });
    // Inner ear blush
    const inner: Pt[] = [
      [baseX, baseY + 1 * scale],
      [tipX - sign * 1 * scale, tipY + 6 * scale],
      [baseX + sign * 4 * scale, baseY],
    ];
    svg += watercolorWash(inner, rng, { color: c.cheekColor, opacity: 0.7, bleed: 1, edge: 0.1 });
    svg += handStroke(ear, rng, {
      color: palette.ink, width: 1.0, closed: true, wobble: 0.5, overshoot: 0, passes: 1,
    });
  }
  return svg;
}

function legsSvg(
  pose: Pose, cx: number, cy: number, bodyW: number,
  scale: number, rng: Rng, c: Character, palette: Palette,
): string {
  const legR = 8 * scale;
  let svg = '';
  if (pose.legs === 'sit') {
    const ly = cy + 4 * scale;
    for (const sign of [-1, 1]) {
      const lx = cx + sign * bodyW * 0.2;
      const poly = ovalPoly(lx, ly, legR, legR * 0.85, 12, rng, 0.1);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 2 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  } else {
    for (const sign of [-1, 1]) {
      const lx = cx + sign * bodyW * 0.22;
      const ly = cy + 4 * scale;
      const offset = pose.legs === 'walk' ? sign * 2 * scale : 0;
      const top: Pt = [lx + offset * 0.5, cy - 2 * scale];
      const bot: Pt = [lx + offset, ly + 10 * scale];
      const left: Pt = [lx - legR * 0.4, top[1]];
      const right: Pt = [lx + legR * 0.4, top[1]];
      const botL: Pt = [bot[0] - legR * 0.4, bot[1]];
      const botR: Pt = [bot[0] + legR * 0.4, bot[1]];
      const poly = [left, right, botR, botL];
      svg += watercolorWash(poly, rng, { color: darken(c.furColor, 0.08), opacity: 0.75, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 0.95, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
      void top;
    }
  }
  return svg;
}

function armsSvg(
  pose: Pose, cx: number, cy: number, bodyW: number,
  scale: number, rng: Rng, c: Character, palette: Palette,
): string {
  let svg = '';
  const armR = 6 * scale;
  if (pose.arms === 'down') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.38;
      const ay = cy + 16 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  } else if (pose.arms === 'wave') {
    const sign = 1;
    const ax = cx + sign * bodyW * 0.5;
    const ay = cy - 22 * scale;
    const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
    svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
    svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    const ox = cx - sign * bodyW * 0.38;
    const oy = cy + 16 * scale;
    const poly2 = ovalLine(cx - sign * bodyW * 0.28, cy, ox, oy, armR);
    svg += watercolorWash(poly2, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
    svg += handStroke(poly2, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  } else if (pose.arms === 'reach-up') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.3;
      const ay = cy - 28 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    }
  } else {
    // hold-front, hugging
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.15;
      const ay = cy + 14 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.28, cy, ax, ay, armR);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.65, bleed: 1.5 });
      svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
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
  const eyeY = hy - headR * 0.15;
  const eyeDx = headR * 0.36;
  // Narrow almond eyes (fox signature)
  for (const sign of [-1, 1]) {
    const ex = hx + sign * eyeDx;
    if (pose.eyes === 'closed' || (pose.eyes === 'wink-left' && sign === -1) || (pose.eyes === 'wink-right' && sign === 1)) {
      svg += `<path d="M${fmt2(ex - 4 * scale)} ${fmt2(eyeY)} Q${fmt2(ex)} ${fmt2(eyeY + 2 * scale)} ${fmt2(ex + 4 * scale)} ${fmt2(eyeY)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(1.3 * scale)}" stroke-linecap="round"/>`;
    } else {
      // Almond shape
      svg += `<ellipse cx="${fmt2(ex)}" cy="${fmt2(eyeY)}" rx="${fmt2(3.5 * scale)}" ry="${fmt2(2.2 * scale)}" fill="${palette.ink}" transform="rotate(${-sign * 8} ${fmt2(ex)} ${fmt2(eyeY)})"/>`;
      // Tiny highlight
      svg += `<circle cx="${fmt2(ex + 0.8 * scale)}" cy="${fmt2(eyeY - 0.8 * scale)}" r="${fmt2(0.8 * scale)}" fill="#ffffff" opacity="0.9"/>`;
    }
  }

  // Cheek blush
  for (const sign of [-1, 1]) {
    const cxC = hx + sign * headR * 0.42;
    const cyC = hy + headR * 0.15;
    svg += `<ellipse cx="${fmt2(cxC)}" cy="${fmt2(cyC)}" rx="${fmt2(5 * scale)}" ry="${fmt2(3 * scale)}" fill="${c.cheekColor}" opacity="0.55"/>`;
  }

  // Triangular nose at tip of muzzle
  const noseY = hy + headR * 0.45;
  const noseSize = 3 * scale;
  svg += `<path d="M${fmt2(hx - noseSize)} ${fmt2(noseY)} L${fmt2(hx + noseSize)} ${fmt2(noseY)} L${fmt2(hx)} ${fmt2(noseY + noseSize * 0.9)} Z" fill="${c.noseColor}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}" stroke-linejoin="round"/>`;

  // Mouth
  const mouthY = noseY + noseSize * 0.9;
  const w = 5 * scale;
  if (pose.mouth === 'smile' || pose.mouth === 'small') {
    svg += `<path d="M${fmt2(hx)} ${fmt2(mouthY)} L${fmt2(hx)} ${fmt2(mouthY + 2 * scale)} M${fmt2(hx - w)} ${fmt2(mouthY + 2 * scale)} Q${fmt2(hx)} ${fmt2(mouthY + 4 * scale)} ${fmt2(hx + w)} ${fmt2(mouthY + 2 * scale)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(1.0 * scale)}" stroke-linecap="round"/>`;
  } else if (pose.mouth === 'open-o') {
    svg += `<ellipse cx="${fmt2(hx)}" cy="${fmt2(mouthY + 3 * scale)}" rx="${fmt2(2 * scale)}" ry="${fmt2(2.5 * scale)}" fill="${darken(c.cheekColor, 0.2)}" stroke="${palette.ink}" stroke-width="${fmt2(0.8 * scale)}"/>`;
  } else if (pose.mouth === 'frown') {
    svg += `<path d="M${fmt2(hx - w)} ${fmt2(mouthY + 4 * scale)} Q${fmt2(hx)} ${fmt2(mouthY + 1 * scale)} ${fmt2(hx + w)} ${fmt2(mouthY + 4 * scale)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(1.0 * scale)}" stroke-linecap="round"/>`;
  }

  // A few whiskers
  for (let i = 0; i < 2; i++) {
    for (const sign of [-1, 1]) {
      const wx0 = hx + sign * headR * 0.3;
      const wy0 = noseY + 2 * scale + i * 1.6 * scale;
      const wx1 = wx0 + sign * (10 + i * 2) * scale;
      const wy1 = wy0 + (i - 0.5) * 1.6 * scale;
      svg += handStroke([[wx0, wy0], [wx1, wy1]], rng, {
        color: palette.inkSoft, width: 0.5 * scale, opacity: 0.65,
        wobble: 0.3, passes: 1, overshoot: 0,
      });
    }
  }
  void lighten;
  return svg;
}

function accessorySvg(
  c: Character, _pose: Pose, hx: number, hy: number, bx: number, by: number,
  _bodyW: number, headR: number, scale: number, rng: Rng, palette: Palette,
): string {
  const a = c.accessory;
  if (a.kind === 'none') return '';
  let svg = '';
  void bx;
  if (a.kind === 'scarf') {
    const ny = (hy + headR * 0.95 + by - 30 * scale) / 2;
    const w = headR * 1.2;
    const poly: Pt[] = [
      [hx - w, ny - 4 * scale],
      [hx + w, ny - 4 * scale],
      [hx + w, ny + 8 * scale],
      [hx - w, ny + 8 * scale],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.75, bleed: 2 });
    svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.5, overshoot: 0 });
  } else if (a.kind === 'bowtie') {
    const ny = (hy + headR * 0.95 + by - 30 * scale) / 2;
    const w = 14 * scale;
    const h = 8 * scale;
    const poly: Pt[] = [
      [hx - w, ny - h], [hx - 2 * scale, ny - 1 * scale], [hx - w, ny + h],
      [hx + w, ny + h], [hx + 2 * scale, ny - 1 * scale], [hx + w, ny - h],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.85, bleed: 1 });
    svg += handStroke(poly, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0 });
  } else if (a.kind === 'flower') {
    const fx = hx - headR * 0.85;
    const fy = hy - headR * 0.4;
    const petals = 5;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2;
      const px = fx + dCos(ang) * 5 * scale;
      const py = fy + dSin(ang) * 5 * scale;
      svg += `<circle cx="${fmt2(px)}" cy="${fmt2(py)}" r="${fmt2(3.5 * scale)}" fill="${a.color}" opacity="0.85" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
    }
    svg += `<circle cx="${fmt2(fx)}" cy="${fmt2(fy)}" r="${fmt2(2.5 * scale)}" fill="${c.bellyColor}"/>`;
  } else if (a.kind === 'hat') {
    const tx = hx;
    const ty = hy - headR * 0.92;
    const brimW = headR * 1.1;
    const brim: Pt[] = [
      [tx - brimW, ty + 2 * scale],
      [tx + brimW, ty + 2 * scale],
      [tx + brimW * 0.6, ty - 1 * scale],
      [tx - brimW * 0.6, ty - 1 * scale],
    ];
    svg += watercolorWash(brim, rng, { color: a.color, opacity: 0.85, bleed: 1 });
    svg += handStroke(brim, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.5, overshoot: 0 });
    const crownW = headR * 0.6;
    const crownH = headR * 0.7;
    const crown: Pt[] = [
      [tx - crownW * 0.5, ty - 1 * scale],
      [tx - crownW * 0.4, ty - crownH],
      [tx + crownW * 0.4, ty - crownH],
      [tx + crownW * 0.5, ty - 1 * scale],
    ];
    svg += watercolorWash(crown, rng, { color: a.color, opacity: 0.9, bleed: 1 });
    svg += handStroke(crown, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.5, overshoot: 0 });
  }
  return svg;
}
