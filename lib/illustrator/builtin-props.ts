/**
 * Built-in procedural prop library.
 *
 * Adds a fallback vocabulary the system has WITHOUT requiring library
 * API access. These ~20 props are common children's-book objects
 * rendered procedurally in the active Artist's style.
 *
 * The library cascade tries external sources first; missing or rate-
 * limited results fall back here. For the v1 product without API keys,
 * this library is the sole vocabulary alongside the hardcoded scenery
 * primitives.
 *
 * Adding a new built-in prop: write a function that takes
 * (x, y, scale, rng, palette) and returns SVG. Register it in
 * BUILTIN_PROPS below.
 */

import type { Pt } from './geometry';
import { handStroke, hatchFill } from './drawing';
import { mulberry32, hashString, type Rng } from './rng';
import type { Palette } from './palette';
import { watercolorWash, lighten, darken } from './watercolor';
import { fmt2 } from './math/det-format';
import { dSin, dCos } from './math/det-math';

export type BuiltinPropName =
  | 'house'
  | 'cottage'
  | 'fire-truck'
  | 'sailboat'
  | 'kite'
  | 'balloon'
  | 'book'
  | 'cup'
  | 'cake'
  | 'ball'
  | 'umbrella'
  | 'mailbox'
  | 'lamp-post'
  | 'fence'
  | 'picnic-basket'
  | 'crown'
  | 'star-decoration'
  | 'present'
  | 'apple'
  | 'pumpkin';

export type PropRenderer = (
  x: number,
  y: number,
  scale: number,
  rng: Rng,
  palette: Palette,
) => string;

// ─── house ──────────────────────────────────────────────────────────────────

const house: PropRenderer = (x, y, scale, rng, palette) => {
  const w = 80 * scale;
  const h = 70 * scale;
  let svg = '';
  // body
  const body: Pt[] = [
    [x - w / 2, y - h * 0.4],
    [x + w / 2, y - h * 0.4],
    [x + w / 2, y + h * 0.6],
    [x - w / 2, y + h * 0.6],
  ];
  svg += watercolorWash(body, rng, { color: palette.cottageWall, opacity: 0.78, bleed: 2 });
  svg += handStroke(body, rng, { color: palette.ink, width: 1.3, closed: true, wobble: 0.6, overshoot: 0 });
  // roof
  const roof: Pt[] = [
    [x - w / 2 - 4 * scale, y - h * 0.4 + 1 * scale],
    [x, y - h * 0.95],
    [x + w / 2 + 4 * scale, y - h * 0.4 + 1 * scale],
  ];
  svg += watercolorWash(roof, rng, { color: palette.cottageRoof, opacity: 0.85, bleed: 2 });
  svg += handStroke(roof, rng, { color: palette.ink, width: 1.3, closed: true, wobble: 0.6, overshoot: 0 });
  // door
  const dw = 18 * scale;
  const dh = 32 * scale;
  const door: Pt[] = [
    [x - dw / 2, y + h * 0.6 - dh],
    [x + dw / 2, y + h * 0.6 - dh],
    [x + dw / 2, y + h * 0.6],
    [x - dw / 2, y + h * 0.6],
  ];
  svg += watercolorWash(door, rng, { color: palette.cottageDoor, opacity: 0.85, bleed: 1 });
  svg += handStroke(door, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.5, overshoot: 0 });
  // doorknob
  svg += `<circle cx="${fmt2(x + dw / 4)}" cy="${fmt2(y + h * 0.6 - dh / 2)}" r="${fmt2(1.5 * scale)}" fill="${palette.flowerCenter}"/>`;
  // window
  const ww = 16 * scale;
  const wy = y - h * 0.2;
  for (const sign of [-1, 1]) {
    const wx = x + sign * w * 0.28;
    const win: Pt[] = [
      [wx - ww / 2, wy],
      [wx + ww / 2, wy],
      [wx + ww / 2, wy + ww],
      [wx - ww / 2, wy + ww],
    ];
    svg += `<rect x="${fmt2(wx - ww / 2)}" y="${fmt2(wy)}" width="${fmt2(ww)}" height="${fmt2(ww)}" fill="${palette.window}" stroke="${palette.ink}" stroke-width="${fmt2(0.9 * scale)}"/>`;
    svg += handStroke(win, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    // cross
    svg += `<line x1="${fmt2(wx)}" y1="${fmt2(wy)}" x2="${fmt2(wx)}" y2="${fmt2(wy + ww)}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}"/>`;
    svg += `<line x1="${fmt2(wx - ww / 2)}" y1="${fmt2(wy + ww / 2)}" x2="${fmt2(wx + ww / 2)}" y2="${fmt2(wy + ww / 2)}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}"/>`;
  }
  return svg;
};

