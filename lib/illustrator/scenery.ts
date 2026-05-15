/**
 * Backdrops & props.
 *
 * Backdrops paint the world: sky gradient, distant hills, near grass, paper
 * texture overlay. Props are stand-alone objects (mushroom, tree, moon,
 * flower) that are placed on the page alongside characters.
 */

import { Pt } from './geometry';
import { handStroke, hatchFill } from './drawing';
import { Rng, mulberry32, range, makeNoise2D, hashString } from './rng';
import { Palette, pickFlowerColor } from './palette';
import { watercolorWash, lighten, darken } from './watercolor';
import { fmt1, fmt2 } from './math/det-format';
import { dSin, dCos } from './math/det-math';

export type Canvas = { width: number; height: number };

export type BackdropKind =
  | 'meadow'
  | 'meadow-sunset'
  | 'night-sky'
  | 'forest-clearing'
  | 'burrow-interior'
  | 'pond';

// ─── paper texture ───────────────────────────────────────────────────────────

export function paperBackground(canvas: Canvas, palette: Palette, seed: number): string {
  const rng = mulberry32(seed ^ 0xa17ec);
  let svg = `<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="${palette.paper}"/>`;
  // sparse fiber flecks
  const flecks = Math.floor((canvas.width * canvas.height) / 9000);
  for (let i = 0; i < flecks; i++) {
    const x = rng() * canvas.width;
    const y = rng() * canvas.height;
    const r = range(rng, 0.3, 1.1);
    const op = range(rng, 0.04, 0.12);
    const c = rng() < 0.5 ? '#a89a82' : '#cdbfa5';
    svg += `<circle cx="${fmt1(x)}" cy="${fmt1(y)}" r="${fmt2(r)}" fill="${c}" opacity="${fmt2(op)}"/>`;
  }
  // a few faint smudges
  for (let i = 0; i < 6; i++) {
    const x = rng() * canvas.width;
    const y = rng() * canvas.height;
    const r = range(rng, 30, 90);
    svg += `<circle cx="${fmt1(x)}" cy="${fmt1(y)}" r="${fmt2(r)}" fill="#d8c8a8" opacity="0.04"/>`;
  }
  return svg;
}

export function paperVignette(canvas: Canvas, palette: Palette, seed: number): string {
  const id = `vig-${(seed >>> 0).toString(36)}`;
  return `
<defs>
  <radialGradient id="${id}" cx="50%" cy="50%" r="75%">
    <stop offset="60%" stop-color="${palette.paper}" stop-opacity="0"/>
    <stop offset="100%" stop-color="#3b2f24" stop-opacity="0.18"/>
  </radialGradient>
</defs>
<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="url(#${id})"/>`;
}

// ─── sky / horizon ───────────────────────────────────────────────────────────

function skyWash(canvas: Canvas, palette: Palette, rng: Rng, horizonY: number): string {
  // Two-color soft gradient + a couple of watercolor wash bands for depth.
  const id = `sky-${Math.floor(rng() * 1e6)}`;
  let svg = `
<defs>
  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${palette.sky[0]}"/>
    <stop offset="100%" stop-color="${palette.sky[1]}"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="${canvas.width}" height="${horizonY}" fill="url(#${id})" opacity="0.85"/>`;
  // streaks
  for (let i = 0; i < 3; i++) {
    const y = range(rng, horizonY * 0.15, horizonY * 0.85);
    const h = range(rng, 18, 38);
    const poly: Pt[] = [];
    const segs = 12;
    for (let s = 0; s <= segs; s++) {
      const x = (s / segs) * canvas.width;
      const yo = y + dSin(s * 0.6 + i) * 4;
      poly.push([x, yo]);
    }
    for (let s = segs; s >= 0; s--) {
      const x = (s / segs) * canvas.width;
      const yo = y + h + dSin(s * 0.4 + i + 2) * 4;
      poly.push([x, yo]);
    }
    svg += watercolorWash(poly, rng, {
      color: lighten(palette.sky[0], 0.3),
      opacity: 0.18,
      bleed: 8,
      edge: 0.05,
    });
  }
  return svg;
}

// ─── ground / hills ──────────────────────────────────────────────────────────

