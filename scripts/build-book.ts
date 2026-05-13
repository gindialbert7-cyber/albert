#!/usr/bin/env node
/**
 * scripts/build-book.ts
 *
 * Convert a content source (Sefaria ref list, EPUB, or Markdown) into a
 * validated Albert BookDocument JSON file ready for upload-book.ts.
 *
 * Usage:
 *   npm run build-book -- --mode sefaria  --input examples/pirkei-avos.sefaria.yaml
 *   npm run build-book -- --mode epub     --input /path/to/book.epub
 *   npm run build-book -- --mode markdown --input /path/to/book.md
 *
 * Optional:
 *   --out-dir <path>   default: ./books-out
 *
 * Output: ./books-out/<bookId>.book.json
 */

import fs   from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { parse as parseHtml, HTMLElement } from 'node-html-parser';
import { execSync } from 'child_process';
import os from 'os';
import crypto from 'crypto';

import {
  BookDocument,
  BookChapter,
  BookSection,
  SectionType,
  validateBookDocument,
} from '../constants/BookSchema';

// ─── CLI args ──────────────────────────────────────────────────────────────────

interface Args {
  mode:    'sefaria' | 'epub' | 'markdown';
  input:   string;
  outDir:  string;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = { outDir: './books-out' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--mode')    out.mode   = argv[++i] as Args['mode'];
    else if (a === '--input')   out.input  = argv[++i]!;
    else if (a === '--out-dir') out.outDir = argv[++i]!;
  }

  if (!out.mode || !['sefaria', 'epub', 'markdown'].includes(out.mode)) {
    fail('--mode must be one of: sefaria, epub, markdown');
  }
  if (!out.input) fail('--input is required');

  return out as Args;
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// ─── Common helpers ────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[֐-׿]/g, '')   // strip Hebrew
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'chapter';
}

function isHebrewMajority(text: string): boolean {
  const hebrew = (text.match(/[֐-׿]/g) ?? []).length;
  const letters = (text.match(/[\p{L}]/gu) ?? []).length;
  return letters > 0 && hebrew / letters > 0.5;
}

