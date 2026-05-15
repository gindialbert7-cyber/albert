/**
 * Example: "Olwyn and the Lost Crown" — 4 pages, owl protagonist.
 *
 * Proof that the renderer works end-to-end for content other than the
 * hardcoded Pip demo. New character (owl), different Artist, built-in
 * props mixed with the existing scenery vocabulary.
 */

import type { Story, Character, Page } from '../../lib/illustrator';

export function olwynStory(): Story {
  const olwyn: Character = {
    id: 'olwyn',
    name: 'Olwyn',
    species: 'owl',
    furColor: '#a07866',
    bellyColor: '#f1dfb8',
    noseColor: '#b67c4a',
    cheekColor: '#e6a890',
    eyeStyle: 'dot-shine',
    build: 'small-round',
    featureTilt: -3,
    scale: 1.05,
    accessory: { kind: 'bowtie', color: '#7a8b6b' },
    seed: 1729,
  };

  const pageDawn: Page = {
    id: '01-tower',
    caption: 'Olwyn lived in a little house at the top of the hill.',
    backdrop: 'meadow',
    mood: 'morning',
    background: [
      { kind: 'sun', x: 650, y: 110, r: 38, rays: true, z: 0 },
      { kind: 'cloud', x: 220, y: 90, w: 80, z: 1 },
      { kind: 'cloud', x: 100, y: 130, w: 50, z: 1 },
      { kind: 'builtin', name: 'cottage', x: 400, y: 460, scale: 1.2, z: 2 },
      { kind: 'tree', x: 110, y: 470, h: 200, z: 2 },
      { kind: 'bird', x: 520, y: 130, scale: 0.9, z: 3 },
    ],
    characters: [
      {
        characterId: 'olwyn',
        pose: {
          facing: 'forward',
          arms: 'down',
          legs: 'stand',
          eyes: 'open',
          mouth: 'smile',
          headTilt: 0,
        },
        placement: { x: 400, y: 540, scale: 0.95 },
      },
    ],
    foreground: [
      { kind: 'builtin', name: 'fence', x: 700, y: 555, scale: 0.85 },
      { kind: 'flower', x: 180, y: 565, scale: 0.95, color: '#d6938e' },
      { kind: 'flower', x: 240, y: 568, scale: 0.85, color: '#e0b76b' },
    ],
  };

  const pageMystery: Page = {
    id: '02-empty-pedestal',
    caption: 'One morning she woke up and her favorite crown was gone.',
    backdrop: 'burrow-interior',
    mood: 'day',
    background: [],
    characters: [
      {
        characterId: 'olwyn',
        pose: {
          facing: 'right',
          arms: 'reach-up',
          legs: 'stand',
          eyes: 'wide',
          mouth: 'open-o',
          headTilt: -4,
        },
        placement: { x: 250, y: 540, scale: 1.0 },
      },
    ],
    foreground: [
      { kind: 'builtin', name: 'book', x: 110, y: 555, scale: 0.85 },
      { kind: 'builtin', name: 'cup', x: 580, y: 555, scale: 0.9 },
      { kind: 'builtin', name: 'lamp-post', x: 680, y: 540, scale: 0.7 },
    ],
  };

  const pageSearch: Page = {
    id: '03-meadow-quest',
    caption: 'So she set off across the meadow to find it.',
    backdrop: 'meadow',
    mood: 'day',
    background: [
      { kind: 'sun', x: 670, y: 100, r: 34, rays: true, z: 0 },
      { kind: 'cloud', x: 180, y: 110, w: 70, z: 1 },
      { kind: 'tree', x: 95, y: 470, h: 200, z: 2 },
      { kind: 'tree', x: 720, y: 480, h: 180, z: 2 },
      { kind: 'bird', x: 480, y: 140, scale: 0.9, z: 3 },
      { kind: 'bird', x: 540, y: 160, scale: 0.7, z: 3 },
    ],
    characters: [
      {
        characterId: 'olwyn',
        pose: {
          facing: 'right',
          arms: 'down',
          legs: 'walk',
          eyes: 'open',
          mouth: 'small',
          headTilt: 3,
        },
        placement: { x: 400, y: 540, scale: 1.0 },
      },
    ],
    foreground: [
      { kind: 'builtin', name: 'picnic-basket', x: 200, y: 560, scale: 0.85 },
      { kind: 'builtin', name: 'mailbox', x: 660, y: 530, scale: 0.85 },
      { kind: 'flower', x: 110, y: 568, scale: 0.9 },
      { kind: 'flower', x: 580, y: 565, scale: 0.85 },
      { kind: 'butterfly', x: 480, y: 380, scale: 1.0 },
    ],
  };

  const pageDiscovery: Page = {
    id: '04-found',
    caption: 'And there it was, gleaming on the apple tree branch all along.',
    backdrop: 'forest-clearing',
    mood: 'forest',
    background: [
      { kind: 'cloud', x: 200, y: 100, w: 60, z: 1 },
    ],
    characters: [
      {
        characterId: 'olwyn',
        pose: {
          facing: 'left',
          arms: 'hugging',
          legs: 'stand',
          eyes: 'wide',
          mouth: 'open-o',
          headTilt: -8,
        },
        placement: { x: 350, y: 540, scale: 1.05 },
      },
    ],
    foreground: [
      { kind: 'builtin', name: 'crown', x: 600, y: 270, scale: 1.1 },
      { kind: 'builtin', name: 'apple', x: 540, y: 350, scale: 1.0 },
      { kind: 'builtin', name: 'apple', x: 660, y: 360, scale: 0.9 },
      { kind: 'flower', x: 130, y: 568, scale: 1.0 },
      { kind: 'butterfly', x: 480, y: 380, scale: 1.0 },
    ],
  };

  return {
    id: 'olwyn',
    title: 'Olwyn and the Lost Crown',
    author: 'A different story, same engine',
    description: 'Four-page demo that proves the renderer works for any content, not just the hardcoded Pip story.',
    cast: [olwyn],
    pages: [pageDawn, pageMystery, pageSearch, pageDiscovery],
  };
}