function silhouette(
  canvas: Canvas,
  baseY: number,
  amp: number,
  segs: number,
  noiseSeed: number,
  freq: number,
): Pt[] {
  const noise = makeNoise2D(noiseSeed);
  const pts: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const x = (i / segs) * canvas.width;
    const y = baseY - amp * (0.5 + 0.5 * (noise(i * freq, 1) - 0.5) * 2);
    pts.push([x, y]);
  }
  return pts;
}

function hillBand(
  canvas: Canvas,
  baseY: number,
  amp: number,
  fillColor: string,
  shadowColor: string,
  rng: Rng,
  palette: Palette,
  noiseSeed: number,
  freq = 0.4,
): string {
  const top = silhouette(canvas, baseY, amp, 28, noiseSeed, freq);
  const poly: Pt[] = [...top, [canvas.width + 10, canvas.height + 10], [-10, canvas.height + 10]];
  let svg = '';
  svg += watercolorWash(poly, rng, { color: fillColor, opacity: 0.7, bleed: 4, edge: 0.1 });
  // shadow strip just under the silhouette
  const shadow: Pt[] = top.map(([x, y]) => [x, y + 14]);
  const shadowPoly: Pt[] = [...top, ...shadow.reverse()];
  svg += hatchFill(shadowPoly, rng, {
    color: shadowColor,
    angle: 30,
    spacing: 4,
    opacity: 0.25,
    width: 0.5,
    skipChance: 0.25,
  });
  svg += handStroke(top, rng, {
    color: palette.ink,
    width: 1.0,
    wobble: 1.0,
    overshoot: 0,
    passes: 1,
    opacity: 0.65,
  });
  return svg;
}

// ─── props ───────────────────────────────────────────────────────────────────

export function sun(
  cx: number,
  cy: number,
  r: number,
  rng: Rng,
  palette: Palette,
  rays = true,
): string {
  let svg = '';
  // glow
  const glow = circlePoly(cx, cy, r * 1.6, 24, rng, 0.04);
  svg += watercolorWash(glow, rng, {
    color: palette.sunGlow,
    opacity: 0.5,
    bleed: 12,
    edge: 0.03,
  });
  const disk = circlePoly(cx, cy, r, 22, rng, 0.06);
  svg += watercolorWash(disk, rng, { color: palette.sun, opacity: 0.85, bleed: 4 });
  svg += handStroke(disk, rng, {
    color: palette.ink,
    width: 1.0,
    closed: true,
    wobble: 0.5,
    overshoot: 0,
  });
  if (rays) {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.15;
      const x1 = cx + dCos(a) * r * 1.2;
      const y1 = cy + dSin(a) * r * 1.2;
      const x2 = cx + dCos(a) * r * 1.7;
      const y2 = cy + dSin(a) * r * 1.7;
      svg += handStroke([[x1, y1], [x2, y2]], rng, {
        color: palette.sun,
        width: 1.6,
        wobble: 0.6,
        overshoot: 1,
        opacity: 0.85,
        passes: 1,
      });
    }
  }
  return svg;
}

export function moon(cx: number, cy: number, r: number, rng: Rng, palette: Palette): string {
  let svg = '';
  // glow
  const glow = circlePoly(cx, cy, r * 1.6, 24, rng, 0.04);
  svg += watercolorWash(glow, rng, {
    color: palette.sunGlow,
    opacity: 0.35,
    bleed: 14,
    edge: 0.03,
  });
  const disk = circlePoly(cx, cy, r, 24, rng, 0.04);
  svg += watercolorWash(disk, rng, { color: palette.moon, opacity: 0.95, bleed: 3 });
  svg += handStroke(disk, rng, {
    color: palette.ink,
    width: 1.0,
    closed: true,
    wobble: 0.4,
    overshoot: 0,
    opacity: 0.7,
  });
  // soft craters
  for (let i = 0; i < 3; i++) {
    const ang = rng() * Math.PI * 2;
    const dist = rng() * r * 0.5;
    const cxC = cx + dCos(ang) * dist;
    const cyC = cy + dSin(ang) * dist;
    const cr = range(rng, r * 0.06, r * 0.12);
    svg += `<circle cx="${fmt2(cxC)}" cy="${fmt2(cyC)}" r="${fmt2(cr)}" fill="${darken(palette.moon, 0.1)}" opacity="0.45"/>`;
  }
  return svg;
}

