#!/usr/bin/env node
/**
 * scripts/new-book.ts
 *
 * Interactive book-authoring wizard. Walks a non-technical author
 * through:
 *
 *   1. Pick an artist style (10 anchors, with description)
 *   2. Title + author byline
 *   3. Create one main character (species + colors + accessory)
 *   4. Page-by-page: caption + scene template (which auto-places props)
 *   5. Render every page to SVG + assemble into a real KDP PDF
 *
 * All choices have sensible defaults — pressing Enter through gets
 * you a complete book. The story JSON is saved alongside the PDF so
 * the author can re-render, edit, or pick up later.
 *
 *   tsx scripts/new-book.ts
 */

import fs from 'fs';
import path from 'path';
import { input, select, confirm, number } from '@inquirer/prompts';

import { renderPage, type Character, type Page } from '../lib/illustrator';
import { seedArtist, ALL_ANCHORS, type ArtistAnchor } from '../lib/illustrator/artist';
import { renderToPdfBytes } from '../lib/illustrator/print/render-pdf';
import { DEFAULT_KDP_SPEC } from '../lib/illustrator/print/types';
import { defaultDisclosureColophon } from '../lib/illustrator/print/pipeline';
import { ALL_BUILTIN_PROPS, type BuiltinPropName } from '../lib/illustrator/builtin-props';

// ─── Anchor descriptions ───────────────────────────────────────────────────

const ANCHOR_DESCRIPTIONS: Record<ArtistAnchor, string> = {
  pip: 'soft watercolor, warm warm-brown palette, gentle line — Beatrix Potter family',
  inkbloom: 'luminous watercolor with dissolving edges, restrained palette',
  marrow: 'mixed-media gouache + sketch + collage, saturated accents',
  juniper: 'digital + chalk pastel, muted dusty palette',
  driftwood: 'ink and wash, atmospheric, earthy gray-greens',
  cobble: 'flat shapes + texture, muted earth tones — Klassen family',
  rind: 'cut-paper collage feel, deliberate edges, warm orange-blue',
  kiln: 'risograph-style 2-4 ink, limited palette, retro print look',
  tinder: 'gouache + naïve line, asymmetric shapes, warm storybook',
  thistle: 'scratchy ink + escaped watercolor, blue-red accents — Quentin Blake family',
};

// ─── Scene templates: caption-driven page composition ──────────────────────

type SceneTemplate = {
  id: string;
  description: string;
  backdrop: Page['backdrop'];
  mood: Page['mood'];
  buildPage: (
    pageId: string,
    caption: string,
    characterId: string,
    pose: NonNullable<Page['characters']>[number]['pose'],
  ) => Page;
};