// ─── cottage (smaller, with chimney smoke) ─────────────────────────────────

const cottage: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = house(x, y, scale * 0.9, rng, palette);
  // chimney
  const cx = x + 22 * scale;
  const cTop = y - 60 * scale;
  const chimney: Pt[] = [
    [cx - 4 * scale, cTop + 12 * scale],
    [cx + 4 * scale, cTop + 12 * scale],
    [cx + 4 * scale, cTop],
    [cx - 4 * scale, cTop],
  ];
  svg += watercolorWash(chimney, rng, { color: palette.cottageRoof, opacity: 0.85, bleed: 1 });
  svg += handStroke(chimney, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0 });
  // smoke (three small puffs)
  for (let i = 0; i < 3; i++) {
    const sy = cTop - 6 * scale - i * 8 * scale;
    const sx = cx + (i % 2 === 0 ? -3 : 3) * scale;
    const r = (3 + i) * scale;
    svg += `<circle cx="${fmt2(sx)}" cy="${fmt2(sy)}" r="${fmt2(r)}" fill="${palette.smoke}" opacity="${fmt2(0.7 - i * 0.15)}"/>`;
  }
  return svg;
};

// ─── fire truck ─────────────────────────────────────────────────────────────

const fireTruck: PropRenderer = (x, y, scale, rng, palette) => {
  const w = 90 * scale;
  const h = 38 * scale;
  let svg = '';
  // chassis
  const chassis: Pt[] = [
    [x - w / 2, y - h * 0.4],
    [x + w * 0.32, y - h * 0.4],
    [x + w * 0.32, y - h * 0.9],
    [x + w / 2, y - h * 0.9],
    [x + w / 2, y + h * 0.4],
    [x - w / 2, y + h * 0.4],
  ];
  // Red fire truck — needs a chroma-capped warm red, get from palette
  const red = darken(palette.cottageRoof, 0.05);
  svg += watercolorWash(chassis, rng, { color: red, opacity: 0.88, bleed: 2 });
  svg += handStroke(chassis, rng, { color: palette.ink, width: 1.3, closed: true, wobble: 0.55, overshoot: 0 });
  // cab window
  const cabWin: Pt[] = [
    [x + w * 0.36, y - h * 0.85],
    [x + w / 2 - 2 * scale, y - h * 0.85],
    [x + w / 2 - 2 * scale, y - h * 0.5],
    [x + w * 0.36, y - h * 0.5],
  ];
  svg += watercolorWash(cabWin, rng, { color: palette.window, opacity: 0.8, bleed: 1 });
  svg += handStroke(cabWin, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  // ladder on top
  for (let i = 0; i < 5; i++) {
    const lx = x - w * 0.42 + i * w * 0.16;
    svg += `<line x1="${fmt2(lx)}" y1="${fmt2(y - h * 0.5)}" x2="${fmt2(lx)}" y2="${fmt2(y - h * 0.4)}" stroke="${palette.inkSoft}" stroke-width="${fmt2(1 * scale)}"/>`;
  }
  svg += `<line x1="${fmt2(x - w * 0.42)}" y1="${fmt2(y - h * 0.45)}" x2="${fmt2(x + w * 0.3)}" y2="${fmt2(y - h * 0.45)}" stroke="${palette.inkSoft}" stroke-width="${fmt2(1 * scale)}"/>`;
  // wheels
  for (const wx of [x - w * 0.3, x + w * 0.3]) {
    svg += `<circle cx="${fmt2(wx)}" cy="${fmt2(y + h * 0.4)}" r="${fmt2(8 * scale)}" fill="${palette.ink}" stroke="${palette.ink}" stroke-width="${fmt2(1 * scale)}"/>`;
    svg += `<circle cx="${fmt2(wx)}" cy="${fmt2(y + h * 0.4)}" r="${fmt2(3.5 * scale)}" fill="${palette.cottageWall}" opacity="0.85"/>`;
  }
  return svg;
};

// ─── sailboat ──────────────────────────────────────────────────────────────

const sailboat: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  // hull (curved trapezoid)
  const hull: Pt[] = [
    [x - 30 * scale, y],
    [x + 30 * scale, y],
    [x + 22 * scale, y + 14 * scale],
    [x - 22 * scale, y + 14 * scale],
  ];
  svg += watercolorWash(hull, rng, { color: darken(palette.trunk, 0.05), opacity: 0.85, bleed: 2 });
  svg += handStroke(hull, rng, { color: palette.ink, width: 1.3, closed: true, wobble: 0.5, overshoot: 0 });
  // mast
  svg += `<line x1="${fmt2(x)}" y1="${fmt2(y)}" x2="${fmt2(x)}" y2="${fmt2(y - 40 * scale)}" stroke="${palette.ink}" stroke-width="${fmt2(1.4 * scale)}"/>`;
  // sail
  const sail: Pt[] = [
    [x, y - 40 * scale],
    [x + 26 * scale, y - 2 * scale],
    [x + 2 * scale, y - 2 * scale],
  ];
  svg += watercolorWash(sail, rng, { color: palette.cloud, opacity: 0.9, bleed: 2 });
  svg += handStroke(sail, rng, { color: palette.ink, width: 1.2, closed: true, wobble: 0.5, overshoot: 0 });
  return svg;
};

