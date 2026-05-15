#!/usr/bin/env node
/**
 * scripts/serve-book.ts
 *
 * Starts a minimal HTTP server that displays a rendered book as a
 * browseable preview — left/right page spreads with navigation.
 *
 *   tsx scripts/serve-book.ts books-out/my-book/
 *   tsx scripts/serve-book.ts books-out/my-book/ --port 8765
 *
 * Reads story.json + every page-*.svg in the directory. No bundler,
 * no client-side renderer — just the pages we already drew, in a
 * picture-book reading layout.
 */

import fs from 'fs';
import path from 'path';
import http from 'http';

const args = process.argv.slice(2);
const bookDir = args.find((a) => !a.startsWith('--'));
if (!bookDir) {
  console.error('Usage: tsx scripts/serve-book.ts <book-dir> [--port 8765]');
  process.exit(2);
}

const portIdx = args.indexOf('--port');
const port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 8765;

const dir = path.resolve(bookDir);
const storyPath = path.join(dir, 'story.json');
if (!fs.existsSync(storyPath)) {
  console.error(`No story.json found in ${dir}.`);
  console.error('  (Did you run scripts/new-book.ts or scripts/render-story.ts here?)');
  process.exit(1);
}

type StoredStory = {
  title: string;
  author: string;
  pages: { id: string; caption?: string }[];
};

function loadStory(): StoredStory {
  return JSON.parse(fs.readFileSync(storyPath, 'utf-8'));
}

function renderIndex(): string {
  const story = loadStory();
  const pageItems = story.pages
    .map((p) => {
      const svgPath = path.join(dir, `${p.id}.svg`);
      if (!fs.existsSync(svgPath)) return '';
      const cap = (p.caption ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return `<div class="page">
        <div class="page-frame"><img src="/page/${p.id}" alt="${p.id}"/></div>
        <div class="page-caption">${cap}</div>
        <div class="page-num">page ${story.pages.indexOf(p) + 1} of ${story.pages.length}</div>
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${story.title.replace(/[<&]/g, '')}</title>
<style>
  :root {
    --paper: #f6efe1;
    --ink: #39312a;
    --softink: #5b4f43;
    --shadow: rgba(60,40,20,0.18);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background: #e9dec8;
    color: var(--ink);
    font-family: Georgia, 'Times New Roman', serif;
  }
  .topbar {
    padding: 24px 40px 18px;
    background: linear-gradient(180deg, #f4e9d0, #e9dec8);
    border-bottom: 1px solid #c9bd9f;
  }
  .topbar h1 { margin: 0; font-size: 28px; font-weight: normal; }
  .topbar .byline { margin: 4px 0 0; font-style: italic; color: var(--softink); }
  .topbar .meta { margin: 8px 0 0; font-size: 12px; color: var(--softink); font-family: monospace; }
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 30px 60px;
  }
  .page {
    margin-bottom: 64px;
    text-align: center;
  }
  .page-frame {
    background: var(--paper);
    border-radius: 4px;
    box-shadow: 0 12px 36px var(--shadow);
    padding: 0;
    overflow: hidden;
    display: inline-block;
    max-width: 100%;
  }
  .page-frame img { display: block; max-width: 100%; height: auto; }
  .page-caption {
    margin-top: 18px;
    font-size: 15px;
    font-style: italic;
    color: var(--ink);
  }
  .page-num {
    margin-top: 6px;
    font-size: 11px;
    color: var(--softink);
    font-family: monospace;
  }
  .empty {
    text-align: center;
    padding: 120px 40px;
    color: var(--softink);
  }
  .actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--softink);
  }
  .actions a {
    color: var(--softink);
    text-decoration: underline;
    text-decoration-color: #c9bd9f;
    text-underline-offset: 2px;
  }
</style>
</head>
<body>
  <div class="topbar">
    <h1>${story.title.replace(/[<&]/g, '')}</h1>
    <p class="byline">by ${story.author.replace(/[<&]/g, '')}</p>
    <p class="meta">${story.pages.length} pages · rendered by Albert procedural illustrator · <a href="/story.json">story.json</a></p>
  </div>
  <main>
    ${pageItems || '<div class="empty">No pages found in this directory.</div>'}
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = renderIndex();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
      return;
    }
    if (url.pathname === '/story.json') {
      const body = fs.readFileSync(storyPath);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    }
    const pageMatch = url.pathname.match(/^\/page\/([a-z0-9_-]+)$/i);
    if (pageMatch) {
      const id = pageMatch[1];
      const svgPath = path.join(dir, `${id}.svg`);
      if (!fs.existsSync(svgPath)) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(svgPath));
      return;
    }
    res.writeHead(404);
    res.end('not found');
  } catch (err) {
    res.writeHead(500);
    res.end((err as Error).message);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`📖  ${loadStory().title}`);
  console.log(`    serving at http://127.0.0.1:${port}/`);
  console.log(`    book dir:  ${dir}`);
  console.log(`    (Ctrl+C to stop)`);
});