const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    id: 'sunny-meadow',
    description: 'a sunny meadow with flowers and a friendly tree',
    backdrop: 'meadow',
    mood: 'morning',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'meadow',
      mood: 'morning',
      background: [
        { kind: 'sun', x: 650, y: 110, r: 36, rays: true, z: 0 },
        { kind: 'cloud', x: 200, y: 90, w: 80, z: 1 },
        { kind: 'tree', x: 100, y: 470, h: 200, z: 2 },
        { kind: 'bird', x: 520, y: 130, scale: 0.9, z: 3 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 400, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'flower', x: 180, y: 565, scale: 0.95 },
        { kind: 'flower', x: 230, y: 568, scale: 0.85 },
        { kind: 'flower', x: 580, y: 568, scale: 0.9 },
        { kind: 'butterfly', x: 480, y: 380, scale: 1.0 },
      ],
    }),
  },
  {
    id: 'cozy-cottage',
    description: 'a cozy cottage with smoke from the chimney',
    backdrop: 'meadow',
    mood: 'day',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'meadow',
      mood: 'day',
      background: [
        { kind: 'sun', x: 660, y: 100, r: 32, rays: true, z: 0 },
        { kind: 'cloud', x: 220, y: 80, w: 70, z: 1 },
        { kind: 'builtin', name: 'cottage', x: 600, y: 470, scale: 1.0, z: 2 },
        { kind: 'tree', x: 110, y: 470, h: 200, z: 2 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 300, y: 540, scale: 1.05 } }],
      foreground: [
        { kind: 'builtin', name: 'fence', x: 220, y: 555, scale: 0.8 },
        { kind: 'flower', x: 480, y: 568, scale: 0.95 },
      ],
    }),
  },
  {
    id: 'forest-clearing',
    description: 'a forest clearing with mushrooms',
    backdrop: 'forest-clearing',
    mood: 'forest',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'forest-clearing',
      mood: 'forest',
      background: [
        { kind: 'cloud', x: 200, y: 90, w: 60, z: 1 },
        { kind: 'butterfly', x: 130, y: 230, scale: 0.9 },
        { kind: 'butterfly', x: 700, y: 270, scale: 0.85 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 400, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'mushroom', x: 560, y: 555, scale: 1.4, capColor: '#c84a5a', glow: true },
        { kind: 'mushroom', x: 230, y: 565, scale: 1.0 },
        { kind: 'flower', x: 680, y: 568, scale: 0.9 },
      ],
    }),
  },
  {
    id: 'starry-night',
    description: 'a starry night with the moon',
    backdrop: 'night-sky',
    mood: 'night',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'night-sky',
      mood: 'night',
      background: [
        { kind: 'moon', x: 640, y: 120, r: 40, z: 0 },
        { kind: 'cloud', x: 200, y: 180, w: 60, z: 1 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 400, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'flower', x: 150, y: 568, scale: 0.85 },
        { kind: 'flower', x: 680, y: 568, scale: 0.85 },
      ],
    }),
  },
  {
    id: 'sunset-meadow',
    description: 'a quiet sunset over the meadow',
    backdrop: 'meadow-sunset',
    mood: 'sunset',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'meadow-sunset',
      mood: 'sunset',
      background: [
        { kind: 'sun', x: 660, y: 220, r: 50, rays: true, z: 0 },
        { kind: 'cloud', x: 200, y: 130, w: 70, z: 1 },
        { kind: 'tree', x: 120, y: 470, h: 200, z: 2 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 400, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'flower', x: 200, y: 568, scale: 0.95 },
        { kind: 'flower', x: 600, y: 568, scale: 0.85 },
      ],
    }),
  },
  {
    id: 'cozy-interior',
    description: "a cozy room with books, a cup, and a lamp",
    backdrop: 'burrow-interior',
    mood: 'day',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'burrow-interior',
      mood: 'day',
      background: [],
      characters: [{ characterId: cid, pose, placement: { x: 380, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'builtin', name: 'book', x: 130, y: 555, scale: 0.85 },
        { kind: 'builtin', name: 'cup', x: 590, y: 555, scale: 0.9 },
        { kind: 'builtin', name: 'lamp-post', x: 700, y: 540, scale: 0.7 },
      ],
    }),
  },
  {
    id: 'pond-side',
    description: 'a calm pond with rolling hills',
    backdrop: 'pond',
    mood: 'day',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'pond',
      mood: 'day',
      background: [
        { kind: 'sun', x: 650, y: 110, r: 32, rays: true, z: 0 },
        { kind: 'cloud', x: 200, y: 90, w: 70, z: 1 },
        { kind: 'builtin', name: 'sailboat', x: 600, y: 380, scale: 1.0, z: 2 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 300, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'flower', x: 130, y: 568, scale: 0.9 },
      ],
    }),
  },
  {
    id: 'celebration',
    description: 'a celebration with cake, balloons, and a present',
    backdrop: 'meadow',
    mood: 'day',
    buildPage: (id, caption, cid, pose) => ({
      id,
      caption,
      backdrop: 'meadow',
      mood: 'day',
      background: [
        { kind: 'sun', x: 660, y: 110, r: 34, rays: true, z: 0 },
        { kind: 'cloud', x: 200, y: 90, w: 70, z: 1 },
        { kind: 'builtin', name: 'balloon', x: 100, y: 200, scale: 1.2, z: 2 },
        { kind: 'builtin', name: 'balloon', x: 700, y: 180, scale: 1.0, z: 2 },
      ],
      characters: [{ characterId: cid, pose, placement: { x: 400, y: 540, scale: 1.0 } }],
      foreground: [
        { kind: 'builtin', name: 'cake', x: 220, y: 540, scale: 1.0 },
        { kind: 'builtin', name: 'present', x: 600, y: 545, scale: 1.0 },
        { kind: 'flower', x: 540, y: 568, scale: 0.85 },
      ],
    }),
  },
];

// ─── Pose suggestions per emotional beat ──────────────────────────────────

const POSE_PRESETS: Record<
  string,
  NonNullable<Page['characters']>[number]['pose']
