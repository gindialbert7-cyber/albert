/**
 * Sample story used by `tsx scripts/illustrate.ts demo`.
 *
 * "Pip and the Glowing Mushroom" — three pages and a character sheet.
 * This is also the template for what a hand-authored story file looks
 * like in JSON; the `demo` command serializes this to disk.
 */

import { Story, Character, Page } from '../../lib/illustrator';

export function sampleStory(): Story {
  const pip: Character = {
    id: 'pip',
    name: 'Pip',
    species: 'rabbit',
    furColor: '#d8a06b',
    bellyColor: '#f4e3c2',
    noseColor: '#c97070',
    cheekColor: '#f5b6b0',
    eyeStyle: 'dot-shine',
    build: 'small-round',
    featureTilt: -6,
    scale: 1.0,
    accessory: { kind: 'scarf', color: '#5b7fb0' },
    seed: 4471,
  };

  const mossy: Character = {
    id: 'mossy',
    name: 'Mossy',
    species: 'rabbit',
    furColor: '#a07153',
    bellyColor: '#e7c79a',
    noseColor: '#9b5a4a',
    cheekColor: '#e08a7e',
    eyeStyle: 'dot-shine',
    build: 'plump',
    featureTilt: 4,
    scale: 1.05,
    accessory: { kind: 'flower', color: '#e9788b' },
    seed: 9182,
  };

  const page1: Page = {
    id: '01-dawn',
    caption: 'Pip stepped out of his burrow into the soft morning light.',
    backdrop: 'meadow',
    mood: 'morning',
    background: [
      { kind: 'sun', x: 660, y: 110, r: 38, rays: true, z: 0 },
      { kind: 'cloud', x: 180, y: 100, w: 90, z: 1 },
      { kind: 'cloud', x: 360, y: 70, w: 60, z: 1 },
      { kind: 'tree', x: 90, y: 470, h: 220, z: 2 },
      { kind: 'bird', x: 540, y: 130, scale: 1, z: 3 },
      { kind: 'bird', x: 580, y: 150, scale: 0.8, z: 3 },
    ],
    characters: [
      {
        characterId: 'pip',
        pose: { facing: 'right', arms: 'down', legs: 'stand', eyes: 'open', mouth: 'smile', headTilt: 5 },
        placement: { x: 380, y: 540, scale: 1.05 },
      },
    ],
    foreground: [
      { kind: 'flower', x: 200, y: 560, scale: 1.0, color: '#e9788b' },
      { kind: 'flower', x: 240, y: 565, scale: 0.9, color: '#f3a948' },
      { kind: 'flower', x: 600, y: 555, scale: 1.1, color: '#d3a5d8' },
      { kind: 'flower', x: 640, y: 565, scale: 0.95, color: '#f7d466' },
      { kind: 'butterfly', x: 460, y: 380, scale: 1.0 },
    ],
  };

  const page2: Page = {
    id: '02-clearing',
    caption: 'Deep in the forest, he found a mushroom that glowed like a tiny lantern.',
    backdrop: 'forest-clearing',
    mood: 'forest',
    background: [
      { kind: 'butterfly', x: 130, y: 230, scale: 0.9 },
      { kind: 'butterfly', x: 700, y: 270, scale: 0.85 },
    ],
    characters: [
      {
        characterId: 'pip',
        pose: { facing: 'right', arms: 'reach-up', legs: 'sit', eyes: 'wide', mouth: 'open-o', headTilt: -4 },
        placement: { x: 440, y: 550, scale: 1.0 },
      },
    ],
    foreground: [
      { kind: 'mushroom', x: 560, y: 555, scale: 1.6, capColor: '#f0a040', glow: true },
      { kind: 'mushroom', x: 220, y: 565, scale: 1.0, capColor: '#c84a5a' },
      { kind: 'mushroom', x: 250, y: 558, scale: 0.7, capColor: '#c84a5a' },
      { kind: 'flower', x: 700, y: 568, scale: 1.0, color: '#c08acb' },
    ],
  };

  const page3: Page = {
    id: '03-night',
    caption: 'He carried it home under a quiet, starlit sky — and shared it with his sister Mossy.',
    backdrop: 'night-sky',
    mood: 'night',
    background: [
      { kind: 'moon', x: 640, y: 130, r: 42, z: 0 },
      { kind: 'cloud', x: 200, y: 160, w: 80, z: 1 },
    ],
    characters: [
      {
        characterId: 'pip',
        pose: { facing: 'right', arms: 'hold-front', legs: 'walk', eyes: 'open', mouth: 'smile', headTilt: 0 },
        placement: { x: 320, y: 540, scale: 1.0 },
      },
      {
        characterId: 'mossy',
        pose: { facing: 'left', arms: 'wave', legs: 'stand', eyes: 'open', mouth: 'smile', headTilt: 4 },
        placement: { x: 540, y: 540, scale: 1.0 },
      },
    ],
    foreground: [
      { kind: 'mushroom', x: 320, y: 555, scale: 0.6, capColor: '#f0a040', glow: true },
      { kind: 'flower', x: 150, y: 565, scale: 0.9, color: '#a978b4' },
      { kind: 'flower', x: 690, y: 568, scale: 0.85, color: '#5c7fb0' },
    ],
  };

  return {
    id: 'pip',
    title: 'Pip and the Glowing Mushroom',
    author: 'Drawn by code, on cream paper',
    description: 'A tiny three-page story used as the demo for the procedural illustrator.',
    cast: [pip, mossy],
    pages: [page1, page2, page3],
    updatedAt: 0,
  };
}
