/**
 * Rabbit renderer.
 *
 * Anatomy is intentionally simple and chunky — children's-book proportions:
 * big head, short body, oversized ears, big eyes. Every body part is a
 * watercolor-washed wobbly polygon outlined in soft sepia ink, then small
 * detail strokes for eyes/nose/mouth/cheeks.
 *
 * Coordinates are computed in a "character local" frame centered at the
 * character's feet, then translated into page space via Placement.
 */

import { Pt } from '../geometry';
import { handStroke, handCircle } from '../drawing';
import { Rng } from '../rng';
import { Character, Pose, Placement, characterRng } from '../character';
import { Palette } from '../palette';
import { watercolorWash, darken, lighten } from '../watercolor';
import { fmt2 } from '../math/det-format';
import { dSin, dCos } from '../math/det-math';
import { sargentCoupledColor } from '../../artmath/color/sargent-coupling';

export function drawRabbit(
  c: Character,
  pose: Pose,
  place: Placement,
  rng: Rng,
  palette: Palette,
): string {
  const r = characterRng(c, 'rabbit');
  const scale = c.scale * (place.scale ?? 1);
  const facingMul = pose.facing === 'left' ? -1 : pose.facing === 'right' ? 1 : 0;

  // Local origin is feet center. Y grows downward.
  const ox = place.x;
  const oy = place.y;

  // Body sizing
  const bodyH = 70 * scale;
  const bodyW = 56 * scale;
  const headR = 38 * scale;

  const bodyCx = ox;
  const bodyCy = oy - bodyH / 2 - (pose.legs === 'sit' ? -8 * scale : 14 * scale);
  const headCx = bodyCx + dSin(((pose.headTilt ?? 0) * Math.PI) / 180) * 8 * scale;
  const headCy = bodyCy - bodyH / 2 - headR * 0.55;

  let svg = '';

  // ----- Far ear (drawn first so near ear sits in front) -----
  svg += earSvg(c, pose, headCx, headCy, headR, scale, r, palette, /*near=*/ false);

  // ----- Body -----
  const bodyPoly = blob(
    bodyCx,
    bodyCy,
    bodyW * 0.5,
    bodyH * 0.5,
    18,
    r,
    /*irreg=*/ 0.07,
  );
  svg += watercolorWash(bodyPoly, r, { color: c.furColor, opacity: 0.55, bleed: 5 });
  // Sargent-coupled shadow wash on the lower-right side. Same body
  // polygon, slightly offset, with cool-shadow hue (α=0.7, ΔV=-0.18).
  const shadowOffsetX = bodyW * 0.12;
  const shadowOffsetY = bodyH * 0.12;
  const shadowColor = sargentCoupledColor(c.furColor, -0.18, 0.7);
  const shadowPoly = bodyPoly.map(
    ([x, y]) => [x + shadowOffsetX, y + shadowOffsetY] as Pt,
  );
  svg += watercolorWash(shadowPoly, r, { color: shadowColor, opacity: 0.35, bleed: 3, edge: 0.05 });

  // belly patch — slight oval, lighter color, on lower-front
  const bellyPoly = blob(
    bodyCx,
    bodyCy + bodyH * 0.18,
    bodyW * 0.32,
    bodyH * 0.3,
    14,
    r,
    0.06,
  );
  svg += watercolorWash(bellyPoly, r, {
    color: c.bellyColor,
    opacity: 0.7,
    bleed: 3,
    edge: 0.1,
  });
  svg += handStroke(bodyPoly, r, {
    color: palette.ink,
    width: 1.4,
    closed: true,
    overshoot: 0,
    wobble: 0.7,
  });

  // ----- Legs -----
  svg += legsSvg(c, pose, bodyCx, bodyCy + bodyH * 0.4, bodyW, scale, r, palette);

  // ----- Tail (small puff behind body, opposite of facing) -----
  const tailX = bodyCx - facingMul * bodyW * 0.42;
  const tailY = bodyCy + bodyH * 0.05;
  const tail = blob(tailX, tailY, 9 * scale, 9 * scale, 12, r, 0.15);
  svg += watercolorWash(tail, r, {
    color: lighten(c.bellyColor, 0.12),
    opacity: 0.75,
    bleed: 2,
    edge: 0.1,
  });
  svg += handStroke(tail, r, {
    color: palette.ink,
    width: 1.1,
    closed: true,
    overshoot: 0,
    wobble: 0.6,
  });

  // ----- Arms (drawn over body) -----
  svg += armsSvg(c, pose, bodyCx, bodyCy - bodyH * 0.05, bodyW, scale, r, palette);

  // ----- Head -----
  const headPoly = blob(headCx, headCy, headR, headR * 0.96, 22, r, 0.05);
  svg += watercolorWash(headPoly, r, {
    color: c.furColor,
    opacity: 0.55,
    bleed: 5,
  });
  // muzzle patch
  const muzzleY = headCy + headR * 0.25;
  const muzzlePoly = blob(headCx, muzzleY, headR * 0.55, headR * 0.42, 14, r, 0.06);
  svg += watercolorWash(muzzlePoly, r, {
    color: c.bellyColor,
    opacity: 0.75,
    bleed: 2,
    edge: 0.08,
  });
  svg += handStroke(headPoly, r, {
    color: palette.ink,
    width: 1.4,
    closed: true,
    overshoot: 0,
    wobble: 0.6,
  });

  // ----- Near ear (in front) -----
  svg += earSvg(c, pose, headCx, headCy, headR, scale, r, palette, /*near=*/ true);

  // ----- Face details -----
  svg += faceSvg(c, pose, headCx, headCy, headR, scale, r, palette);

  // ----- Accessory (drawn last so it sits on top) -----
  svg += accessorySvg(c, pose, headCx, headCy, bodyCx, bodyCy, bodyW, headR, scale, r, palette);

  return svg;
}

