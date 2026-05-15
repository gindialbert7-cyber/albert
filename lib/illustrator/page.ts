/**
 * Page composer.
 *
 * A Page is a backdrop + a list of placed characters (with their pose) and
 * placed props (with kind + position). Rendering walks the list in z-order,
 * paints each item, then lays a paper vignette over everything so the page
 * reads as a single coherent illustration on cream stock.
 */

import { Character, Pose, Placement, DEFAULT_POSE } from './character';
import { Palette, getPalette, Mood } from './palette';
import type { Artist } from './artist';
import { fusePalette } from './palette-fuse';
import { mulberry32, hashString } from './rng';
import { fmt2 } from './math/det-format';
import {
  drawBackdrop,
  paperBackground,
  paperVignette,
  sun,
  moon,
  cloud,
  tree,
  mushroom,
  flower,
  butterfly,
  littleBird,
  Canvas,
  BackdropKind,
} from './scenery';
import { drawRabbit } from './characters/rabbit';
import { drawOwl } from './characters/owl';
import { drawFox } from './characters/fox';
import { drawMouse } from './characters/mouse';
import { renderBuiltinProp, type BuiltinPropName, ALL_BUILTIN_PROPS } from './builtin-props';

export type PropKind =
  | { kind: 'sun'; x: number; y: number; r?: number; rays?: boolean }
  | { kind: 'moon'; x: number; y: number; r?: number }
  | { kind: 'cloud'; x: number; y: number; w?: number }
  | { kind: 'tree'; x: number; y: number; h?: number }
  | { kind: 'mushroom'; x: number; y: number; scale?: number; capColor?: string; glow?: boolean }
  | { kind: 'flower'; x: number; y: number; scale?: number; color?: string }
  | { kind: 'butterfly'; x: number; y: number; scale?: number }
  | { kind: 'bird'; x: number; y: number; scale?: number }
  | { kind: 'builtin'; name: BuiltinPropName; x: number; y: number; scale?: number };

export type PlacedCharacter = {
  characterId: string;
  pose?: Partial<Pose>;
  placement: Placement;
};

export type PlacedProp = PropKind & { z?: number };

export type Page = {
  id: string;
  /** Free-text caption shown above/below the illustration. */
  caption?: string;
  /** Backdrop kind (selects the world). */
  backdrop: BackdropKind;
  /** Day / sunset / night / morning / snow / forest. */
  mood: Mood;
  /** Optional canvas size override. Default 800×600. */
  canvas?: Canvas;
  /** Z-ordered list (lower index = drawn first = behind). */
  background?: PlacedProp[];
  characters?: PlacedCharacter[];
  foreground?: PlacedProp[];
  /** Per-page seed; defaults to hash(page.id). */
  seed?: number;
};