function writeOutput(doc: BookDocument, outDir: string): string {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${doc.id}.book.json`);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf-8');
  return file;
}

// ─── Mode: sefaria ─────────────────────────────────────────────────────────────
//
// Input YAML shape:
//   id, title, hebrewTitle?, subtitle?, description?, category, layoutMode,
//   language, ageGroup, requiresSub, authors[], tags[],
//   chapters: [ { id, title, hebrewTitle?, sefariaRef, pageCount? } ]
//
// Each chapter gets sections: [] — the reader fetches Sefaria at runtime.

interface SefariaConfig {
  id:           string;
  title:        string;
  hebrewTitle?: string;
  subtitle?:    string;
  description?: string;
  category:     string;
  layoutMode:   BookDocument['layoutMode'];
  language:     BookDocument['language'];
  ageGroup:     BookDocument['ageGroup'];
  requiresSub:  boolean;
  authors?:     Array<{ name: string; hebrew?: string; years?: string }>;
  tags?:        string[];
  coverGradient?: [string, string];
  coverAccent?:   string;
  chapters: Array<{
    id?:          string;
    title:        string;
    hebrewTitle?: string;
    sefariaRef:   string;
    pageCount?:   number;
  }>;
}

function buildFromSefaria(inputPath: string): BookDocument {
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const cfg = yaml.load(raw) as SefariaConfig;

  if (!cfg || typeof cfg !== 'object') fail(`Invalid YAML at ${inputPath}`);
  if (!cfg.chapters?.length) fail('sefaria config must have at least one chapter');

  const chapters: BookChapter[] = cfg.chapters.map((ch, i) => ({
    id:           ch.id ?? slugify(ch.title) ?? `ch-${i + 1}`,
    title:        ch.title,
    hebrewTitle:  ch.hebrewTitle,
    sefariaRef:   ch.sefariaRef,
    pageCount:    ch.pageCount ?? 8,
    sections:     [],
  }));

  return {
    id:             cfg.id,
    title:          cfg.title,
    hebrewTitle:    cfg.hebrewTitle,
    subtitle:       cfg.subtitle,
    description:    cfg.description,
    category:       cfg.category,
    layoutMode:     cfg.layoutMode,
    language:       cfg.language,
    ageGroup:       cfg.ageGroup,
    requiresSub:    cfg.requiresSub,
    authors:        (cfg.authors ?? []).map(a => ({
      name:       a.name,
      hebrewName: a.hebrew,
      period:     a.years,
    })),
    coverGradient:  cfg.coverGradient,
    coverAccent:    cfg.coverAccent,
    tags:           cfg.tags ?? [],
    chapters,
  };
}

// ─── Mode: epub ────────────────────────────────────────────────────────────────
//
// Input: a .epub file or an already-unzipped directory. A sibling file
// `book.yaml` provides top-level metadata (id/title/category/etc.) — chapters
// are derived from the OPF spine.

interface EpubMeta {
  id:           string;
  title:        string;
  hebrewTitle?: string;
  subtitle?:    string;
  description?: string;
  category:     string;
  layoutMode:   BookDocument['layoutMode'];
  language:     BookDocument['language'];
  ageGroup:     BookDocument['ageGroup'];
  requiresSub:  boolean;
  authors?:     Array<{ name: string; hebrew?: string; years?: string }>;
  tags?:        string[];
  coverGradient?: [string, string];
  coverAccent?:   string;
}

function buildFromEpub(inputPath: string): BookDocument {
  const stat = fs.statSync(inputPath);
  let rootDir: string;
  let metaPath: string;

  if (stat.isDirectory()) {
    rootDir  = inputPath;
    metaPath = path.join(path.dirname(inputPath), 'book.yaml');
    if (!fs.existsSync(metaPath)) {
      metaPath = path.join(rootDir, 'book.yaml');
    }
  } else if (inputPath.toLowerCase().endsWith('.epub')) {
    // Extract to a temp dir
    const tmp = path.join(os.tmpdir(), `albert-build-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(tmp, { recursive: true });
    extractEpub(inputPath, tmp);
    rootDir  = tmp;
    metaPath = path.join(path.dirname(inputPath), 'book.yaml');
  } else {
    fail(`epub mode: input must be a .epub file or a directory, got: ${inputPath}`);
  }

  if (!fs.existsSync(metaPath)) {
    fail(`epub mode: missing sibling book.yaml at ${metaPath}`);
  }

  const meta = yaml.load(fs.readFileSync(metaPath, 'utf-8')) as EpubMeta;
  if (!meta?.id || !meta?.title) fail('book.yaml must have id and title');

  // 1. Read container.xml to find the OPF
  const containerPath = path.join(rootDir, 'META-INF', 'container.xml');
  if (!fs.existsSync(containerPath)) fail(`Not a valid EPUB — missing META-INF/container.xml`);
  const containerXml = parseHtml(fs.readFileSync(containerPath, 'utf-8'));
  const opfHref = containerXml.querySelector('rootfile')?.getAttribute('full-path');
  if (!opfHref) fail(`container.xml is missing rootfile/full-path`);

  // 2. Parse OPF: manifest items + spine itemrefs
  const opfPath = path.join(rootDir, opfHref);
  const opfDir  = path.dirname(opfPath);
  const opf     = parseHtml(fs.readFileSync(opfPath, 'utf-8'));

  const manifest = new Map<string, string>();
  opf.querySelectorAll('manifest item').forEach(item => {
    const id   = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) manifest.set(id, href);
  });

  const spineIds: string[] = [];
  opf.querySelectorAll('spine itemref').forEach(ref => {
    const idref = ref.getAttribute('idref');
    if (idref) spineIds.push(idref);
  });

  if (spineIds.length === 0) fail(`OPF spine is empty — nothing to extract`);

  // 3. For each spine entry, parse the XHTML body into sections
  const chapters: BookChapter[] = [];
  spineIds.forEach((spineId, i) => {
    const href = manifest.get(spineId);
    if (!href) return;
    const xhtmlPath = path.join(opfDir, href);
    if (!fs.existsSync(xhtmlPath)) return;

    const html  = fs.readFileSync(xhtmlPath, 'utf-8');
    const root  = parseHtml(html);
    const body  = root.querySelector('body') ?? root;

    // Pick a chapter title from the first heading.
    const firstHeading =
      body.querySelector('h1') ??
      body.querySelector('h2') ??
      body.querySelector('h3');
    const titleText = firstHeading?.text?.trim() || `Chapter ${i + 1}`;
    const chId      = slugify(titleText) || `ch-${i + 1}`;

    const sections: BookSection[] = [];
    walkEpub(body, sections);

    if (sections.length === 0) return; // skip empty (e.g. cover-only files)

    chapters.push({
      id:           chId,
      title:        titleText,
      pageCount:    Math.max(1, Math.round(sections.length / 8)),
      sections,
    });
  });

  if (chapters.length === 0) fail(`No chapters extracted from EPUB`);

  return {
    id:             meta.id,
    title:          meta.title,
    hebrewTitle:    meta.hebrewTitle,
    subtitle:       meta.subtitle,
    description:    meta.description,
    category:       meta.category,
    layoutMode:     meta.layoutMode,
    language:       meta.language,
    ageGroup:       meta.ageGroup,
    requiresSub:    meta.requiresSub,
    authors:        (meta.authors ?? []).map(a => ({
      name:       a.name,
      hebrewName: a.hebrew,
      period:     a.years,
    })),
    coverGradient:  meta.coverGradient,
    coverAccent:    meta.coverAccent,
    tags:           meta.tags ?? [],
    chapters,
  };
}