// ─── kite ──────────────────────────────────────────────────────────────────

const kite: PropRenderer = (x, y, scale, rng, palette) => {
  const halfW = 16 * scale;
  const topY = y - 24 * scale;
  const bottomY = y + 24 * scale;
  const kitePoly: Pt[] = [[x, topY], [x + halfW, y], [x, bottomY], [x - halfW, y]];
  let svg = '';
  svg += watercolorWash(kitePoly, rng, { color: palette.flowers[0] ?? palette.cottageRoof, opacity: 0.85, bleed: 1.5 });
  svg += handStroke(kitePoly, rng, { color: palette.ink, width: 1.2, closed: true, wobble: 0.5, overshoot: 0 });
  // cross
  svg += `<line x1="${fmt2(x)}" y1="${fmt2(topY)}" x2="${fmt2(x)}" y2="${fmt2(bottomY)}" stroke="${palette.ink}" stroke-width="${fmt2(0.8 * scale)}"/>`;
  svg += `<line x1="${fmt2(x - halfW)}" y1="${fmt2(y)}" x2="${fmt2(x + halfW)}" y2="${fmt2(y)}" stroke="${palette.ink}" stroke-width="${fmt2(0.8 * scale)}"/>`;
  // tail
  const tail: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    tail.push([x + dSin(i * 1.2) * 4 * scale, bottomY + t * 30 * scale]);
  }
  svg += handStroke(tail, rng, { color: palette.ink, width: 0.8, wobble: 0.6, overshoot: 0, passes: 1 });
  // bows on tail
  for (let i = 1; i <= 3; i++) {
    const ty = bottomY + (i / 4) * 30 * scale;
    const tx = x + dSin(i * 1.2) * 4 * scale;
    svg += `<path d="M${fmt2(tx - 2.5 * scale)} ${fmt2(ty)} L${fmt2(tx)} ${fmt2(ty - 2 * scale)} L${fmt2(tx + 2.5 * scale)} ${fmt2(ty)} L${fmt2(tx)} ${fmt2(ty + 2 * scale)} Z" fill="${palette.flowers[1] ?? palette.flowers[0]}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;
  }
  return svg;
};

// ─── balloon ───────────────────────────────────────────────────────────────

const balloon: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const r = 14 * scale;
  // teardrop oval
  const balloonShape: Pt[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const taper = 1 + 0.05 * dSin(a + Math.PI / 2);
    balloonShape.push([x + dCos(a) * r * taper, y + dSin(a) * r * 1.1 * taper]);
  }
  const color = palette.flowers[2] ?? palette.cottageRoof;
  svg += watercolorWash(balloonShape, rng, { color, opacity: 0.85, bleed: 2 });
  svg += handStroke(balloonShape, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  // knot
  svg += `<path d="M${fmt2(x - 2 * scale)} ${fmt2(y + r * 1.1)} L${fmt2(x)} ${fmt2(y + r * 1.1 + 4 * scale)} L${fmt2(x + 2 * scale)} ${fmt2(y + r * 1.1)} Z" fill="${color}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;
  // string
  svg += `<path d="M${fmt2(x)} ${fmt2(y + r * 1.1 + 4 * scale)} Q${fmt2(x - 3 * scale)} ${fmt2(y + r * 1.1 + 25 * scale)} ${fmt2(x + 1 * scale)} ${fmt2(y + r * 1.1 + 50 * scale)}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}" fill="none"/>`;
  return svg;
};