export function renderPage(page: Page, cast: Character[], artist?: Artist): string {
  const canvas: Canvas = page.canvas ?? { width: 800, height: 600 };
  const basePalette = getPalette(page.mood);
  const palette = artist ? fusePalette(basePalette, artist) : basePalette;
  const seed = page.seed ?? hashString('page:' + page.id);

  let svg = '';
  // 1) paper
  svg += paperBackground(canvas, palette, seed);
  // 2) backdrop
  svg += drawBackdrop(page.backdrop, canvas, palette, seed);
  // 3) background props
  if (page.background) {
    svg += renderProps(page.background, palette, seed ^ 0xb1);
  }
  // 4) characters
  if (page.characters) {
    // 4a) ground shadows under each character (drawn first, so they sit
    //     under any character body and behind props)
    for (const pc of page.characters) {
      const c = cast.find((x) => x.id === pc.characterId);
      if (!c) continue;
      // Pass-through scale: character.scale × placement.scale
      const scale = c.scale * (pc.placement.scale ?? 1);
      const shadowW = 48 * scale;
      const shadowH = 7 * scale;
      // Shadow ellipse at the character's foot position.
      svg += `<ellipse cx="${fmt2(pc.placement.x)}" cy="${fmt2(pc.placement.y + 2 * scale)}" rx="${fmt2(shadowW)}" ry="${fmt2(shadowH)}" fill="${palette.ink}" opacity="0.14"/>`;
    }
    // 4b) the characters themselves
    for (const pc of page.characters) {
      const c = cast.find((x) => x.id === pc.characterId);
      if (!c) {
        svg += `<text x="20" y="40" fill="#a00" font-family="serif">missing character: ${pc.characterId}</text>`;
        continue;
      }
      svg += renderCharacter(c, { ...DEFAULT_POSE, ...(pc.pose ?? {}) }, pc.placement, palette, seed);
    }
  }
  // 5) foreground props
  if (page.foreground) {
    svg += renderProps(page.foreground, palette, seed ^ 0xf2);
  }
  // 6) vignette
  svg += paperVignette(canvas, palette, seed ^ 0xf17);

  // Wrap as full SVG
  const captionH = page.caption ? 40 : 0;
  const totalH = canvas.height + captionH;
  let captionSvg = '';
  if (page.caption) {
    const safe = page.caption
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    captionSvg = `
<g transform="translate(0 ${canvas.height})">
  <rect x="0" y="0" width="${canvas.width}" height="${captionH}" fill="${palette.paper}"/>
  <text x="${canvas.width / 2}" y="${captionH / 2 + 6}" text-anchor="middle"
    font-family="Georgia, 'Crimson Pro', serif" font-style="italic"
    font-size="18" fill="${palette.ink}">${safe}</text>
</g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${totalH}" width="${canvas.width}" height="${totalH}">
${svg}${captionSvg}
</svg>`;
}

function renderCharacter(
  c: Character,
  pose: Pose,
  placement: Placement,
  palette: Palette,
  pageSeed: number,
): string {
  // Per-page RNG, salted with the character id, so per-page wobble varies
  // across pages but shape parameters (locked into the character sheet) do
  // not. The character looks like itself; the *ink* breathes a little.
  const rng = mulberry32((pageSeed ^ hashString(c.id)) >>> 0);
  switch (c.species) {
    case 'rabbit':
      return drawRabbit(c, pose, placement, rng, palette);
    case 'owl':
      return drawOwl(c, pose, placement, rng, palette);
    case 'fox':
      return drawFox(c, pose, placement, rng, palette);
    case 'mouse':
      return drawMouse(c, pose, placement, rng, palette);
  }
}

function renderProps(props: PlacedProp[], palette: Palette, seed: number): string {
  const sorted = [...props].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  let svg = '';
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const rng = mulberry32((seed ^ hashString(p.kind + ':' + i)) >>> 0);
    switch (p.kind) {
      case 'sun':
        svg += sun(p.x, p.y, p.r ?? 32, rng, palette, p.rays ?? true);
        break;
      case 'moon':
        svg += moon(p.x, p.y, p.r ?? 30, rng, palette);
        break;
      case 'cloud':
        svg += cloud(p.x, p.y, p.w ?? 70, rng, palette);
        break;
      case 'tree':
        svg += tree(p.x, p.y, p.h ?? 140, rng, palette);
        break;
      case 'mushroom':
        svg += mushroom(p.x, p.y, p.scale ?? 1, rng, palette, p.capColor, p.glow);
        break;
      case 'flower':
        svg += flower(p.x, p.y, p.scale ?? 1, rng, palette, p.color);
        break;
      case 'butterfly':
        svg += butterfly(p.x, p.y, p.scale ?? 1, rng, palette);
        break;
      case 'bird':
        svg += littleBird(p.x, p.y, p.scale ?? 1, rng, palette);
        break;
      case 'builtin':
        svg += renderBuiltinProp(
          p.name,
          p.x,
          p.y,
          p.scale ?? 1,
          (seed ^ hashString('bp:' + p.name + ':' + i)) >>> 0,
          palette,
        );
        break;
    }
  }
  return svg;
}

// Re-export so callers can enumerate available built-in prop names.
export { ALL_BUILTIN_PROPS };
export type { BuiltinPropName };

// Render only the character (used for a "character sheet" page).
export function renderCharacterSheet(c: Character, canvas: Canvas = { width: 480, height: 540 }, artist?: Artist): string {
  const basePalette = getPalette('day');
  const palette = artist ? fusePalette(basePalette, artist) : basePalette;
  const seed = hashString('sheet:' + c.id);
  let svg = '';
  svg += paperBackground(canvas, palette, seed);

  // Title
  svg += `<text x="${canvas.width / 2}" y="48" text-anchor="middle"
    font-family="Georgia, 'Crimson Pro', serif" font-size="28" fill="${palette.ink}">${escapeXml(
    c.name,
  )}</text>`;
  svg += `<text x="${canvas.width / 2}" y="74" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="14" fill="${palette.inkSoft}">${escapeXml(
    'a ' + c.species,
  )}</text>`;

  // Pose: forward-facing standing
  const placement: Placement = { x: canvas.width / 2, y: canvas.height - 80 };
  svg += renderCharacter(c, DEFAULT_POSE, placement, palette, seed);

  // Tiny notes panel (just a few legend items)
  const lines = [
    `fur ${c.furColor}`,
    `belly ${c.bellyColor}`,
    `build ${c.build}`,
    `accessory ${c.accessory.kind}${
      c.accessory.kind !== 'none' && 'color' in c.accessory ? ' / ' + c.accessory.color : ''
    }`,
  ];
  for (let i = 0; i < lines.length; i++) {
    svg += `<text x="20" y="${canvas.height - 70 + i * 16}" font-family="monospace" font-size="11" fill="${
      palette.inkSoft
    }">${escapeXml(lines[i])}</text>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">
${svg}
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
