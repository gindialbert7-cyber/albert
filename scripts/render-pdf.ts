#!/usr/bin/env node
/**
 * scripts/render-pdf.ts
 *
 * End-to-end: take a story + Artist, render every page as SVG, then
 * produce a KDP-formatted PDF that prints. Real PDF output today —
 * no stubs.
 *
 *   tsx scripts/render-pdf.ts                      # demo story, default artist
 *   tsx scripts/render-pdf.ts --artist inkbloom --author my-id --out /tmp/book.pdf
 *
 * Defaults: 8x10 portrait, 0.125" bleed, 300dpi raster, sRGB. KDP
 * accepts this format (it converts to CMYK on their side); the
 * pipeline.ts orchestrator adds Ghostscript PDF/X-1a finalization for
 * stricter color guarantees.
 */

import fs from 'fs';
import path from 'path';

import { renderPage } from '../lib/illustrator';
import { seedArtist, type ArtistAnchor } from '../lib/illustrator/artist';
import { DEFAULT_KDP_SPEC, FONT_ALLOWLIST as _FONT_ALLOWLIST } from '../lib/illustrator/print/types';
import { renderToPdfBytes } from '../lib/illustrator/print/render-pdf';
import { defaultDisclosureColophon } from '../lib/illustrator/print/pipeline';
import { sampleStory } from '../examples/illustrator/sample-story';

void _FONT_ALLOWLIST;

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[a.slice(2)] = next;
        i++;
      } else {
        flags[a.slice(2)] = 'true';
      }
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs();
  const outPath = flags.out || '/tmp/pip-book.pdf';
  const authorId = flags.author || 'demo-author';
  const anchor = (flags.anchor as ArtistAnchor) || 'pip';

  const artist = seedArtist(authorId, { anchor });
  const story = sampleStory();

  console.log(`Rendering "${story.title}" as Artist ${artist.id} (anchor: ${artist.anchor}).`);

  // Render each page as SVG.
  const pdfPages = [];
  for (const page of story.pages) {
    const svg = renderPage(page, story.cast, artist);
    pdfPages.push({
      id: page.id,
      svg,
      caption: page.caption,
      side: 'single' as const,
    });
    console.log(`  rendered ${page.id}`);
  }

  // Assemble PDF.
  const meta = {
    title: story.title,
    author: story.author || 'Anonymous',
    date: '2026-05-15',
  };
  console.log(`Assembling PDF (${pdfPages.length} pages + colophon)…`);
  const pdfBytes = await renderToPdfBytes({
    title: story.title,
    author: story.author || 'Anonymous',
    pages: pdfPages,
    spec: DEFAULT_KDP_SPEC,
    rendererVersion: '2026.05.15',
    disclosure: defaultDisclosureColophon(meta),
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`\n✓ Wrote ${pdfBytes.length} bytes → ${outPath}`);
  console.log(`  spec: ${DEFAULT_KDP_SPEC.trim}, bleed ${DEFAULT_KDP_SPEC.bleedInches}", ${DEFAULT_KDP_SPEC.dpi} dpi raster`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
