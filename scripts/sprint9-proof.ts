#!/usr/bin/env node
/**
 * scripts/sprint9-proof.ts
 *
 * The point of the whole architecture: the SAME book renders through
 * different Artists into visibly different finished products. Pip
 * stays Pip; the hand around him changes.
 *
 * Renders the existing sample story (Pip and the Glowing Mushroom)
 * through 5 different Artist anchors. Outputs grid SVGs that lay all
 * 3 pages of each Artist's version next to each other.
 */

import fs from 'fs';
import path from 'path';

import { renderPage } from '../lib/illustrator';
import { seedArtist } from '../lib/illustrator/artist';
import { sampleStory } from '../examples/illustrator/sample-story';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : '/tmp/sprint9-proof';
fs.mkdirSync(outDir, { recursive: true });

const story = sampleStory();

const anchors: Array<{ id: string; anchor: import('../lib/illustrator/artist').ArtistAnchor }> = [
  { id: 'author-A', anchor: 'pip' },
  { id: 'author-B', anchor: 'inkbloom' },
  { id: 'author-C', anchor: 'cobble' },
  { id: 'author-D', anchor: 'thistle' },
  { id: 'author-E', anchor: 'tinder' },
];

for (const { id, anchor } of anchors) {
  const artist = seedArtist(id, { anchor });
  const dir = path.join(outDir, id);
  fs.mkdirSync(dir, { recursive: true });
  for (const page of story.pages) {
    const svg = renderPage(page, story.cast, artist);
    fs.writeFileSync(path.join(dir, `${page.id}.svg`), svg);
  }
  // Manifest
  fs.writeFileSync(
    path.join(dir, 'artist.json'),
    JSON.stringify({ id, anchor, artist }, null, 2),
  );
  console.log(`  ✎ ${id} (anchor: ${anchor}) — ${story.pages.length} pages`);
}

console.log(`\nDone. Open ${outDir}/ — each folder is one Artist's rendering of the same story.`);