// ─── parts ───────────────────────────────────────────────────────────────────

function earSvg(
  c: Character,
  pose: Pose,
  hx: number,
  hy: number,
  headR: number,
  scale: number,
  rng: Rng,
  palette: Palette,
  near: boolean,
): string {
  // Two ears, one on each side of the head's top. "Near" is the one that
  // overlaps the head silhouette from the viewer's perspective; for forward-
  // facing rabbits both ears flank the head symmetrically.
  const tilt = ((c.featureTilt + (near ? 4 : -4)) * Math.PI) / 180;
  const baseTilt = pose.facing === 'left' ? -0.15 : pose.facing === 'right' ? 0.15 : 0;
  const sign = near ? 1 : -1;
  const earBaseX = hx + sign * headR * 0.42;
  const earBaseY = hy - headR * 0.8;
  const earH = 48 * scale;
  const earW = 16 * scale;
  const t = tilt + baseTilt + sign * 0.08;

  // Ear oriented along (sin t, -cos t)
  const dx = dSin(t);
  const dy = -dCos(t);
  const px = -dy;
  const py = dx;
  const tipX = earBaseX + dx * earH;
  const tipY = earBaseY + dy * earH;

  const poly: Pt[] = [
    [earBaseX - px * earW * 0.5, earBaseY - py * earW * 0.5],
    [tipX - px * earW * 0.25, tipY - py * earW * 0.25],
    [tipX + px * earW * 0.25, tipY + py * earW * 0.25],
    [earBaseX + px * earW * 0.5, earBaseY + py * earW * 0.5],
  ];
  // Densify the polygon side for a smoother silhouette via interpolation.
  const dense = densifyEar(poly);

  let svg = '';
  svg += watercolorWash(dense, rng, {
    color: c.furColor,
    opacity: 0.55,
    bleed: 3,
  });
  // Inner ear blush
  const innerPoly: Pt[] = [
    [earBaseX - px * earW * 0.25, earBaseY - py * earW * 0.25],
    [tipX - px * earW * 0.1, tipY - py * earW * 0.1],
    [tipX + px * earW * 0.1, tipY + py * earW * 0.1],
    [earBaseX + px * earW * 0.25, earBaseY + py * earW * 0.25],
  ];
  svg += watercolorWash(densifyEar(innerPoly), rng, {
    color: c.cheekColor,
    opacity: 0.55,
    bleed: 1,
    edge: 0.1,
  });
  svg += handStroke(dense, rng, {
    color: palette.ink,
    width: 1.2,
    closed: true,
    overshoot: 0,
    wobble: 0.6,
  });
  return svg;
}

function densifyEar(poly: Pt[]): Pt[] {
  // Add midpoints so wash + stroke read as smooth ovals, not diamonds.
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    out.push(a);
    out.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return out;
}