function walkEpub(node: HTMLElement, out: BookSection[]) {
  for (const child of node.childNodes) {
    if (child.nodeType !== 1) continue; // skip text/comment nodes — handled inline
    const el = child as HTMLElement;
    const tag = el.tagName?.toLowerCase();
    const cls = (el.getAttribute('class') ?? '').toLowerCase();
    const dir = (el.getAttribute('dir') ?? '').toLowerCase();
    const text = (el.text ?? '').trim();

    // Headings
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      if (text) out.push({
        type:    'heading',
        level:   (parseInt(tag[1]!, 10) as 1 | 2 | 3),
        content: text,
      });
      continue;
    }

    // Class-driven section types (most specific match wins)
    const classToType: Array<[string, SectionType]> = [
      ['mishnah',       'mishnah'],
      ['gemara',        'gemara'],
      ['rashi',         'rashi'],
      ['tosfos',        'tosfos'],
      ['mefaresh',      'mefaresh'],
      ['pasuk',         'pasuk'],
      ['perek-open',    'perek-open'],
      ['parsha-marker', 'parsha-marker'],
      ['aliyah',        'aliyah'],
    ];
    const matched = classToType.find(([c]) => cls.split(/\s+/).includes(c));
    if (matched) {
      const [, sectionType] = matched;
      const section: BookSection = { type: sectionType };
      if (sectionType !== 'parsha-marker' && sectionType !== 'perek-open') {
        if (text) section.content = text;
      }
      if (sectionType === 'mefaresh') {
        section.speaker = el.getAttribute('data-speaker') ?? 'Commentator';
      }
      if (sectionType === 'pasuk') {
        const ref = el.getAttribute('data-verse');
        const parsed = parseVerseRef(ref);
        if (parsed) section.verse = parsed;
      }
      if (sectionType === 'mishnah' && el.getAttribute('data-verse')) {
        const parsed = parseVerseRef(el.getAttribute('data-verse'));
        if (parsed) section.verse = parsed;
      }
      out.push(section);
      continue;
    }

    // Dividers
    if (tag === 'hr' || cls.includes('divider')) {
      out.push({ type: 'divider' });
      continue;
    }

    // Direction-driven Hebrew vs English
    if (text) {
      if (tag === 'p' || tag === 'div' || tag === 'span' || tag === 'blockquote') {
        if (dir === 'rtl' || isHebrewMajority(text)) {
          out.push({ type: 'hebrew', content: text });
        } else {
          out.push({ type: 'english', content: text });
        }
        continue;
      }
    }

    // Recurse into containers
    if (el.childNodes.length > 0 && !text) {
      walkEpub(el, out);
    }
  }
}