export function stars(canvas: Canvas, count: number, rng: Rng, palette: Palette, maxY: number): string {
  let svg = '';
  for (let i = 0; i < count; i++) {
    const x = rng() * canvas.width;
    const y = rng() * maxY;
    const s = range(rng, 1.2, 2.6);
    // four-pointed star = two crossed lines
    svg += `<path d="M${fmt2(x - s)} ${fmt2(y)} L${fmt2(x + s)} ${fmt2(y)} M${fmt2(x)} ${fmt2(y - s)} L${fmt2(x)} ${fmt2(
      y + s
    )}" stroke="${palette.star}" stroke-width="0.9" stroke-linecap="round" opacity="0.9"/>`;
    if (rng() < 0.3) {
      svg += `<circle cx="${fmt2(x)}" cy="${fmt2(y)}" r="0.6" fill="${palette.star}" opacity="0.9"/>`;
    }
  }
  return svg;
}

export function cloud(cx: number, cy: number, w: number, rng: Rng, palette: Palette): string {
  const lobes = 4;
  const pts: Pt[] = [];
  for (let i = 0; i <= lobes; i++) {
    const t = i / lobes;
    const x = cx - w * 0.5 + t * w;
    const y = cy + dSin(t * Math.PI) * -w * 0.18 + (rng() - 0.5) * 4;
    pts.push([x, y]);
  }
  // bottom
  for (let i = lobes; i >= 0; i--) {
    const t = i / lobes;
    const x = cx - w * 0.5 + t * w;
    const y = cy + 6 + (rng() - 0.5) * 2;
    pts.push([x, y]);
  }
  let svg = '';
  svg += watercolorWash(pts, rng, { color: palette.cloud, opacity: 0.85, bleed: 3, edge: 0.08 });
  svg += handStroke(pts, rng, {
    color: palette.inkSoft,
    width: 0.9,
    closed: true,
    wobble: 0.7,
    overshoot: 0,
    opacity: 0.55,
  });
  return svg;
}

export function tree(cx: number, baseY: number, h: number, rng: Rng, palette: Palette): string {
  let svg = '';
  // trunk
  const trunkW = h * 0.08;
  const trunkPts: Pt[] = [
    [cx - trunkW, baseY],
    [cx - trunkW * 0.7, baseY - h * 0.4],
    [cx + trunkW * 0.7, baseY - h * 0.4],
    [cx + trunkW, baseY],
  ];
  svg += watercolorWash(trunkPts, rng, { color: palette.trunk, opacity: 0.7, bleed: 2 });
  svg += handStroke(trunkPts, rng, {
    color: palette.ink,
    width: 1.1,
    closed: true,
    wobble: 0.6,
    overshoot: 0,
  });
  // crown — one large round blob with a couple of bumps
  const crownCy = baseY - h * 0.6;
  const crownR = h * 0.34;
  const lobes = 9;
  const crown: Pt[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const m = 1 + (rng() - 0.5) * 0.18;
    crown.push([cx + dCos(a) * crownR * m, crownCy + dSin(a) * crownR * m * 0.95]);
  }
  svg += watercolorWash(crown, rng, { color: palette.leaf, opacity: 0.7, bleed: 4 });
  // shading on lower-right
  svg += hatchFill(crown, rng, {
    color: palette.leafShadow,
    angle: 50,
    spacing: 6,
    opacity: 0.18,
    width: 0.5,
    skipChance: 0.4,
  });
  svg += handStroke(crown, rng, {
    color: palette.ink,
    width: 1.2,
    closed: true,
    wobble: 0.8,
    overshoot: 0,
  });
  return svg;
}

