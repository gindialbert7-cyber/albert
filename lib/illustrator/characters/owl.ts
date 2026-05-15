/**
 * Owl renderer.
 *
 * Children's-book owl: round body, large head (head ~75% of body
 * width), two enormous side-set eyes with concentric ring rendering,
 * small triangular beak, two ear tufts (parametric — tilt + length),
 * wings as side-attached leaf-shaped flaps.
 *
 * Same parametric anatomy → byte-identical owl across pages.
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

export function drawOwl(
  c: Character,
  pose: Pose,
  place: Placement,
  rng: Rng,
  palette: Palette,
): string {
  const r = characterRng(c, 'owl');
  const scale = c.scale * (place.scale ?? 1);

  // Local origin is feet center. Y grows downward.
  const ox = place.x;
  const oy = place.y;

  // Body sizing — owl is rounder/shorter than rabbit
  const bodyH = 80 * scale;
  const bodyW = 64 * scale;
  const headR = 38 * scale; // slightly smaller than body width

  const bodyCx = ox;
  const bodyCy = oy - bodyH / 2 - 8 * scale;
  const headCx = bodyCx + dSin(((pose.headTilt ?? 0) * Math.PI) / 180) * 6 * scale;
  const headCy = bodyCy - bodyH / 2 - headR * 0.55;

  let svg = '';

  // ── Wings (drawn behind body) ────────────────────────────────────
  svg += wingsSvg(c, pose, bodyCx, bodyCy, bodyW, bodyH, scale, r, palette);

  // ── Body — egg-shaped (taller bottom, narrower top) ──────────────
  const bodyPoly = eggPoly(bodyCx, bodyCy, bodyW * 0.5, bodyH * 0.5, 22, r, 0.06);
  svg += watercolorWash(bodyPoly, r, { color: c.furColor, opacity: 0.6, bleed: 5 });
  // Belly patch — lighter, central
  const bellyPoly = ovalPoly(
    bodyCx,
    bodyCy + bodyH * 0.12,
    bodyW * 0.32,
    bodyH * 0.32,
    14,
    r,
    0.06,
  );
  svg += watercolorWash(bellyPoly, r, {
    color: c.bellyColor,
    opacity: 0.78,
    bleed: 3,
    edge: 0.08,
  });
  // Feather rows on belly (a few short curved strokes)
  for (let row = 0; row < 3; row++) {
    const ry = bodyCy + bodyH * (0.02 + row * 0.1);
    for (let i = 0; i < 4; i++) {
      const fx = bodyCx + (i - 1.5) * (bodyW * 0.13);
      svg += `<path d="M${fmt2(fx - 4 * scale)} ${fmt2(ry)} Q${fmt2(fx)} ${fmt2(ry + 4 * scale)} ${fmt2(fx + 4 * scale)} ${fmt2(ry)}" stroke="${darken(c.bellyColor, 0.15)}" stroke-width="${fmt2(0.6 * scale)}" fill="none" opacity="0.55"/>`;
    }
  }
  svg += handStroke(bodyPoly, r, {
    color: palette.ink,
    width: 1.3,
    closed: true,
    overshoot: 0,
    wobble: 0.6,
  });

  // ── Feet (drawn under body, talons) ──────────────────────────────
  svg += talonsSvg(bodyCx, bodyCy + bodyH * 0.5, bodyW, scale, palette);

  // ── Head ─────────────────────────────────────────────────────────
  const headPoly = ovalPoly(headCx, headCy, headR, headR * 0.95, 22, r, 0.05);
  svg += watercolorWash(headPoly, r, { color: c.furColor, opacity: 0.6, bleed: 5 });
  svg += handStroke(headPoly, r, {
    color: palette.ink,
    width: 1.3,
    closed: true,
    overshoot: 0,
    wobble: 0.6,
  });

  // ── Ear tufts (top of head, two angled triangles) ────────────────
  svg += earTuftsSvg(c, headCx, headCy, headR, scale, r, palette);

  // ── Face details: eyes + beak + cheek puffs ──────────────────────
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

function eggPoly(cx: number, cy: number, rx: number, ry: number, n: number, rng: Rng, irreg: number): Pt[] {
  // Egg = narrower top, wider bottom.
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const taper = 1 + 0.18 * dSin(a + Math.PI / 2); // wider at bottom
    const m = (1 + (rng() - 0.5) * 2 * irreg) * taper;
    pts.push([cx + dCos(a) * rx * m, cy + dSin(a) * ry * m]);
  }
  return pts;
}

function wingsSvg(
  c: Character,
  _pose: Pose,
  bx: number,
  by: number,
  bodyW: number,
  bodyH: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  let svg = '';
  for (const sign of [-1, 1]) {
    const wingTipX = bx + sign * bodyW * 0.62;
    const wingTipY = by + bodyH * 0.05;
    const baseX = bx + sign * bodyW * 0.32;
    const baseY = by - bodyH * 0.22;
    // Leaf-shaped wing
    const wing: Pt[] = [
      [baseX, baseY],
      [baseX + sign * bodyW * 0.18, baseY + bodyH * 0.05],
      [wingTipX, wingTipY],
      [baseX + sign * bodyW * 0.12, by + bodyH * 0.18],
      [bx + sign * bodyW * 0.1, by + bodyH * 0.05],
    ];
    svg += watercolorWash(wing, rng, {
      color: darken(c.furColor, 0.08),
      opacity: 0.65,
      bleed: 2,
    });
    svg += handStroke(wing, rng, {
      color: palette.ink,
      width: 1.1,
      closed: true,
      overshoot: 0,
      wobble: 0.5,
    });
  }
  return svg;
}

function talonsSvg(cx: number, cy: number, bodyW: number, scale: number, palette: Palette): string {
  let svg = '';
  for (const sign of [-1, 1]) {
    const fx = cx + sign * bodyW * 0.14;
    const fy = cy;
    // Three small talons
    for (let i = -1; i <= 1; i++) {
      const tx = fx + i * 2.5 * scale;
      svg += `<path d="M${fmt2(tx)} ${fmt2(fy)} L${fmt2(tx + i * 1.2 * scale)} ${fmt2(fy + 4 * scale)}" stroke="${darken(palette.cottageDoor || palette.ink, 0.1)}" stroke-width="${fmt2(1.4 * scale)}" stroke-linecap="round"/>`;
    }
  }
  return svg;
}

function earTuftsSvg(
  c: Character,
  hx: number,
  hy: number,
  headR: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  let svg = '';
  const tiltDeg = c.featureTilt;
  for (const sign of [-1, 1]) {
    const baseX = hx + sign * headR * 0.55;
    const baseY = hy - headR * 0.75;
    const tipX = baseX + sign * 4 * scale + dSin((tiltDeg * Math.PI) / 180) * 3 * scale;
    const tipY = baseY - 18 * scale;
    const tuft: Pt[] = [
      [baseX - 4 * scale, baseY + 2 * scale],
      [tipX, tipY],
      [baseX + 4 * scale, baseY + 2 * scale],
    ];
    svg += watercolorWash(tuft, rng, { color: c.furColor, opacity: 0.6, bleed: 1.5 });
    svg += handStroke(tuft, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      overshoot: 0,
      wobble: 0.5,
      passes: 1,
    });
  }
  return svg;
}

function faceSvg(
  c: Character,
  pose: Pose,
  hx: number,
  hy: number,
  headR: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  let svg = '';
  // Large eye discs (signature owl feature)
  const eyeY = hy - headR * 0.05;
  const eyeDx = headR * 0.4;
  const discR = headR * 0.4;
  for (const sign of [-1, 1]) {
    const ex = hx + sign * eyeDx;
    // Outer ring (lighter color, slightly bigger)
    svg += `<circle cx="${fmt2(ex)}" cy="${fmt2(eyeY)}" r="${fmt2(discR)}" fill="${lighten(c.bellyColor, 0.15)}" stroke="${palette.ink}" stroke-width="${fmt2(1.0 * scale)}" opacity="0.95"/>`;
    // Iris
    const irisR = discR * 0.55;
    svg += `<circle cx="${fmt2(ex)}" cy="${fmt2(eyeY)}" r="${fmt2(irisR)}" fill="${darken(c.noseColor, 0.05)}" opacity="0.92"/>`;
    // Pupil
    const pupilR = irisR * 0.5;
    if (pose.eyes === 'closed' || (pose.eyes === 'wink-left' && sign === -1) || (pose.eyes === 'wink-right' && sign === 1)) {
      // Closed eye — curve
      svg += `<path d="M${fmt2(ex - discR)} ${fmt2(eyeY)} Q${fmt2(ex)} ${fmt2(eyeY + discR * 0.3)} ${fmt2(ex + discR)} ${fmt2(eyeY)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(1.4 * scale)}" stroke-linecap="round"/>`;
    } else {
      svg += `<circle cx="${fmt2(ex)}" cy="${fmt2(eyeY)}" r="${fmt2(pupilR)}" fill="${palette.ink}"/>`;
      // Highlight
      svg += `<circle cx="${fmt2(ex + pupilR * 0.3)}" cy="${fmt2(eyeY - pupilR * 0.4)}" r="${fmt2(pupilR * 0.35)}" fill="#ffffff" opacity="0.92"/>`;
    }
  }

  // Beak (small triangle between eyes)
  const beakY = eyeY + discR * 0.6;
  const beakSize = 4.5 * scale;
  svg += `<path d="M${fmt2(hx - beakSize * 0.5)} ${fmt2(beakY)} L${fmt2(hx + beakSize * 0.5)} ${fmt2(beakY)} L${fmt2(hx)} ${fmt2(beakY + beakSize * 1.2)} Z" fill="${darken(c.noseColor, 0.05)}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}" stroke-linejoin="round"/>`;

  // Tiny cheek blush
  for (const sign of [-1, 1]) {
    const cxC = hx + sign * headR * 0.55;
    const cyC = beakY + 2 * scale;
    svg += `<ellipse cx="${fmt2(cxC)}" cy="${fmt2(cyC)}" rx="${fmt2(4 * scale)}" ry="${fmt2(2.5 * scale)}" fill="${c.cheekColor}" opacity="0.5"/>`;
  }

  // Whisker-like feather strokes around beak
  for (let i = 0; i < 3; i++) {
    for (const sign of [-1, 1]) {
      const wx0 = hx + sign * (headR * 0.18 + i * 1.5);
      const wy0 = beakY + beakSize * 0.7 + i * 1.5 * scale;
      const wx1 = wx0 + sign * (5 + i) * scale;
      const wy1 = wy0 + (i - 0.5) * 1.5 * scale;
      svg += handStroke([[wx0, wy0], [wx1, wy1]], rng, {
        color: palette.inkSoft,
        width: 0.4 * scale,
        opacity: 0.5,
        wobble: 0.3,
        passes: 1,
        overshoot: 0,
      });
    }
  }

  return svg;
}

function accessorySvg(
  c: Character,
  _pose: Pose,
  hx: number,
  hy: number,
  _bx: number,
  _by: number,
  _bodyW: number,
  headR: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  const a = c.accessory;
  if (a.kind === 'none') return '';
  let svg = '';
  if (a.kind === 'hat') {
    const tx = hx;
    const ty = hy - headR * 0.92;
    const brimW = headR * 1.0;
    const brim: Pt[] = [
      [tx - brimW, ty + 2 * scale],
      [tx + brimW, ty + 2 * scale],
      [tx + brimW * 0.6, ty - 1 * scale],
      [tx - brimW * 0.6, ty - 1 * scale],
    ];
    svg += watercolorWash(brim, rng, { color: a.color, opacity: 0.85, bleed: 1 });
    svg += handStroke(brim, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
    const crownW = headR * 0.6;
    const crownH = headR * 0.7;
    const crown: Pt[] = [
      [tx - crownW * 0.5, ty - 1 * scale],
      [tx - crownW * 0.4, ty - crownH],
      [tx + crownW * 0.4, ty - crownH],
      [tx + crownW * 0.5, ty - 1 * scale],
    ];
    svg += watercolorWash(crown, rng, { color: a.color, opacity: 0.9, bleed: 1 });
    svg += handStroke(crown, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
  } else if (a.kind === 'scarf') {
    // Simple band around the lower head/upper body
    const ny = hy + headR * 0.85;
    const w = headR * 1.1;
    const poly: Pt[] = [
      [hx - w, ny - 4 * scale],
      [hx + w, ny - 4 * scale],
      [hx + w, ny + 8 * scale],
      [hx - w, ny + 8 * scale],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.7, bleed: 2 });
    svg += handStroke(poly, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
  } else if (a.kind === 'bowtie') {
    const ny = hy + headR * 0.85;
    const w = 14 * scale;
    const h = 8 * scale;
    const poly: Pt[] = [
      [hx - w, ny - h],
      [hx - 2 * scale, ny - 1 * scale],
      [hx - w, ny + h],
      [hx + w, ny + h],
      [hx + 2 * scale, ny - 1 * scale],
      [hx + w, ny - h],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.85, bleed: 1 });
    svg += handStroke(poly, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      wobble: 0.4,
      overshoot: 0,
    });
  } else if (a.kind === 'flower') {
    // Tucked above eye
    const fx = hx - headR * 0.7;
    const fy = hy - headR * 0.4;
    const petals = 5;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2;
      const px = fx + dCos(ang) * 5 * scale;
      const py = fy + dSin(ang) * 5 * scale;
      svg += `<circle cx="${fmt2(px)}" cy="${fmt2(py)}" r="${fmt2(3.5 * scale)}" fill="${a.color}" opacity="0.85" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
    }
    svg += `<circle cx="${fmt2(fx)}" cy="${fmt2(fy)}" r="${fmt2(2.5 * scale)}" fill="${c.bellyColor}"/>`;
  }
  return svg;
}