// ─── book ──────────────────────────────────────────────────────────────────

const book: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 28 * scale;
  const h = 36 * scale;
  // cover
  const cover: Pt[] = [
    [x - w / 2, y - h / 2],
    [x + w / 2, y - h / 2],
    [x + w / 2, y + h / 2],
    [x - w / 2, y + h / 2],
  ];
  const color = palette.flowers[0] ?? palette.cottageRoof;
  svg += watercolorWash(cover, rng, { color, opacity: 0.88, bleed: 1 });
  svg += handStroke(cover, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0 });
  // spine
  svg += `<line x1="${fmt2(x - w / 2 + 3 * scale)}" y1="${fmt2(y - h / 2)}" x2="${fmt2(x - w / 2 + 3 * scale)}" y2="${fmt2(y + h / 2)}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}"/>`;
  // title bar
  svg += `<rect x="${fmt2(x - w / 4)}" y="${fmt2(y - h / 4)}" width="${fmt2(w / 2)}" height="${fmt2(3 * scale)}" fill="${palette.flowerCenter}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  return svg;
};

// ─── cup (mug/teacup) ──────────────────────────────────────────────────────

const cup: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 22 * scale;
  const h = 22 * scale;
  // body — slightly tapered
  const body: Pt[] = [
    [x - w / 2, y - h / 2],
    [x + w / 2, y - h / 2],
    [x + w / 2 - 2 * scale, y + h / 2],
    [x - w / 2 + 2 * scale, y + h / 2],
  ];
  svg += watercolorWash(body, rng, { color: palette.cottageWall, opacity: 0.88, bleed: 1.5 });
  svg += handStroke(body, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0 });
  // rim
  svg += `<ellipse cx="${fmt2(x)}" cy="${fmt2(y - h / 2)}" rx="${fmt2(w / 2)}" ry="${fmt2(3 * scale)}" fill="${darken(palette.cottageWall, 0.1)}" stroke="${palette.ink}" stroke-width="${fmt2(0.7 * scale)}"/>`;
  // handle
  svg += `<path d="M${fmt2(x + w / 2 - 1 * scale)} ${fmt2(y - h * 0.3)} q${fmt2(8 * scale)} ${fmt2(2 * scale)} 0 ${fmt2(h * 0.5)}" stroke="${palette.ink}" stroke-width="${fmt2(1.2 * scale)}" fill="none"/>`;
  // steam
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * 4 * scale;
    svg += `<path d="M${fmt2(sx)} ${fmt2(y - h / 2 - 4 * scale)} q${fmt2(3 * scale)} ${fmt2(-5 * scale)} 0 ${fmt2(-10 * scale)} q${fmt2(-3 * scale)} ${fmt2(-5 * scale)} 0 ${fmt2(-10 * scale)}" stroke="${palette.inkSoft}" stroke-width="${fmt2(0.7 * scale)}" fill="none" opacity="0.7"/>`;
  }
  return svg;
};

// ─── cake ──────────────────────────────────────────────────────────────────

const cake: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 36 * scale;
  const h = 30 * scale;
  // bottom tier
  const bottom: Pt[] = [
    [x - w / 2, y - h / 4],
    [x + w / 2, y - h / 4],
    [x + w / 2, y + h / 4],
    [x - w / 2, y + h / 4],
  ];
  svg += watercolorWash(bottom, rng, { color: palette.cottageWall, opacity: 0.9, bleed: 1 });
  svg += handStroke(bottom, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0 });
  // top tier (icing scallops)
  for (let i = 0; i < 5; i++) {
    const sx = x - w / 2 + (i + 0.5) * (w / 5);
    svg += `<path d="M${fmt2(sx - w / 10)} ${fmt2(y - h / 4)} q${fmt2(w / 10)} ${fmt2(-w / 14)} ${fmt2(w / 5)} 0" stroke="${palette.ink}" stroke-width="${fmt2(0.9 * scale)}" fill="${palette.cheek}"/>`;
  }
  // candle
  svg += `<rect x="${fmt2(x - 1 * scale)}" y="${fmt2(y - h * 0.55)}" width="${fmt2(2 * scale)}" height="${fmt2(8 * scale)}" fill="${palette.flowers[0] ?? palette.cottageRoof}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  svg += `<path d="M${fmt2(x)} ${fmt2(y - h * 0.55 - 2 * scale)} q${fmt2(-3 * scale)} ${fmt2(-4 * scale)} 0 ${fmt2(-6 * scale)} q${fmt2(3 * scale)} ${fmt2(-2 * scale)} 0 ${fmt2(-2 * scale)}" fill="${palette.flowerCenter}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  return svg;
};

