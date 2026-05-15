/**
 * Artist–Palette fusion.
 *
 * The Artist defines style globals (paper, ink, base palette, line
 * width, etc.). The mood-based Palette defines scene-specific colors
 * (sky, mountains, grass, etc.). Fusing the two gives us per-page
 * palettes that share the Artist's signature across every page in the
 * series, while still adapting to the scene's mood.
 *
 * The fusion principles:
 *   1. paper, ink, inkSoft → Artist values (unconditional)
 *   2. scene colors (sky, mountainFar/Near, hill, grass, water) →
 *      Artist's palette[] mapped onto the role, with mood preserved
 *      by mixing toward the original mood color (40/60 by default).
 *   3. character helpers (cheek, flowers, leaf, etc.) → drawn from
 *      Artist's palette where compatible; mood colors elsewhere.
 *
 * This is what makes "every author's book look like their book."
 */

import type { Artist } from './artist';
import { type Palette } from './palette';
import { clampChroma } from './colors/oklab';

// Mix two hex colors at ratio (0 = a only, 1 = b only) using linear-RGB mix.
function mixHex(a: string, b: string, ratio: number): string {
  const ma = /^#?([0-9a-f]{6})$/i.exec(a);
  const mb = /^#?([0-9a-f]{6})$/i.exec(b);
  if (!ma || !mb) return a;
  const na = parseInt(ma[1], 16);
  const nb = parseInt(mb[1], 16);
  const ar = (na >> 16) & 0xff;
  const ag = (na >> 8) & 0xff;
  const ab = na & 0xff;
  const br = (nb >> 16) & 0xff;
  const bg = (nb >> 8) & 0xff;
  const bb = nb & 0xff;
  const r = Math.round(ar + (br - ar) * ratio);
  const g = Math.round(ag + (bg - ag) * ratio);
  const bl = Math.round(ab + (bb - ab) * ratio);
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}

/**
 * Produce a palette that's the mood palette tinted toward the Artist's
 * style. Every scene color gets pulled toward an Artist-palette color
 * at the given strength.
 */
export function fusePalette(base: Palette, artist: Artist, strength: number = 0.55): Palette {
  // Pick 4 anchor colors from the Artist's palette for role mapping.
  const pal = artist.palette;
  const a0 = pal[0] ?? artist.inkColor; // dominant warm
  const a1 = pal[1] ?? pal[0] ?? artist.inkColor; // secondary warm
  const a2 = pal[Math.min(2, pal.length - 1)] ?? a0; // cool support
  const a3 = pal[Math.min(3, pal.length - 1)] ?? a1; // accent
  const a4 = pal[Math.min(4, pal.length - 1)] ?? a2;

  const tint = (c: string, anchor: string, s = strength) =>
    clampChroma(mixHex(c, anchor, s));

  return {
    ...base,
    // Artist globals (unconditional)
    paper: artist.paperStock,
    ink: artist.inkColor,
    inkSoft: mixHex(artist.inkColor, '#888888', 0.3),

    // Scene colors tinted toward Artist's palette
    sky: [tint(base.sky[0], a2), tint(base.sky[1], a2)],
    sun: tint(base.sun, a3),
    sunGlow: tint(base.sunGlow, a3, 0.35),
    moon: tint(base.moon, a3, 0.25),
    star: tint(base.star, a3, 0.4),
    cloud: tint(base.cloud, a1, 0.3),
    cloudShadow: tint(base.cloudShadow, a2),
    mountainFar: tint(base.mountainFar, a2),
    mountainNear: tint(base.mountainNear, a2),
    hill: tint(base.hill, a0),
    hillShadow: tint(base.hillShadow, a0),
    grass: tint(base.grass, a0),
    grassShadow: tint(base.grassShadow, a0),
    flowers: base.flowers.map((c, i) => clampChroma(mixHex(c, pal[i % pal.length], 0.4))),
    flowerCenter: tint(base.flowerCenter, a3, 0.3),
    trunk: tint(base.trunk, a0, 0.4),
    trunkShadow: tint(base.trunkShadow, a0, 0.4),
    leaf: tint(base.leaf, a0),
    leafShadow: tint(base.leafShadow, a0),
    cottageWall: tint(base.cottageWall, a1, 0.4),
    cottageRoof: tint(base.cottageRoof, a3),
    cottageDoor: tint(base.cottageDoor, a0, 0.5),
    window: tint(base.window, a3, 0.3),
    smoke: tint(base.smoke, a2, 0.3),
    water: tint(base.water, a2),
    waterShadow: tint(base.waterShadow, a2),
    characterFurs: base.characterFurs,
    cheek: tint(base.cheek, a3, 0.3),
  };
}
