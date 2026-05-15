#!/usr/bin/env node
/**
 * scripts/lookbook.ts
 *
 * Build a single comprehensive HTML lookbook page showing the entire
 * pattern library — every operator, every visual proof, the intent
 * router, and brain-parsed brief examples — in one scrollable document.
 *
 * Re-runs the proofs that need to be fresh, then assembles an HTML
 * page with inline SVG (so it's a single shareable artifact).
 *
 *   tsx scripts/lookbook.ts                          # writes /tmp/lookbook.html
 *   tsx scripts/lookbook.ts --out /tmp/site/index.html
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Resvg } from '@resvg/resvg-js';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : '/tmp/lookbook.html';
const outDir = path.dirname(out);
fs.mkdirSync(outDir, { recursive: true });

// Refresh any missing proofs.
function ensureProof(scriptPath: string, sentinelFile: string): void {
  if (!fs.existsSync(sentinelFile)) {
    console.log(`  (refreshing ${path.basename(scriptPath)})`);
    execSync(`npx tsx ${scriptPath}`, { stdio: 'inherit' });
  }
}
ensureProof('scripts/phaseA-proof.ts', '/tmp/phaseA/01-atmospheric.svg');
ensureProof('scripts/phaseB-proof.ts', '/tmp/phaseB/01-wallpaper-groups.svg');
ensureProof('scripts/phaseB-textile.ts', '/tmp/phaseB-textile/spec-fern-forest.svg');
ensureProof('scripts/phaseC-proof.ts', '/tmp/phaseC/01-reaction-diffusion.svg');
ensureProof('scripts/phaseC-portfolio.ts', '/tmp/phaseC-portfolio/portfolio.svg');
ensureProof('scripts/phaseD-proof.ts', '/tmp/phaseD/01-phyllotaxis.svg');

type Section = {
  title: string;
  subtitle: string;
  svgs: { caption: string; path: string }[];
};

const sections: Section[] = [
  {
    title: 'Phase A — Foundation art-math',
    subtitle: 'The five operators that close the gap between procedural illustration and what a trained painter would do. Each was distilled from a master\'s technique, validated against working pieces, and ported to byte-deterministic code.',
    svgs: [
      { caption: 'Atmospheric perspective (Beer-Lambert depth blend)', path: '/tmp/phaseA/01-atmospheric.svg' },
      { caption: 'Sfumato — chromatic Bezier edges in OKLab', path: '/tmp/phaseA/02-sfumato.svg' },
      { caption: 'Sargent value-temperature coupling', path: '/tmp/phaseA/03-sargent-coupling.svg' },
      { caption: 'Bouleau composition armature', path: '/tmp/phaseA/04-armature.svg' },
      { caption: 'Notan value-pattern operators', path: '/tmp/phaseA/05-notan.svg' },
    ],
  },
  {
    title: 'Phase B — Pattern primitives',
    subtitle: 'The first wave of pattern operators. Each covers a different aesthetic axis: lattice symmetry, cellular tessellation, algorithmic botany, and divergence-free flow.',
    svgs: [
      { caption: 'All 17 wallpaper groups (Fedorov 1891)', path: '/tmp/phaseB/01-wallpaper-groups.svg' },
      { caption: 'Voronoi tessellation — raw vs. Lloyd-relaxed CVT', path: '/tmp/phaseB/02-voronoi.svg' },
      { caption: 'L-systems — 5 archetypes', path: '/tmp/phaseB/03-l-systems.svg' },
      { caption: 'Curl-noise flow fields', path: '/tmp/phaseB/04-flow-field.svg' },
    ],
  },
  {
    title: 'Phase B textile — production output',
    subtitle: 'The same motifs delivered as commercial-quality textile spec sheets: 5 repeat modes, 6-colorway pack, hex swatches.',
    svgs: [
      { caption: 'Voronoi motif — Sea Glass', path: '/tmp/phaseB-textile/spec-voronoi-seaglass.svg' },
      { caption: 'Fern sprig — Forest Floor', path: '/tmp/phaseB-textile/spec-fern-forest.svg' },
      { caption: 'Six-petal floral — Spiced Tile', path: '/tmp/phaseB-textile/spec-floral-spiced.svg' },
    ],
  },
  {
    title: 'Phase C — Drawing & texture',
    subtitle: 'Operators with completely orthogonal aesthetics to the pattern primitives.',
    svgs: [
      { caption: 'Reaction-diffusion (Gray-Scott Turing patterns)', path: '/tmp/phaseC/01-reaction-diffusion.svg' },
      { caption: 'Strange attractors — Clifford / de Jong / Svensson', path: '/tmp/phaseC/02-strange-attractors.svg' },
      { caption: 'Stippling — Poisson-disk by density', path: '/tmp/phaseC/03-stippling.svg' },
      { caption: 'Cross-hatching — Dürer / Rembrandt', path: '/tmp/phaseC/04-hatching.svg' },
    ],
  },
  {
    title: 'Phase D — More aesthetic axes',
    subtitle: 'Phyllotaxis spirals, Truchet tessellations, DLA fractals, Penrose tilings.',
    svgs: [
      { caption: 'Phyllotaxis — golden-angle spirals', path: '/tmp/phaseD/01-phyllotaxis.svg' },
      { caption: 'Truchet tiles — 4 variants', path: '/tmp/phaseD/02-truchet.svg' },
      { caption: 'Diffusion-limited aggregation', path: '/tmp/phaseD/03-dla.svg' },
      { caption: 'Penrose P3 tiling', path: '/tmp/phaseD/04-penrose.svg' },
    ],
  },
  {
    title: 'Intent router — design brief → composed output',
    subtitle: 'Six structured design briefs. The router maps mood / density / scale / palette / directionality to operator + repeat + colorway, deterministically.',
    svgs: [
      { caption: 'Six-brief operator-router portfolio', path: '/tmp/phaseC-portfolio/portfolio.svg' },
    ],
  },
];

function svgToDataUrl(p: string, maxWidth: number = 1400): string {
  try {
    const svg = fs.readFileSync(p);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: maxWidth } });
    const png = resvg.render().asPng();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (e) {
    console.warn(`  (skip ${path.basename(p)}: ${(e as Error).message})`);
    return '';
  }
}

let html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Procedural pattern library — lookbook</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --bg: #fbf7ec; --ink: #39312a; --muted: #5b4f43; --accent: #a85a3e; }
  body { background: var(--bg); color: var(--ink); font-family: Georgia, serif; max-width: 1500px; margin: 0 auto; padding: 60px 40px 80px; }
  h1 { font-size: 38px; font-weight: 400; margin-bottom: 8px; }
  .lede { font-style: italic; color: var(--muted); margin-bottom: 12px; max-width: 800px; line-height: 1.5; font-size: 15px; }
  .stats { display: flex; gap: 32px; padding: 16px 0 0; margin: 16px 0 56px; border-top: 1px solid #d8cdb6; }
  .stats div { font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
  .stats strong { color: var(--accent); font-weight: 600; }
  section { margin: 64px 0; }
  section h2 { font-size: 26px; font-weight: 400; margin: 0; }
  section .sub { font-style: italic; color: var(--muted); margin: 6px 0 20px; max-width: 800px; line-height: 1.5; font-size: 14px; }
  figure { margin: 0 0 36px; background: #fdfaf2; padding: 12px; border: 1px solid #d8cdb6; }
  figcaption { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--ink); margin-top: 8px; }
  figure svg, figure img { display: block; max-width: 100%; height: auto; }
  .cli { background: #2a261e; color: #f3ead0; font-family: ui-monospace, Menlo, monospace; font-size: 12px; padding: 12px 16px; margin: 16px 0; line-height: 1.6; border-radius: 2px; overflow: auto; }
  .cli .c { color: #a85a3e; }
  .meta { font-size: 12px; color: var(--muted); margin-top: 80px; padding-top: 24px; border-top: 1px solid #d8cdb6; }
</style>
</head>
<body>
<h1>Procedural pattern library</h1>
<p class="lede">A deterministic, byte-stable image generator built on the math of masterpieces. Every aesthetic property is encoded as parametric code; the same brief renders identically on Linux, macOS, ARM, and x86, today and ten years from now.</p>
<div class="stats">
  <div><strong>27</strong> operators</div>
  <div><strong>17/17</strong> wallpaper groups</div>
  <div><strong>7</strong> colorway strategies</div>
  <div><strong>5</strong> repeat modes</div>
  <div><strong>56/56</strong> CI byte-identical</div>
</div>

<section>
<h2>Try it</h2>
<p class="sub">Either pass a free-text brief or structured flags. Output is deterministic in the seed — same brief and seed always yield the same pixels.</p>
<div class="cli">
  <span class="c">$</span> tsx scripts/pattern.ts --brief "calm sage botanical for a women's silk scarf" --out /tmp/p.png
  <br><span class="c">$</span> tsx scripts/pattern.ts --color "#c25f3e" --mood geometric --palette complementary --out /tmp/p.png
  <br><span class="c">$</span> tsx scripts/pattern.ts --brief "dreamlike painterly indigo, dense" --width 2400 --height 1600 --seed 42 --out /tmp/p.png
</div>
</section>
`;

for (const sec of sections) {
  html += `\n<section>\n<h2>${sec.title}</h2>\n<p class="sub">${sec.subtitle}</p>\n`;
  for (const f of sec.svgs) {
    const dataUrl = svgToDataUrl(f.path);
    if (!dataUrl) continue;
    html += `<figure><img src="${dataUrl}" alt="${f.caption}"><figcaption>${f.caption}</figcaption></figure>\n`;
  }
  html += `</section>\n`;
}

html += `
<div class="meta">
  Determinism: built on a Remez polynomial deterministic-math layer (lib/illustrator/math/det-math.ts) and integer-route number formatting (det-format.ts). The renderer purity boundary is enforced by ESLint (no Math.sin/cos/exp/log/atan, no Date.now, no Intl, no .toFixed, no crypto.subtle, no performance.now anywhere in lib/illustrator or lib/artmath).<br><br>
  All 27 operators emit deterministic SVG fragments; 56 canonical documents are byte-identical to golden hashes across cross-platform CI matrix.
</div>
</body>
</html>
`;

fs.writeFileSync(out, html);
const sizeKB = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`\n✓ Lookbook written to ${out} (${sizeKB} KB)`);