// ─── ball ──────────────────────────────────────────────────────────────────

const ball: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const r = 14 * scale;
  // ball shape
  const pts: Pt[] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    pts.push([x + dCos(a) * r, y + dSin(a) * r]);
  }
  svg += watercolorWash(pts, rng, { color: palette.flowers[0] ?? palette.cottageRoof, opacity: 0.88, bleed: 1.5 });
  svg += handStroke(pts, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  // stripe
  svg += `<path d="M${fmt2(x - r)} ${fmt2(y)} Q${fmt2(x)} ${fmt2(y + 4 * scale)} ${fmt2(x + r)} ${fmt2(y)}" stroke="${palette.ink}" stroke-width="${fmt2(0.8 * scale)}" fill="none"/>`;
  return svg;
};

// ─── umbrella ──────────────────────────────────────────────────────────────

const umbrella: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const r = 22 * scale;
  // canopy (half circle)
  const canopy: Pt[] = [];
  const segs = 16;
  for (let i = 0; i <= segs; i++) {
    const a = Math.PI + (i / segs) * Math.PI;
    canopy.push([x + dCos(a) * r, y + dSin(a) * r * 0.7]);
  }
  const c = palette.flowers[1] ?? palette.cottageRoof;
  svg += watercolorWash(canopy, rng, { color: c, opacity: 0.88, bleed: 1.5 });
  svg += handStroke(canopy, rng, { color: palette.ink, width: 1.2, closed: true, wobble: 0.5, overshoot: 0 });
  // ribs
  for (let i = 1; i < 5; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    svg += `<line x1="${fmt2(x)}" y1="${fmt2(y)}" x2="${fmt2(x + dCos(a) * r)}" y2="${fmt2(y + dSin(a) * r * 0.7)}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;
  }
  // handle
  svg += `<line x1="${fmt2(x)}" y1="${fmt2(y)}" x2="${fmt2(x)}" y2="${fmt2(y + 30 * scale)}" stroke="${palette.ink}" stroke-width="${fmt2(1.5 * scale)}"/>`;
  svg += `<path d="M${fmt2(x)} ${fmt2(y + 30 * scale)} q0 ${fmt2(6 * scale)} ${fmt2(-7 * scale)} ${fmt2(6 * scale)}" stroke="${palette.ink}" stroke-width="${fmt2(1.5 * scale)}" fill="none"/>`;
  return svg;
};

// ─── apple ─────────────────────────────────────────────────────────────────

const apple: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const r = 11 * scale;
  // apple shape (slightly squashed circle with indent at top)
  const pts: Pt[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const rr = r * (1 + 0.04 * dCos(a * 2 + Math.PI));
    pts.push([x + dCos(a) * rr, y + dSin(a) * rr * 0.95]);
  }
  const red = palette.cottageRoof;
  svg += watercolorWash(pts, rng, { color: red, opacity: 0.92, bleed: 1.2 });
  svg += handStroke(pts, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  // stem
  svg += `<path d="M${fmt2(x)} ${fmt2(y - r * 0.9)} q${fmt2(1 * scale)} ${fmt2(-3 * scale)} ${fmt2(3 * scale)} ${fmt2(-5 * scale)}" stroke="${palette.trunkShadow}" stroke-width="${fmt2(1.2 * scale)}" fill="none" stroke-linecap="round"/>`;
  // leaf
  svg += `<ellipse cx="${fmt2(x + 4 * scale)}" cy="${fmt2(y - r * 0.95)}" rx="${fmt2(3 * scale)}" ry="${fmt2(2 * scale)}" fill="${palette.leaf}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}" transform="rotate(20 ${fmt2(x + 4 * scale)} ${fmt2(y - r * 0.95)})"/>`;
  return svg;
};

// ─── star (decoration, e.g., on a tree) ───────────────────────────────────

const starDecoration: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const r = 12 * scale;
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push([x + dCos(a) * rr, y + dSin(a) * rr]);
  }
  svg += watercolorWash(pts, rng, { color: palette.sun, opacity: 0.92, bleed: 1 });
  svg += handStroke(pts, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0 });
  return svg;
};

// ─── pumpkin ───────────────────────────────────────────────────────────────

const pumpkin: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const r = 18 * scale;
  // Three overlapping segments
  const segColor = darken(palette.cottageRoof, 0.05);
  for (const dx of [-r * 0.4, 0, r * 0.4]) {
    const pts: Pt[] = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      pts.push([x + dx + dCos(a) * r * 0.55, y + dSin(a) * r * 0.85]);
    }
    svg += watercolorWash(pts, rng, { color: segColor, opacity: 0.78, bleed: 1.5 });
    svg += handStroke(pts, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  }
  // stem
  svg += `<rect x="${fmt2(x - 2 * scale)}" y="${fmt2(y - r * 0.95)}" width="${fmt2(4 * scale)}" height="${fmt2(6 * scale)}" fill="${palette.trunk}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;
  return svg;
};