> = {
  'walking forward': { facing: 'right', arms: 'down', legs: 'walk', eyes: 'open', mouth: 'smile', headTilt: 3 },
  'standing happily': { facing: 'forward', arms: 'down', legs: 'stand', eyes: 'open', mouth: 'smile', headTilt: 0 },
  'looking up surprised': { facing: 'forward', arms: 'reach-up', legs: 'stand', eyes: 'wide', mouth: 'open-o', headTilt: -8 },
  'sitting quietly': { facing: 'forward', arms: 'hold-front', legs: 'sit', eyes: 'open', mouth: 'small', headTilt: 0 },
  'waving hello': { facing: 'forward', arms: 'wave', legs: 'stand', eyes: 'open', mouth: 'smile', headTilt: 0 },
  'hugging': { facing: 'forward', arms: 'hugging', legs: 'stand', eyes: 'closed', mouth: 'smile', headTilt: 0 },
  'sleepy': { facing: 'forward', arms: 'down', legs: 'stand', eyes: 'closed', mouth: 'small', headTilt: 8 },
};

// ─── Color palettes for characters by species ─────────────────────────────

const SPECIES_PALETTES: Record<
  Character['species'],
  { fur: string; belly: string; cheek: string; nose: string }[]
> = {
  rabbit: [
    { fur: '#d8a06b', belly: '#f4e3c2', cheek: '#f5b6b0', nose: '#c97070' },
    { fur: '#a07153', belly: '#e7c79a', cheek: '#e08a7e', nose: '#9b5a4a' },
    { fur: '#e5d4b3', belly: '#fbf3dc', cheek: '#e9a890', nose: '#c97070' },
    { fur: '#5e4737', belly: '#c0a78c', cheek: '#d68870', nose: '#6e4a3a' },
  ],
  owl: [
    { fur: '#a07866', belly: '#f1dfb8', cheek: '#e6a890', nose: '#b67c4a' },
    { fur: '#7c5d4a', belly: '#dec99e', cheek: '#cf9d80', nose: '#8a5a3a' },
    { fur: '#c8997c', belly: '#f5e3c0', cheek: '#e6a890', nose: '#a3704c' },
  ],
  fox: [{ fur: '#c47446', belly: '#f1dfb8', cheek: '#e29080', nose: '#3a2a1c' }],
  mouse: [{ fur: '#a89889', belly: '#f0e3d0', cheek: '#e08a7e', nose: '#d090a0' }],
};

const ACCESSORY_OPTIONS: Character['accessory'][] = [
  { kind: 'none' },
  { kind: 'scarf', color: '#5b7fb0' },
  { kind: 'scarf', color: '#8e6960' },
  { kind: 'scarf', color: '#a8855b' },
  { kind: 'bowtie', color: '#7a8b6b' },
  { kind: 'bowtie', color: '#a85a5e' },
  { kind: 'flower', color: '#e9788b' },
  { kind: 'flower', color: '#c08acb' },
  { kind: 'hat', color: '#5b7fb0' },
  { kind: 'hat', color: '#7e4a31' },
];