export function mushroom(
  cx: number,
  baseY: number,
  scale: number,
  rng: Rng,
  palette: Palette,
  capColor = '#c84a5a',
  glow = false,
): string {
  let svg = '';
  const stemW = 7 * scale;
  const stemH = 16 * scale;
  // stem
  const stem: Pt[] = [
    [cx - stemW * 0.5, baseY],
    [cx - stemW * 0.7, baseY - stemH],
    [cx + stemW * 0.7, baseY - stemH],
    [cx + stemW * 0.5, baseY],
  ];
  svg += watercolorWash(stem, rng, { color: '#f3e5c1', opacity: 0.8, bleed: 1 });
  svg += handStroke(stem, rng, {
    color: palette.ink,
    width: 0.9,
    closed: true,
    wobble: 0.4,
    overshoot: 0,
  });
  // cap (half oval)
  const capCy = baseY - stemH;
  const capR = 14 * scale;
  const capPts: Pt[] = [];
  const seg = 16;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const a = Math.PI + t * Math.PI;
    capPts.push([cx + dCos(a) * capR, capCy + dSin(a) * capR * 0.7]);
  }
  capPts.push([cx + capR, capCy + 2 * scale]);
  capPts.push([cx - capR, capCy + 2 * scale]);
  if (glow) {
    const glowPts = circlePoly(cx, capCy - 2 * scale, capR * 1.6, 24, rng, 0.05);
    svg += watercolorWash(glowPts, rng, {
      color: lighten(capColor, 0.4),
      opacity: 0.45,
      bleed: 14,
      edge: 0.04,
    });
  }
  svg += watercolorWash(capPts, rng, { color: capColor, opacity: 0.85, bleed: 2 });
  svg += handStroke(capPts, rng, {
    color: palette.ink,
    width: 1.0,
    closed: true,
    wobble: 0.5,
    overshoot: 0,
  });
  // dots
  const dots = 4;
  for (let i = 0; i < dots; i++) {
    const t = (i + 0.5) / dots;
    const x = cx - capR * 0.7 + t * capR * 1.4;
    const y = capCy - capR * 0.35 + dSin(t * Math.PI) * -3 * scale;
    svg += `<ellipse cx="${fmt2(x)}" cy="${fmt2(y)}" rx="${fmt2(
      2.4 * scale
    )}" ry="${fmt2(1.8 * scale)}" fill="#fffaf0" opacity="0.9"/>`;
  }
  return svg;
}

export function flower(
  cx: number,
  baseY: number,
  scale: number,
  rng: Rng,
  palette: Palette,
  color?: string,
): string {
  const c = color ?? pickFlowerColor(palette, rng);
  let svg = '';
  // stem
  const stemH = 16 * scale;
  const stemEndX = cx + (rng() - 0.5) * 4 * scale;
  const stemEndY = baseY - stemH;
  svg += handStroke(
    [
      [cx, baseY],
      [stemEndX, stemEndY],
    ],
    rng,
    {
      color: palette.leafShadow,
      width: 0.9 * scale,
      wobble: 0.5,
      overshoot: 0,
      passes: 1,
    },
  );
  // a leaf on the stem
  if (rng() < 0.6) {
    const ly = baseY - stemH * 0.45;
    const dir = rng() < 0.5 ? -1 : 1;
    const leaf: Pt[] = [
      [cx, ly],
      [cx + dir * 6 * scale, ly - 3 * scale],
      [cx + dir * 9 * scale, ly + 1 * scale],
      [cx + dir * 6 * scale, ly + 4 * scale],
    ];
    svg += watercolorWash(leaf, rng, { color: palette.leaf, opacity: 0.7, bleed: 1 });
    svg += handStroke(leaf, rng, {
      color: palette.inkSoft,
      width: 0.7 * scale,
      closed: true,
      wobble: 0.4,
      overshoot: 0,
      passes: 1,
    });
  }
  // petals — 5 small ovals around a center
  const petals = 5 + Math.floor(rng() * 2);
  const petalR = 4 * scale;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + rng() * 0.2;
    const px = stemEndX + dCos(a) * petalR * 1.1;
    const py = stemEndY + dSin(a) * petalR * 1.1;
    svg += `<ellipse cx="${fmt2(px)}" cy="${fmt2(py)}" rx="${fmt2(
      petalR
    )}" ry="${fmt2(petalR * 0.75)}" fill="${c}" opacity="0.85" stroke="${
      palette.inkSoft
    }" stroke-width="${fmt2(0.4 * scale)}" transform="rotate(${fmt2(
      (a * 180) /
      Math.PI
    )} ${fmt2(px)} ${fmt2(py)})"/>`;
  }
  // center
  svg += `<circle cx="${fmt2(stemEndX)}" cy="${fmt2(stemEndY)}" r="${fmt2(petalR * 0.55)}" fill="${
    palette.flowerCenter
  }" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;
  return svg;
}

export function butterfly(cx: number, cy: number, scale: number, rng: Rng, palette: Palette): string {
  const wingColor = pickFlowerColor(palette, rng);
  let svg = '';
  // body
  svg += `<ellipse cx="${fmt2(cx)}" cy="${fmt2(cy)}" rx="${fmt2(
    1.2 * scale
  )}" ry="${fmt2(4 * scale)}" fill="${palette.ink}"/>`;
  // wings — top
  for (const sign of [-1, 1]) {
    const wing: Pt[] = [
      [cx, cy - 1 * scale],
      [cx + sign * 8 * scale, cy - 6 * scale],
      [cx + sign * 7 * scale, cy + 1 * scale],
      [cx, cy + 1 * scale],
    ];
    svg += watercolorWash(wing, rng, { color: wingColor, opacity: 0.85, bleed: 1 });
    svg += handStroke(wing, rng, {
      color: palette.ink,
      width: 0.6 * scale,
      closed: true,
      wobble: 0.3,
      overshoot: 0,
      passes: 1,
    });
    // bottom wing
    const wing2: Pt[] = [
      [cx, cy + 1 * scale],
      [cx + sign * 6 * scale, cy + 4 * scale],
      [cx + sign * 4 * scale, cy + 6 * scale],
      [cx, cy + 3 * scale],
    ];
    svg += watercolorWash(wing2, rng, { color: lighten(wingColor, 0.15), opacity: 0.85, bleed: 1 });
    svg += handStroke(wing2, rng, {
      color: palette.ink,
      width: 0.6 * scale,
      closed: true,
      wobble: 0.3,
      overshoot: 0,
      passes: 1,
    });
  }
  // antennae
  svg += `<path d="M${fmt2(cx)} ${fmt2(cy - 4 * scale)} q${fmt2(
    -1 * scale
  )} ${fmt2(-3 * scale)} ${fmt2(-3 * scale)} ${fmt2(
    -4 * scale
  )} M${fmt2(cx)} ${fmt2(cy - 4 * scale)} q${fmt2(
    1 * scale
  )} ${fmt2(-3 * scale)} ${fmt2(3 * scale)} ${fmt2(
    -4 * scale
  )}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}" fill="none" stroke-linecap="round"/>`;
  return svg;
}

