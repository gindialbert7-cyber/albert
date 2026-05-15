/**
 * Color palettes tuned for children's-book illustration: warm, slightly
 * desaturated, never pure black — the line color is a soft sepia-brown so
 * everything reads as if drawn with a fine-tip pen on cream paper.
 */

import { Rng, pick } from './rng';

export type Mood = 'day' | 'sunset' | 'night' | 'morning' | 'snow' | 'forest';

export type Palette = {
  mood: Mood;
  paper: string; // background
  ink: string; // outlines
  inkSoft: string; // softer hatching
  sky: [string, string]; // gradient top → bottom
  sun: string;
  sunGlow: string;
  moon: string;
  star: string;
  cloud: string;
  cloudShadow: string;
  mountainFar: string;
  mountainNear: string;
  hill: string;
  hillShadow: string;
  grass: string;
  grassShadow: string;
  flowers: string[]; // petal colors
  flowerCenter: string;
  trunk: string;
  trunkShadow: string;
  leaf: string;
  leafShadow: string;
  cottageWall: string;
  cottageRoof: string;
  cottageDoor: string;
  window: string;
  smoke: string;
  water: string;
  waterShadow: string;
  characterFurs: string[]; // for cute creatures
  cheek: string;
};

const PAPER = '#f6efe1';
const INK = '#39312a';
const INK_SOFT = '#5b4f43';

