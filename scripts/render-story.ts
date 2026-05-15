#!/usr/bin/env node
/**
 * scripts/render-story.ts
 *
 * Re-render a story.json that was authored by the wizard (or hand-edited).
 *
 *   tsx scripts/render-story.ts books-out/my-book/story.json [--pdf]
 *
 * Outputs SVGs (per page) and optionally a PDF, into the same directory
 * as the story.json. Cheap; deterministic; safe to re-run.
 */

import fs from 'fs';
import path from 'path';

import { renderPage, type Character, type Page } from '../lib/illustrator';
import { seedArtist, type ArtistAnchor } from '../lib/illustrator/artist';
import { renderToPdfBytes } from '../lib/illustrator/print/render-pdf';
import { DEFAULT_KDP_SPEC } from '../lib/illustrator/print/types';
import { defaultDisclosureColophon } from '../lib/illustrator/print/pipeline';

type SavedStory = {
  id: string;
  title: string;
  author: string;
  artistAuthorId: string;
  artistAnchor: ArtistAnchor;
  cast: Character[];
  pages: Page[];
};

async function main() {
  const args = process.argv.slice(2);
  const storyPath = args.find((a) => !a.startsWith('--'));
  if (!storyPath) {
    console.error('Usage: tsx scripts/render-story.ts <story.json> [--pdf]');
    process.exit(2);
  }

  const exportPdf = args.includes('--pdf');
  const outDir = path.dirname(path.resolve(storyPath));

  const story = JSON.parse(fs.readFileSync(storyPath, 'utf-8')) as SavedStory;
  const artist = seedArtist(story.artistAuthorId, { anchor: story.artistAnchor });

  console.log(`Rendering "${story.title}" (${story.pages.length} pages)…`);

  const pdfPages = [];
  for (const page of story.pages) {
    const svg = renderPage(page, story.cast, artist);
    const file = path.join(outDir, `${page.id}.svg`);
    fs.writeFileSync(file, svg);
    pdfPages.push({ id: page.id, svg, caption: page.caption });
    console.log(`  ✎ ${path.basename(file)}`);
  }

  if (exportPdf) {
    console.log('Assembling PDF…');
    const pdfBytes = await renderToPdfBytes({
      title: story.title,
      author: story.author,
      pages: pdfPages,
      spec: DEFAULT_KDP_SPEC,
      rendererVersion: '2026.05.15',
      disclosure: defaultDisclosureColophon({
        title: story.title,
        author: story.author,
        date: new Date().toISOString().slice(0, 10),
      }),
    });
    const pdfPath = path.join(outDir, `${story.id}.pdf`);
    fs.writeFileSync(pdfPath, pdfBytes);
    console.log(`  ✎ ${path.basename(pdfPath)} (${(pdfBytes.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\n✓ Output in ${outDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