export function littleBird(cx: number, cy: number, scale: number, rng: Rng, palette: Palette): string {
  // an "M" silhouette
  const w = 8 * scale;
  return `<path d="M${fmt2(cx - w)} ${fmt2(cy)} q${fmt2(
    w * 0.5
  )} ${fmt2(-w * 0.6)} ${fmt2(w)} 0 q${fmt2(
    w * 0.5
  )} ${fmt2(-w * 0.6)} ${fmt2(w)} 0" stroke="${palette.ink}" stroke-width="${fmt2(1.2 * scale)}" fill="none" stroke-linecap="round"/>`;
}

export function grassTufts(canvas: Canvas, baseY: number, count: number, rng: Rng, palette: Palette): string {
  let svg = '';
  for (let i = 0; i < count; i++) {
    const x = rng() * canvas.width;
    const h = range(rng, 4, 9);
    const blades = 3;
    for (let b = 0; b < blades; b++) {
      const offset = (b - 1) * 2;
      svg += handStroke(
        [
          [x + offset, baseY + 2],
          [x + offset + (rng() - 0.5) * 2, baseY - h + (b - 1) * 1],
        ],
        rng,
        {
          color: palette.grassShadow,
          width: 0.7,
          wobble: 0.4,
          overshoot: 0,
          passes: 1,
          opacity: 0.85,
        },
      );
    }
  }
  return svg;
}

// ─── full backdrops ──────────────────────────────────────────────────────────