function parseVerseRef(s: string | null | undefined) {
  if (!s) return undefined;
  const m = s.match(/^(\d+):(\d+)$/);
  if (!m) return undefined;
  return { chapter: parseInt(m[1]!, 10), verse: parseInt(m[2]!, 10) };
}

function extractEpub(epubFile: string, outDir: string) {
  // EPUB is just a zip — try the platform's built-in unzip first, then PowerShell.
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${epubFile}' -DestinationPath '${outDir}' -Force"`,
        { stdio: 'pipe' },
      );
    } else {
      execSync(`unzip -o "${epubFile}" -d "${outDir}"`, { stdio: 'pipe' });
    }
  } catch (e: any) {
    fail(`Failed to unzip EPUB: ${e?.message ?? e}`);
  }
}

// ─── Mode: markdown ────────────────────────────────────────────────────────────
//
// YAML frontmatter for book metadata. Chapters separated by lines containing
// only `---chapter---`. Within each chapter:
//   - # Title             → first becomes chapter title
//   - ## / ###            → heading (level 2/3)
//   - ```mishnah          → mishnah block
//   - ```rashi            → rashi block
//   - ```tosfos           → tosfos block
//   - ```mefaresh:SPEAKER → mefaresh block with speaker
//   - ```pasuk:CH:V       → pasuk with verse ref
//   - ```hebrew           → hebrew block
//   - ---                 → divider
//   - paragraph           → hebrew/english based on script majority

function buildFromMarkdown(inputPath: string): BookDocument {
  const raw    = fs.readFileSync(inputPath, 'utf-8');
  const parsed = matter(raw);
  const meta   = parsed.data as EpubMeta;

  if (!meta?.id || !meta?.title) {
    fail('Markdown frontmatter must include id and title');
  }

  const chapterBlocks = parsed.content.split(/^---chapter---\s*$/m)
    .map(s => s.trim())
    .filter(Boolean);

  if (chapterBlocks.length === 0) fail('Markdown has no chapters — separate with `---chapter---`');

  const chapters: BookChapter[] = chapterBlocks.map((block, i) =>
    parseMarkdownChapter(block, i + 1)
  );

  return {
    id:             meta.id,
    title:          meta.title,
    hebrewTitle:    meta.hebrewTitle,
    subtitle:       meta.subtitle,
    description:    meta.description,
    category:       meta.category,
    layoutMode:     meta.layoutMode,
    language:       meta.language,
    ageGroup:       meta.ageGroup,
    requiresSub:    meta.requiresSub,
    authors:        (meta.authors ?? []).map(a => ({
      name:       a.name,
      hebrewName: a.hebrew,
      period:     a.years,
    })),
    coverGradient:  meta.coverGradient,
    coverAccent:    meta.coverAccent,
    tags:           meta.tags ?? [],
    chapters,
  };
}