const PALETTES: Record<Mood, Palette> = {
  day: {
    mood: 'day',
    paper: PAPER,
    ink: INK,
    inkSoft: INK_SOFT,
    sky: ['#cfe7f1', '#eef6f2'],
    sun: '#f6c45a',
    sunGlow: '#fde7a8',
    moon: '#fff7d0',
    star: '#f0d27a',
    cloud: '#fffaf0',
    cloudShadow: '#e2dfd0',
    mountainFar: '#9fb8b6',
    mountainNear: '#7d9a99',
    hill: '#a7c08a',
    hillShadow: '#7a9a64',
    grass: '#bfd28a',
    grassShadow: '#86a25a',
    flowers: ['#e9788b', '#f3a948', '#d3a5d8', '#f7d466', '#ef8b66'],
    flowerCenter: '#fde7a8',
    trunk: '#9c6f3f',
    trunkShadow: '#6e4a25',
    leaf: '#86a766',
    leafShadow: '#5b7c47',
    cottageWall: '#f1d7a4',
    cottageRoof: '#c66b58',
    cottageDoor: '#7e4a31',
    window: '#fde7a8',
    smoke: '#e9e1d2',
    water: '#a9cfd6',
    waterShadow: '#7baab2',
    characterFurs: ['#d8a06b', '#e7c79a', '#a07153', '#cfa57d', '#f0e0c2'],
    cheek: '#f5b6b0',
  },
  sunset: {
    mood: 'sunset',
    paper: PAPER,
    ink: INK,
    inkSoft: INK_SOFT,
    sky: ['#f3a663', '#fbd5a4'],
    sun: '#ed7c4f',
    sunGlow: '#f8c79a',
    moon: '#fff1c2',
    star: '#ffe9a8',
    cloud: '#fbe2c4',
    cloudShadow: '#d6a880',
    mountainFar: '#8a6e7a',
    mountainNear: '#6b5163',
    hill: '#b08864',
    hillShadow: '#7e5d40',
    grass: '#c7a06d',
    grassShadow: '#8e6b3e',
    flowers: ['#c84a5a', '#e58f3e', '#a86fa6', '#e7b94a'],
    flowerCenter: '#fde7a8',
    trunk: '#7a4e2a',
    trunkShadow: '#4f3019',
    leaf: '#a37854',
    leafShadow: '#6e4d34',
    cottageWall: '#e8b884',
    cottageRoof: '#a04a3c',
    cottageDoor: '#5a3320',
    window: '#fde7a8',
    smoke: '#e3cbaa',
    water: '#d39368',
    waterShadow: '#9d6845',
    characterFurs: ['#b87a4f', '#d8a06b', '#8c5a3a', '#e2b889'],
    cheek: '#dc8674',
  },
  night: {
    mood: 'night',
    paper: PAPER,
    ink: INK,
    inkSoft: INK_SOFT,
    sky: ['#2a3960', '#5b6a8a'],
    sun: '#fff1c2',
    sunGlow: '#fde7a8',
    moon: '#fff5c8',
    star: '#fff1a8',
    cloud: '#a4a8c0',
    cloudShadow: '#6f7390',
    mountainFar: '#3e4663',
    mountainNear: '#2c3349',
    hill: '#3f4a52',
    hillShadow: '#252c31',
    grass: '#506050',
    grassShadow: '#324032',
    flowers: ['#a978b4', '#5c7fb0', '#e8c46d'],
    flowerCenter: '#fde7a8',
    trunk: '#3a2a1c',
    trunkShadow: '#1f150c',
    leaf: '#46604c',
    leafShadow: '#28392c',
    cottageWall: '#caa97a',
    cottageRoof: '#7a3c34',
    cottageDoor: '#3a2418',
    window: '#ffd56a',
    smoke: '#a8aabe',
    water: '#3e567a',
    waterShadow: '#243b56',
    characterFurs: ['#8a6a4a', '#b48d63', '#5d4631', '#a78360'],
    cheek: '#c47d76',
  },
  morning: {
    mood: 'morning',
    paper: PAPER,
    ink: INK,
    inkSoft: INK_SOFT,
    sky: ['#f6c8c0', '#f9ebd5'],
    sun: '#f5b454',
    sunGlow: '#fde7a8',
    moon: '#fff5c8',
    star: '#f0d27a',
    cloud: '#fff4ea',
    cloudShadow: '#dec6b8',
    mountainFar: '#a89cae',
    mountainNear: '#7c7388',
    hill: '#b8c98a',
    hillShadow: '#8aa365',
    grass: '#c7d68c',
    grassShadow: '#8aa55b',
    flowers: ['#f08a9b', '#f7c14e', '#cfa3d4', '#f3a25f'],
    flowerCenter: '#fde7a8',
    trunk: '#9a6e40',
    trunkShadow: '#6c4925',
    leaf: '#90b06d',
    leafShadow: '#618348',
    cottageWall: '#f4dba9',
    cottageRoof: '#d68066',
    cottageDoor: '#7e4a31',
    window: '#fde7a8',
    smoke: '#ece2d4',
    water: '#bcd6db',
    waterShadow: '#88b1b8',
    characterFurs: ['#d8a06b', '#e7c79a', '#a07153', '#cfa57d'],
    cheek: '#f5b6b0',
  },
  snow: {
    mood: 'snow',
    paper: '#fbf6ec',
    ink: '#3a342d',
    inkSoft: '#5b5249',
    sky: ['#d6e1ea', '#f1efe7'],
    sun: '#f6d68e',
    sunGlow: '#fde7a8',
    moon: '#fff5c8',
    star: '#cdd9e4',
    cloud: '#ffffff',
    cloudShadow: '#d6dee5',
    mountainFar: '#a7b4c0',
    mountainNear: '#828f9c',
    hill: '#e7eaef',
    hillShadow: '#bcc5cf',
    grass: '#dee5e9',
    grassShadow: '#abbac5',
    flowers: ['#cfe0eb', '#f0c9c2'],
    flowerCenter: '#fde7a8',
    trunk: '#6e4e2e',
    trunkShadow: '#48311a',
    leaf: '#5e7868',
    leafShadow: '#3e5447',
    cottageWall: '#efd9b0',
    cottageRoof: '#a55044',
    cottageDoor: '#5e3a24',
    window: '#ffd56a',
    smoke: '#dadfe5',
    water: '#bccbd6',
    waterShadow: '#8ba1b1',
    characterFurs: ['#ffffff', '#f0f0e6', '#a07153', '#d8c2a0'],
    cheek: '#f3b3aa',
  },
  forest: {
    mood: 'forest',
    paper: PAPER,
    ink: INK,
    inkSoft: INK_SOFT,
    sky: ['#cfe2d2', '#eef3e2'],
    sun: '#f6c45a',
    sunGlow: '#fde7a8',
    moon: '#fff7d0',
    star: '#f0d27a',
    cloud: '#fffaf0',
    cloudShadow: '#cfd2bf',
    mountainFar: '#88a08e',
    mountainNear: '#5f7c6a',
    hill: '#7d9d5f',
    hillShadow: '#506e3d',
    grass: '#a4ba6f',
    grassShadow: '#6f8c44',
    flowers: ['#e2627a', '#f0a040', '#c08acb', '#f4cc4f'],
    flowerCenter: '#fde7a8',
    trunk: '#825027',
    trunkShadow: '#553318',
    leaf: '#5e8245',
    leafShadow: '#3d5a2c',
    cottageWall: '#e8c98c',
    cottageRoof: '#a85a45',
    cottageDoor: '#6b3e22',
    window: '#fde7a8',
    smoke: '#d9d0bf',
    water: '#7eb1aa',
    waterShadow: '#558080',
    characterFurs: ['#a86838', '#cf9560', '#7a4d2c', '#dcb583'],
    cheek: '#e08a7e',
  },
};

export function getPalette(mood: Mood): Palette {
  return PALETTES[mood];
}

export function pickFlowerColor(palette: Palette, rng: Rng): string {
  return pick(rng, palette.flowers);
}

export function pickFur(palette: Palette, rng: Rng): string {
  return pick(rng, palette.characterFurs);
}