// ─── crown ─────────────────────────────────────────────────────────────────

const crown: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 36 * scale;
  // band
  svg += `<rect x="${fmt2(x - w / 2)}" y="${fmt2(y - 2 * scale)}" width="${fmt2(w)}" height="${fmt2(8 * scale)}" fill="${palette.sun}" stroke="${palette.ink}" stroke-width="${fmt2(1.0 * scale)}"/>`;
  // points
  for (let i = 0; i < 5; i++) {
    const px = x - w / 2 + (i + 0.5) * (w / 5);
    const pts: Pt[] = [
      [px - w / 12, y - 2 * scale],
      [px, y - 14 * scale],
      [px + w / 12, y - 2 * scale],
    ];
    svg += watercolorWash(pts, rng, { color: palette.sun, opacity: 0.9, bleed: 1 });
    svg += handStroke(pts, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
    // gem
    svg += `<circle cx="${fmt2(px)}" cy="${fmt2(y - 8 * scale)}" r="${fmt2(1.5 * scale)}" fill="${palette.flowers[2] ?? palette.cheek}" stroke="${palette.ink}" stroke-width="${fmt2(0.3 * scale)}"/>`;
  }
  return svg;
};

// ─── present (gift box) ────────────────────────────────────────────────────

const present: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 28 * scale;
  const h = 26 * scale;
  const box: Pt[] = [
    [x - w / 2, y - h / 2],
    [x + w / 2, y - h / 2],
    [x + w / 2, y + h / 2],
    [x - w / 2, y + h / 2],
  ];
  svg += watercolorWash(box, rng, { color: palette.flowers[1] ?? palette.cottageRoof, opacity: 0.9, bleed: 1 });
  svg += handStroke(box, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0 });
  // ribbon vertical
  svg += `<rect x="${fmt2(x - 2 * scale)}" y="${fmt2(y - h / 2)}" width="${fmt2(4 * scale)}" height="${fmt2(h)}" fill="${palette.sun}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  // ribbon horizontal
  svg += `<rect x="${fmt2(x - w / 2)}" y="${fmt2(y - 2 * scale)}" width="${fmt2(w)}" height="${fmt2(4 * scale)}" fill="${palette.sun}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  // bow
  svg += `<path d="M${fmt2(x - 8 * scale)} ${fmt2(y - h / 2 - 2 * scale)} Q${fmt2(x)} ${fmt2(y - h / 2 - 10 * scale)} ${fmt2(x + 8 * scale)} ${fmt2(y - h / 2 - 2 * scale)} Q${fmt2(x)} ${fmt2(y - h / 2 + 4 * scale)} ${fmt2(x - 8 * scale)} ${fmt2(y - h / 2 - 2 * scale)} Z" fill="${palette.sun}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}"/>`;
  return svg;
};