// ─── Main wizard ──────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('  📖  Albert Procedural Illustrator — new book wizard');
  console.log('  ────────────────────────────────────────────────────');
  console.log('');
  console.log('  Press Enter to accept any default. Ctrl+C to quit.');
  console.log('');

  // ── Step 1: Story metadata ──
  const title = await input({
    message: 'Book title:',
    default: 'A Quiet Adventure',
  });
  const author = await input({
    message: 'Author byline:',
    default: 'You',
  });

  // ── Step 2: Artist style ──
  console.log('\n  Pick a visual style — your book\'s "artist":\n');
  for (const a of ALL_ANCHORS) {
    console.log(`    ${a.padEnd(12)}  ${ANCHOR_DESCRIPTIONS[a]}`);
  }
  const anchor = (await select({
    message: 'Style anchor:',
    choices: ALL_ANCHORS.map((a) => ({ name: a, value: a })),
    default: 'pip',
  })) as ArtistAnchor;

  // Author seed
  const authorIdRaw = author.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const authorId = `${authorIdRaw}-${anchor}`;
  const artist = seedArtist(authorId, { anchor });

  // ── Step 3: Character ──
  console.log('\n  Now define your main character.\n');
  const charName = await input({ message: 'Character name:', default: 'Pip' });
  const species = (await select({
    message: 'Species:',
    choices: [
      { name: 'Rabbit', value: 'rabbit' },
      { name: 'Owl', value: 'owl' },
    ],
    default: 'rabbit',
  })) as 'rabbit' | 'owl';

  const palettePool = SPECIES_PALETTES[species];
  const paletteIdx = await select({
    message: 'Color palette:',
    choices: palettePool.map((p, i) => ({
      name: `fur ${p.fur}  belly ${p.belly}  cheek ${p.cheek}`,
      value: i,
    })),
    default: 0,
  });
  const palette = palettePool[paletteIdx];

  const accessoryIdx = await select({
    message: 'Accessory:',
    choices: ACCESSORY_OPTIONS.map((a, i) => ({
      name: a.kind === 'none' ? 'none' : `${a.kind} (${a.color})`,
      value: i,
    })),
    default: 1,
  });
  const accessory = ACCESSORY_OPTIONS[accessoryIdx];

  const character: Character = {
    id: charName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: charName,
    species,
    furColor: palette.fur,
    bellyColor: palette.belly,
    noseColor: palette.nose,
    cheekColor: palette.cheek,
    eyeStyle: 'dot-shine',
    build: 'small-round',
    featureTilt: -3,
    scale: 1.0,
    accessory,
    seed: 1729 + Math.floor(Date.now() % 100000),
  };

  // ── Step 4: Pages ──
  console.log('\n  Now author each page. Pick a scene template + write a caption.\n');
  const pageCount = (await number({
    message: 'How many pages?',
    default: 4,
    min: 1,
    max: 32,
  })) as number;

  const pages: Page[] = [];
  for (let i = 0; i < pageCount; i++) {
    console.log(`\n  ── Page ${i + 1} of ${pageCount} ──`);
    const caption = await input({
      message: `Page ${i + 1} caption:`,
      default: i === 0
        ? `${charName} stepped out into the soft morning light.`
        : i === pageCount - 1
        ? `And so the day grew quiet, and ${charName} smiled.`
        : `${charName} walked on.`,
    });
    const sceneId = await select({
      message: 'Scene:',
      choices: SCENE_TEMPLATES.map((s) => ({ name: s.description, value: s.id })),
      default: i === 0 ? 'sunny-meadow'
        : i === pageCount - 1 ? 'starry-night'
        : SCENE_TEMPLATES[i % SCENE_TEMPLATES.length].id,
    });
    const poseName = await select({
      message: `${charName}'s pose:`,
      choices: Object.keys(POSE_PRESETS).map((k) => ({ name: k, value: k })),
      default: 'walking forward',
    });
    const template = SCENE_TEMPLATES.find((s) => s.id === sceneId)!;
    const page = template.buildPage(
      `page-${String(i + 1).padStart(2, '0')}`,
      caption,
      character.id,
      POSE_PRESETS[poseName],
    );
    pages.push(page);
  }

  // ── Step 5: Output paths ──
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const outDir = await input({
    message: 'Output directory:',
    default: path.join(process.cwd(), 'books-out', slug),
  });
  fs.mkdirSync(outDir, { recursive: true });

  // ── Step 6: Render ──
  console.log('\n  Rendering pages…');
  const pdfPages = [];
  for (const page of pages) {
    const svg = renderPage(page, [character], artist);
    fs.writeFileSync(path.join(outDir, `${page.id}.svg`), svg);
    pdfPages.push({ id: page.id, svg, caption: page.caption });
    console.log(`    ✎ ${page.id}.svg`);
  }

  const exportPdf = await confirm({
    message: 'Export as KDP-ready PDF?',
    default: true,
  });

  if (exportPdf) {
    console.log('  Assembling PDF…');
    const pdfBytes = await renderToPdfBytes({
      title,
      author,
      pages: pdfPages,
      spec: DEFAULT_KDP_SPEC,
      rendererVersion: '2026.05.15',
      disclosure: defaultDisclosureColophon({ title, author, date: new Date().toISOString().slice(0, 10) }),
    });
    const pdfPath = path.join(outDir, `${slug}.pdf`);
    fs.writeFileSync(pdfPath, pdfBytes);
    console.log(`    ✎ ${pdfPath} (${(pdfBytes.length / 1024).toFixed(0)} KB)`);
  }

  // ── Step 7: Save the story JSON for re-render ──
  const storyJson = {
    id: slug,
    title,
    author,
    artistAuthorId: authorId,
    artistAnchor: anchor,
    cast: [character],
    pages,
  };
  fs.writeFileSync(path.join(outDir, 'story.json'), JSON.stringify(storyJson, null, 2));
  console.log(`    ✎ ${path.join(outDir, 'story.json')} (re-render any time)`);

  console.log(`\n  ✓ Done. Your book is in ${outDir}/`);
  console.log('');
  void ALL_BUILTIN_PROPS;
  void ({} as BuiltinPropName);
}

main().catch((err) => {
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ExitPromptError') {
    console.log('\n  Cancelled.');
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