function parseMarkdownChapter(md: string, idx: number): BookChapter {
  const lines = md.split(/\r?\n/);
  const sections: BookSection[] = [];
  let title: string | undefined;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith('```')) {
        buf.push(lines[i]!);
        i++;
      }
      i++; // consume closing fence
      const content = buf.join('\n').trim();
      const section = sectionFromFence(lang, content);
      if (section) sections.push(section);
      continue;
    }

    // First single-# heading becomes the chapter title
    if (trimmed.startsWith('# ') && !title) {
      title = trimmed.slice(2).trim();
      i++;
      continue;
    }

    // Sub-headings
    if (trimmed.startsWith('### ')) {
      sections.push({ type: 'heading', level: 3, content: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      sections.push({ type: 'heading', level: 2, content: trimmed.slice(3).trim() });
      i++;
      continue;
    }

    // Standalone --- → divider
    if (trimmed === '---') {
      sections.push({ type: 'divider' });
      i++;
      continue;
    }

    // Paragraph: accumulate until blank line
    if (trimmed.length > 0) {
      const buf: string[] = [trimmed];
      i++;
      while (i < lines.length && lines[i]!.trim().length > 0 && !looksLikeMarker(lines[i]!.trim())) {
        buf.push(lines[i]!.trim());
        i++;
      }
      const paragraph = buf.join(' ');
      sections.push({
        type:    isHebrewMajority(paragraph) ? 'hebrew' : 'english',
        content: paragraph,
      });
      continue;
    }

    i++;
  }

  const finalTitle = title ?? `Chapter ${idx}`;
  return {
    id:           slugify(finalTitle) || `ch-${idx}`,
    title:        finalTitle,
    pageCount:    Math.max(1, Math.round(sections.length / 8)),
    sections,
  };
}

function looksLikeMarker(s: string): boolean {
  return s.startsWith('#') || s.startsWith('```') || s === '---';
}

function sectionFromFence(lang: string, content: string): BookSection | null {
  if (!content) return null;
  const lower = lang.toLowerCase();

  if (lower === 'mishnah')  return { type: 'mishnah',  content };
  if (lower === 'gemara')   return { type: 'gemara',   content };
  if (lower === 'rashi')    return { type: 'rashi',    content };
  if (lower === 'tosfos')   return { type: 'tosfos',   content };
  if (lower === 'hebrew')   return { type: 'hebrew',   content };

  // mefaresh:SPEAKER
  if (lower.startsWith('mefaresh')) {
    const speaker = lang.includes(':') ? lang.split(':')[1]!.trim() : 'Commentator';
    return { type: 'mefaresh', speaker, content };
  }

  // pasuk:CH:V
  if (lower.startsWith('pasuk')) {
    const parts = lang.split(':');
    const ch = parseInt(parts[1] ?? '', 10);
    const v  = parseInt(parts[2] ?? '', 10);
    const section: BookSection = { type: 'pasuk', content };
    if (Number.isFinite(ch) && Number.isFinite(v)) {
      section.verse = { chapter: ch, verse: v };
    }
    return section;
  }

  // Unknown fence — render as english by default
  return { type: 'english', content };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`\n📚 build-book — mode: ${args.mode}`);
  console.log(`   input: ${args.input}`);

  let doc: BookDocument;
  switch (args.mode) {
    case 'sefaria':  doc = buildFromSefaria(args.input);  break;
    case 'epub':     doc = buildFromEpub(args.input);     break;
    case 'markdown': doc = buildFromMarkdown(args.input); break;
  }

  const validation = validateBookDocument(doc);
  if (!validation.valid) {
    console.error('\n✗ Built document failed validation:');
    validation.errors.forEach(e => console.error(`   • ${e}`));
    process.exit(1);
  }
  validation.warnings.forEach(w => console.warn(`⚠  ${w}`));

  const outFile = writeOutput(doc, args.outDir);
  const totalSections = doc.chapters.reduce((s, c) => s + c.sections.length, 0);
  console.log(`\n✓ ${doc.id} — ${doc.chapters.length} chapter(s), ${totalSections} total section(s)`);
  console.log(`   wrote ${outFile}\n`);
}

main();