function legsSvg(
  c: Character,
  pose: Pose,
  cx: number,
  cy: number,
  bodyW: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  const legR = 11 * scale;
  let svg = '';
  if (pose.legs === 'sit') {
    // Two paws sticking out forward
    const ly = cy + 4 * scale;
    for (const sign of [-1, 1]) {
      const lx = cx + sign * bodyW * 0.18;
      const poly = blob(lx, ly, legR, legR * 0.85, 12, rng, 0.1);
      svg += watercolorWash(poly, rng, { color: c.bellyColor, opacity: 0.7, bleed: 2 });
      svg += handStroke(poly, rng, {
        color: palette.ink,
        width: 1.0,
        closed: true,
        wobble: 0.5,
        overshoot: 0,
      });
    }
  } else if (pose.legs === 'walk') {
    const ly = cy + 4 * scale;
    const offsets = [-bodyW * 0.18, bodyW * 0.18];
    for (let i = 0; i < 2; i++) {
      const lx = cx + offsets[i] + (i === 0 ? -3 : 3) * scale;
      const poly = blob(lx, ly + (i === 0 ? -2 : 2) * scale, legR, legR * 0.9, 12, rng, 0.1);
      svg += watercolorWash(poly, rng, { color: c.bellyColor, opacity: 0.7, bleed: 2 });
      svg += handStroke(poly, rng, {
        color: palette.ink,
        width: 1.0,
        closed: true,
        wobble: 0.5,
        overshoot: 0,
      });
    }
  } else {
    // Standing
    for (const sign of [-1, 1]) {
      const lx = cx + sign * bodyW * 0.22;
      const ly = cy + 6 * scale;
      const poly = blob(lx, ly, legR * 0.95, legR * 1.1, 12, rng, 0.08);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.55, bleed: 2 });
      svg += handStroke(poly, rng, {
        color: palette.ink,
        width: 1.1,
        closed: true,
        wobble: 0.5,
        overshoot: 0,
      });
    }
  }
  return svg;
}