// ─── picnic basket ─────────────────────────────────────────────────────────

const picnicBasket: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 36 * scale;
  const h = 26 * scale;
  // basket body
  const body: Pt[] = [
    [x - w / 2, y - h / 4],
    [x + w / 2, y - h / 4],
    [x + w / 2 - 3 * scale, y + h / 2],
    [x - w / 2 + 3 * scale, y + h / 2],
  ];
  svg += watercolorWash(body, rng, { color: palette.trunk, opacity: 0.85, bleed: 1.5 });
  // weave pattern (hatch fill)
  svg += hatchFill(body, rng, { color: palette.trunkShadow, angle: 45, spacing: 4, opacity: 0.4, width: 0.5 });
  svg += handStroke(body, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0 });
  // handle
  svg += `<path d="M${fmt2(x - w / 3)} ${fmt2(y - h / 4)} q0 ${fmt2(-h * 0.8)} ${fmt2(w * 2 / 3)} 0" stroke="${palette.ink}" stroke-width="${fmt2(1.5 * scale)}" fill="none"/>`;
  // checkered cloth peeking out
  svg += `<rect x="${fmt2(x - w / 3)}" y="${fmt2(y - h / 4 - 3 * scale)}" width="${fmt2(2 * w / 3)}" height="${fmt2(4 * scale)}" fill="${palette.flowers[0] ?? palette.cottageRoof}" opacity="0.85" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  return svg;
};

// ─── mailbox ───────────────────────────────────────────────────────────────

const mailbox: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  // post
  svg += `<rect x="${fmt2(x - 2 * scale)}" y="${fmt2(y - 30 * scale)}" width="${fmt2(4 * scale)}" height="${fmt2(50 * scale)}" fill="${palette.trunk}" stroke="${palette.ink}" stroke-width="${fmt2(0.6 * scale)}"/>`;
  // box (arched top rectangle)
  const w = 28 * scale;
  const h = 18 * scale;
  const box: Pt[] = [];
  // round top
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    box.push([x + dCos(a) * w / 2, y - 30 * scale + dSin(a) * h / 2]);
  }
  box.push([x + w / 2, y - 30 * scale + h / 2]);
  box.push([x - w / 2, y - 30 * scale + h / 2]);
  svg += watercolorWash(box, rng, { color: palette.flowers[2] ?? palette.cottageRoof, opacity: 0.88, bleed: 1.5 });
  svg += handStroke(box, rng, { color: palette.ink, width: 1.1, closed: true, wobble: 0.4, overshoot: 0 });
  // flag
  svg += `<rect x="${fmt2(x + w / 2)}" y="${fmt2(y - 35 * scale)}" width="${fmt2(7 * scale)}" height="${fmt2(5 * scale)}" fill="${palette.sun}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  return svg;
};

// ─── lamp post ─────────────────────────────────────────────────────────────

