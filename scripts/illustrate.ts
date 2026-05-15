#!/usr/bin/env node
/**
 * scripts/illustrate.ts
 *
 * CLI for the procedural children's-book illustrator. Renders a story file
 * (cast + pages) into per-page SVGs plus a character sheet for each cast
 * member. Same input → same output, every run.
 *
 * Usage:
 *   tsx scripts/illustrate.ts render <story.json> [--out <dir>]
 *   tsx scripts/illustrate.ts demo  [--out <dir>]   # render the sample story
 *
 * Output layout for a story with id 'pip':
 *   <out>/pip/sheet-<characterId>.svg
 *   <out>/pip/page-<pageId>.svg
 */

import fs from 'fs';
import path from 'path';

import {
  Story,
  Character,
  renderPage,
  renderCharacterSheet,
} from '../lib/illustrator';

import { sampleStory } from '../examples/illustrator/sample-story';

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const cmd = args[0];
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(a);
    }
  }
  return { cmd, positional, flags };
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function loadStory(file: string): Story {
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as Story;
}

function renderStory(story: Story, outDir: string) {
  const dir = path.join(outDir, story.id);
  ensureDir(dir);

  // Character sheets
  for (const c of story.cast) {
    const svg = renderCharacterSheet(c);
    const file = path.join(dir, `sheet-${c.id}.svg`);
    fs.writeFileSync(file, svg);
    console.log('  ✎ ' + path.relative(process.cwd(), file));
  }

  // Pages
  for (const p of story.pages) {
    const svg = renderPage(p, story.cast);
    const file = path.join(dir, `page-${p.id}.svg`);
    fs.writeFileSync(file, svg);
    console.log('  ✎ ' + path.relative(process.cwd(), file));
  }
}

function main() {
  const { cmd, positional, flags } = parseArgs(process.argv);
  const outDir = path.resolve(flags.out ?? './illustrations-out');

  if (cmd === 'render') {
    const file = positional[0];
    if (!file) {
      console.error('usage: tsx scripts/illustrate.ts render <story.json> [--out dir]');
      process.exit(2);
    }
    const story = loadStory(path.resolve(file));
    console.log(`rendering "${story.title}" → ${path.relative(process.cwd(), outDir)}`);
    renderStory(story, outDir);
    return;
  }

  if (cmd === 'demo') {
    const story = sampleStory();
    console.log(`rendering demo "${story.title}" → ${path.relative(process.cwd(), outDir)}`);
    renderStory(story, outDir);
    // Also drop the story.json so the user can see the format
    const jsonPath = path.join(outDir, story.id, 'story.json');
    fs.writeFileSync(jsonPath, JSON.stringify(story, null, 2));
    console.log('  ✎ ' + path.relative(process.cwd(), jsonPath));
    return;
  }

  console.error(
    [
      'usage:',
      '  tsx scripts/illustrate.ts demo  [--out dir]',
      '  tsx scripts/illustrate.ts render <story.json> [--out dir]',
    ].join('\n'),
  );
  process.exit(2);
}

main();