function armsSvg(
  c: Character,
  pose: Pose,
  cx: number,
  cy: number,
  bodyW: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  let svg = '';
  const armR = 8 * scale;
  if (pose.arms === 'down') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.42;
      const ay = cy + 18 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.3, cy, ax, ay, armR, rng);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.55, bleed: 2 });
      svg += handStroke(poly, rng, {
        color: palette.ink,
        width: 1.1,
        closed: true,
        wobble: 0.5,
        overshoot: 0,
      });
    }
  } else if (pose.arms === 'wave') {
    // One arm up
    const sign = 1;
    const ax = cx + sign * bodyW * 0.55;
    const ay = cy - 22 * scale;
    const poly = ovalLine(cx + sign * bodyW * 0.3, cy, ax, ay, armR, rng);
    svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.55, bleed: 2 });
    svg += handStroke(poly, rng, {
      color: palette.ink,
      width: 1.1,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
    // Other arm down
    const ox = cx - sign * bodyW * 0.42;
    const oy = cy + 18 * scale;
    const poly2 = ovalLine(cx - sign * bodyW * 0.3, cy, ox, oy, armR, rng);
    svg += watercolorWash(poly2, rng, { color: c.furColor, opacity: 0.55, bleed: 2 });
    svg += handStroke(poly2, rng, {
      color: palette.ink,
      width: 1.1,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
  } else if (pose.arms === 'reach-up') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.35;
      const ay = cy - 28 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.3, cy, ax, ay, armR, rng);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.55, bleed: 2 });
      svg += handStroke(poly, rng, {
        color: palette.ink,
        width: 1.1,
        closed: true,
        wobble: 0.5,
        overshoot: 0,
      });
    }
  } else if (pose.arms === 'hold-front' || pose.arms === 'hugging') {
    for (const sign of [-1, 1]) {
      const ax = cx + sign * bodyW * 0.18;
      const ay = cy + 14 * scale;
      const poly = ovalLine(cx + sign * bodyW * 0.32, cy, ax, ay, armR, rng);
      svg += watercolorWash(poly, rng, { color: c.furColor, opacity: 0.55, bleed: 2 });
      svg += handStroke(poly, rng, {
        color: palette.ink,
        width: 1.1,
        closed: true,
        wobble: 0.5,
        overshoot: 0,
      });
    }
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
  const eyeY = hy - headR * 0.05;
  const eyeDx = headR * 0.32;
  const eyeR = 3.2 * scale;
  // Eyes
  for (const sign of [-1, 1]) {
    const ex = hx + sign * eyeDx;
    if (pose.eyes === 'closed' || (pose.eyes === 'wink-left' && sign === -1) || (pose.eyes === 'wink-right' && sign === 1)) {
      // Curved closed eye
      svg += `<path d="M${fmt2(ex - eyeR * 1.4)} ${fmt2(eyeY)} Q${fmt2(ex)} ${fmt2(eyeY + eyeR * 1.2)} ${fmt2(ex + eyeR * 1.4)} ${fmt2(eyeY)}" fill="none" stroke="${palette.ink}" stroke-width="${fmt2(1.4 * scale)}" stroke-linecap="round"/>`;
    } else {
      const r = pose.eyes === 'wide' ? eyeR * 1.3 : eyeR;
      svg += `<circle cx="${fmt2(ex)}" cy="${fmt2(eyeY)}" r="${fmt2(r)}" fill="${palette.ink}"/>`;
      if (c.eyeStyle === 'dot-shine') {
        svg += `<circle cx="${fmt2(ex + r * 0.35)}" cy="${fmt2(eyeY - r * 0.4)}" r="${fmt2(r * 0.32)}" fill="#ffffff" opacity="0.95"/>`;
      }
    }
  }

  // Cheeks (soft pink)
  for (const sign of [-1, 1]) {
    const cxC = hx + sign * headR * 0.42;
    const cyC = hy + headR * 0.18;
    svg += `<ellipse cx="${fmt2(cxC)}" cy="${fmt2(cyC)}" rx="${fmt2(
      6.5 * scale
    )}" ry="${fmt2(4.5 * scale)}" fill="${
      c.cheekColor
    }" opacity="0.55"/>`;
  }

  // Nose (small upside-down triangle / Y)
  const noseY = hy + headR * 0.18;
  const noseR = 3.5 * scale;
  svg += `<path d="M${fmt2(hx - noseR)} ${fmt2(noseY)} L${fmt2(hx + noseR)} ${fmt2(noseY)} L${fmt2(hx)} ${fmt2(
    noseY +
    noseR * 0.9
  )} Z" fill="${c.noseColor}" opacity="0.95" stroke="${
    palette.ink
  }" stroke-width="${fmt2(0.6 * scale)}" stroke-linejoin="round"/>`;

  // Mouth (a soft Y or curve)
  const mouthY = noseY + noseR * 0.9;
  const w = 5 * scale;
  if (pose.mouth === 'smile' || pose.mouth === 'small') {
    const dy = pose.mouth === 'smile' ? 3 * scale : 1.2 * scale;
    svg += `<path d="M${fmt2(hx)} ${fmt2(mouthY)} L${fmt2(hx)} ${fmt2(
      mouthY +
      2 * scale
    )} M${fmt2(hx - w)} ${fmt2(mouthY + 2 * scale)} Q${fmt2(hx)} ${fmt2(mouthY + 2 * scale + dy)} ${fmt2(
      hx + w
    )} ${fmt2(mouthY + 2 * scale)}" fill="none" stroke="${
      palette.ink
    }" stroke-width="${fmt2(1.0 * scale)}" stroke-linecap="round"/>`;
  } else if (pose.mouth === 'open-o') {
    svg += `<ellipse cx="${fmt2(hx)}" cy="${fmt2(mouthY + 3 * scale)}" rx="${fmt2(2.5 * scale)}" ry="${fmt2(3 * scale)}" fill="${darken(c.cheekColor, 0.2)}" stroke="${palette.ink}" stroke-width="${fmt2(
      0.8 * scale
    )}"/>`;
  } else if (pose.mouth === 'frown') {
    svg += `<path d="M${fmt2(hx - w)} ${fmt2(mouthY + 5 * scale)} Q${fmt2(hx)} ${fmt2(mouthY + 2 * scale)} ${fmt2(
      hx + w
    )} ${fmt2(mouthY + 5 * scale)}" fill="none" stroke="${
      palette.ink
    }" stroke-width="${fmt2(1.0 * scale)}" stroke-linecap="round"/>`;
  }

  // A few whisker hints
  const wcount = 2;
  for (let i = 0; i < wcount; i++) {
    for (const sign of [-1, 1]) {
      const wx0 = hx + sign * headR * 0.3;
      const wy0 = noseY + 1 * scale + i * 1.6 * scale;
      const wx1 = wx0 + sign * (10 + i * 2) * scale;
      const wy1 = wy0 + (i - 0.5) * 1.6 * scale;
      svg += handStroke([[wx0, wy0], [wx1, wy1]], rng, {
        color: palette.inkSoft,
        width: 0.5 * scale,
        opacity: 0.7,
        wobble: 0.4,
        passes: 1,
        overshoot: 0,
      });
    }
  }

  return svg;
}