const lampPost: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  // post
  svg += `<rect x="${fmt2(x - 1.5 * scale)}" y="${fmt2(y - 50 * scale)}" width="${fmt2(3 * scale)}" height="${fmt2(70 * scale)}" fill="${palette.ink}" stroke="${palette.ink}" stroke-width="${fmt2(0.4 * scale)}"/>`;
  // arm (curve)
  svg += `<path d="M${fmt2(x)} ${fmt2(y - 50 * scale)} q${fmt2(8 * scale)} ${fmt2(-2 * scale)} ${fmt2(8 * scale)} ${fmt2(-12 * scale)}" stroke="${palette.ink}" stroke-width="${fmt2(2 * scale)}" fill="none"/>`;
  // lamp
  const lx = x + 8 * scale;
  const ly = y - 62 * scale;
  const lamp: Pt[] = [
    [lx - 6 * scale, ly],
    [lx + 6 * scale, ly],
    [lx + 5 * scale, ly + 10 * scale],
    [lx - 5 * scale, ly + 10 * scale],
  ];
  svg += watercolorWash(lamp, rng, { color: lighten(palette.sun, 0.2), opacity: 0.9, bleed: 1 });
  svg += handStroke(lamp, rng, { color: palette.ink, width: 1.0, closed: true, wobble: 0.4, overshoot: 0 });
  // glow
  svg += `<circle cx="${fmt2(lx)}" cy="${fmt2(ly + 5 * scale)}" r="${fmt2(15 * scale)}" fill="${palette.sun}" opacity="0.25"/>`;
  return svg;
};

// ─── fence ────────────────────────────────────────────────────────────────

const fence: PropRenderer = (x, y, scale, rng, palette) => {
  let svg = '';
  const w = 60 * scale;
  // 3 posts + 2 rails
  for (let i = 0; i < 5; i++) {
    const px = x - w / 2 + i * (w / 4);
    const ph = 26 * scale + (i % 2) * 2 * scale;
    const post: Pt[] = [
      [px - 1.5 * scale, y],
      [px + 1.5 * scale, y],
      [px + 1.5 * scale, y - ph],
      [px, y - ph - 3 * scale],
      [px - 1.5 * scale, y - ph],
    ];
    svg += watercolorWash(post, rng, { color: palette.trunk, opacity: 0.85, bleed: 1 });
    svg += handStroke(post, rng, { color: palette.ink, width: 0.9, closed: true, wobble: 0.4, overshoot: 0, passes: 1 });
  }
  // horizontal rails
  for (const ry of [y - 10 * scale, y - 20 * scale]) {
    svg += `<rect x="${fmt2(x - w / 2)}" y="${fmt2(ry)}" width="${fmt2(w)}" height="${fmt2(3 * scale)}" fill="${palette.trunk}" stroke="${palette.ink}" stroke-width="${fmt2(0.5 * scale)}"/>`;
  }
  return svg;
};

// ─── Registry ──────────────────────────────────────────────────────────────

const BUILTIN_PROPS: Record<BuiltinPropName, PropRenderer> = {
  'house': house,
  'cottage': cottage,
  'fire-truck': fireTruck,
  'sailboat': sailboat,
  'kite': kite,
  'balloon': balloon,
  'book': book,
  'cup': cup,
  'cake': cake,
  'ball': ball,
  'umbrella': umbrella,
  'mailbox': mailbox,
  'lamp-post': lampPost,
  'fence': fence,
  'picnic-basket': picnicBasket,
  'crown': crown,
  'star-decoration': starDecoration,
  'present': present,
  'apple': apple,
  'pumpkin': pumpkin,
};

/** Render a built-in prop by name at the given page position. */
export function renderBuiltinProp(
  name: BuiltinPropName,
  x: number,
  y: number,
  scale: number,
  seed: number,
  palette: Palette,
): string {
  const fn = BUILTIN_PROPS[name];
  if (!fn) return '';
  const rng = mulberry32((seed ^ hashString('prop:' + name)) >>> 0);
  return fn(x, y, scale, rng, palette);
}

export const ALL_BUILTIN_PROPS = Object.keys(BUILTIN_PROPS) as BuiltinPropName[];