export function drawBackdrop(
  kind: BackdropKind,
  canvas: Canvas,
  palette: Palette,
  seed: number,
): string {
  const rng = mulberry32(seed ^ hashString(kind));
  let svg = '';
  switch (kind) {
    case 'meadow':
    case 'meadow-sunset': {
      const horizon = canvas.height * 0.55;
      svg += skyWash(canvas, palette, rng, horizon);
      // distant hills
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.05,
        canvas.height * 0.06,
        palette.mountainFar,
        palette.hillShadow,
        rng,
        palette,
        seed ^ 1,
        0.35,
      );
      // mid hills
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.12,
        canvas.height * 0.08,
        palette.hill,
        palette.hillShadow,
        rng,
        palette,
        seed ^ 2,
        0.55,
      );
      // foreground grass
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.22,
        canvas.height * 0.06,
        palette.grass,
        palette.grassShadow,
        rng,
        palette,
        seed ^ 3,
        0.8,
      );
      // tufts
      svg += grassTufts(canvas, canvas.height - 8, 70, rng, palette);
      break;
    }
    case 'night-sky': {
      const horizon = canvas.height * 0.7;
      svg += skyWash(canvas, palette, rng, horizon);
      svg += stars(canvas, 60, rng, palette, horizon * 0.9);
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.05,
        canvas.height * 0.06,
        palette.mountainNear,
        palette.hillShadow,
        rng,
        palette,
        seed ^ 11,
        0.4,
      );
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.12,
        canvas.height * 0.06,
        palette.hill,
        palette.hillShadow,
        rng,
        palette,
        seed ^ 12,
        0.6,
      );
      svg += grassTufts(canvas, canvas.height - 8, 60, rng, palette);
      break;
    }
    case 'forest-clearing': {
      const horizon = canvas.height * 0.5;
      svg += skyWash(canvas, palette, rng, horizon);
      // trees in background — silhouettes
      for (let i = 0; i < 7; i++) {
        const x = (i / 6) * canvas.width + (rng() - 0.5) * 30;
        const h = range(rng, 110, 170);
        svg += tree(x, horizon + 30, h, rng, palette);
      }
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.25,
        canvas.height * 0.05,
        palette.grass,
        palette.grassShadow,
        rng,
        palette,
        seed ^ 21,
        0.7,
      );
      svg += grassTufts(canvas, canvas.height - 8, 60, rng, palette);
      break;
    }
    case 'burrow-interior': {
      // round burrow — warm earth tones, dirt arch ceiling
      svg += `<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="${darken(
        palette.trunk,
        0.05,
      )}"/>`;
      // arched floor patch (lighter)
      const arch: Pt[] = [];
      const segs = 30;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const a = Math.PI * t;
        const x = canvas.width * 0.5 + dCos(Math.PI - a) * canvas.width * 0.55;
        const y = canvas.height * 0.4 + dSin(Math.PI - a) * canvas.height * 0.55;
        arch.push([x, y]);
      }
      arch.push([canvas.width + 10, canvas.height + 10]);
      arch.push([-10, canvas.height + 10]);
      svg += watercolorWash(arch, rng, {
        color: lighten(palette.trunk, 0.18),
        opacity: 0.8,
        bleed: 6,
      });
      // texture flecks
      for (let i = 0; i < 80; i++) {
        const x = rng() * canvas.width;
        const y = rng() * canvas.height;
        svg += `<circle cx="${fmt2(x)}" cy="${fmt2(y)}" r="${fmt2(range(rng, 0.4, 1.4))}" fill="${darken(palette.trunk, 0.15)}" opacity="${fmt2(range(rng, 0.2, 0.5))}"/>`;
      }
      // a small round window of light at the entrance
      svg += `<ellipse cx="${fmt2(canvas.width * 0.85)}" cy="${fmt2(
        canvas.height * 0.45
      )}" rx="${fmt2(canvas.width * 0.1)}" ry="${fmt2(canvas.height * 0.18)}" fill="${
        palette.sunGlow
      }" opacity="0.55"/>`;
      break;
    }
    case 'pond': {
      const horizon = canvas.height * 0.45;
      svg += skyWash(canvas, palette, rng, horizon);
      svg += hillBand(
        canvas,
        horizon + canvas.height * 0.02,
        canvas.height * 0.05,
        palette.mountainFar,
        palette.hillShadow,
        rng,
        palette,
        seed ^ 31,
        0.4,
      );
      // water
      const waterTop = horizon + canvas.height * 0.06;
      svg += `<rect x="0" y="${waterTop}" width="${canvas.width}" height="${
        canvas.height - waterTop
      }" fill="${palette.water}" opacity="0.7"/>`;
      // ripples
      for (let i = 0; i < 8; i++) {
        const y = waterTop + range(rng, 8, canvas.height - waterTop - 8);
        const x = rng() * canvas.width;
        const w = range(rng, 30, 90);
        svg += handStroke(
          [
            [x - w / 2, y],
            [x + w / 2, y],
          ],
          rng,
          {
            color: palette.waterShadow,
            width: 1.0,
            wobble: 0.6,
            overshoot: 0,
            passes: 1,
            opacity: 0.55,
          },
        );
      }
      svg += grassTufts(canvas, waterTop - 2, 30, rng, palette);
      break;
    }
  }
  return svg;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function circlePoly(cx: number, cy: number, r: number, n: number, rng: Rng, irreg: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const m = 1 + (rng() - 0.5) * 2 * irreg;
    pts.push([cx + dCos(a) * r * m, cy + dSin(a) * r * m]);
  }
  return pts;
}