function accessorySvg(
  c: Character,
  pose: Pose,
  hx: number,
  hy: number,
  bx: number,
  by: number,
  bodyW: number,
  headR: number,
  scale: number,
  rng: Rng,
  palette: Palette,
): string {
  const a = c.accessory;
  if (a.kind === 'none') return '';
  let svg = '';
  if (a.kind === 'scarf') {
    // a wavy band around the neck (between head and body)
    const ny = (hy + headR * 0.85 + by - 30 * scale) / 2;
    const w = bodyW * 0.55;
    const poly: Pt[] = [
      [hx - w, ny - 4 * scale],
      [hx - w * 0.4, ny - 6 * scale],
      [hx + w * 0.4, ny - 6 * scale],
      [hx + w, ny - 4 * scale],
      [hx + w, ny + 6 * scale],
      [hx + w * 0.4, ny + 8 * scale],
      [hx - w * 0.4, ny + 8 * scale],
      [hx - w, ny + 6 * scale],
    ];
    svg += watercolorWash(poly, rng, { color: a.color, opacity: 0.7, bleed: 2 });
    svg += handStroke(poly, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
    // Trailing tail of scarf
    const tx = hx + w * 0.85;
    const tail: Pt[] = [
      [tx, ny + 6 * scale],
      [tx + 4 * scale, ny + 14 * scale],
      [tx + 1 * scale, ny + 22 * scale],
      [tx - 6 * scale, ny + 16 * scale],
      [tx - 6 * scale, ny + 8 * scale],
    ];
    svg += watercolorWash(tail, rng, { color: a.color, opacity: 0.7, bleed: 2 });
    svg += handStroke(tail, rng, {
      color: palette.ink,
      width: 1.0,
      closed: true,
      wobble: 0.5,
      overshoot: 0,
    });
  } else if (a.kind === 'flower') {
    // tucked behind near ear
    const fx = hx - headR * 0.7;
    const fy = hy - headR * 0.6;
    const petals = 5;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2;
      const px = fx + dCos(ang) * 6 * scale;
      const py = fy + dSin(ang) * 6 * scale;
      const { svg: p } = handCircle(px, py, 4 * scale, rng, {
        color: palette.ink,
        width: 0.9,
        wobble: 0.5,
      });
      svg += `<circle cx="${fmt2(px)}" cy="${fmt2(py)}" r="${fmt2(
        4 * scale
      )}" fill="${a.color}" opacity="0.85"/>${p}`;
    }
    svg += `<circle cx="${fmt2(fx)}" cy="${fmt2(fy)}" r="${fmt2(
      3 * scale
    )}" fill="${c.bellyColor}"/>`;
  } else if (a.kind === 'bowtie') {
    const ny = (hy + headR * 0.85 + by - 30 * scale) / 2;
    const w = 12 * scale;
    const h = 7 * scale;
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
  } else if (a.kind === 'hat') {
    const tx = hx;
    const ty = hy - headR * 0.92;
    const brimW = headR * 1.2;
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
    const crownW = headR * 0.7;
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
  }
  return svg;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Closed irregular oval blob centered at (cx,cy) with radii (rx,ry). */
function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  rng: Rng,
  irreg: number,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const m = 1 + (rng() - 0.5) * 2 * irreg;
    pts.push([cx + dCos(a) * rx * m, cy + dSin(a) * ry * m]);
  }
  return pts;
}

/** A capsule polygon between two points. */
function ovalLine(x1: number, y1: number, x2: number, y2: number, r: number, rng: Rng): Pt[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const seg = 8;
  const pts: Pt[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const x = x1 + ux * len * t;
    const y = y1 + uy * len * t;
    const wob = (rng() - 0.5) * 0.4;
    pts.push([x + px * (r + wob), y + py * (r + wob)]);
  }
  for (let i = seg; i >= 0; i--) {
    const t = i / seg;
    const x = x1 + ux * len * t;
    const y = y1 + uy * len * t;
    const wob = (rng() - 0.5) * 0.4;
    pts.push([x - px * (r + wob), y - py * (r + wob)]);
  }
  return pts;
}
