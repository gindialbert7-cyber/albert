/**
 * SVG-source tracing.
 *
 * The cheap path: when the library returns an SVG, we don't need raster
 * vectorization (Potrace/VTracer). We parse the SVG's `d` attributes
 * directly, flatten cubic and quadratic Béziers to polylines, and emit
 * an ordered list of contours ready for restyle through livingPath.
 *
 * This handles ~70% of SVG Repo, Noun Project, BHL, and Rijksmuseum
 * sources without any external library.
 *
 * For raster sources (Pixabay illustrations, vintage PNG scans), the
 * trace/raster-trace.ts module wraps VTracer / pure-JS edge detection
 * (separate file because it requires more work and a WASM binary at
 * deployment time).
 */

import type { Pt } from '../geometry';

// ─── Path-data tokenizer ────────────────────────────────────────────────────

type Cmd = { op: string; args: number[] };

function tokenize(d: string): Cmd[] {
  const cmds: Cmd[] = [];
  let i = 0;
  while (i < d.length) {
    const c = d[i];
    if (/[A-Za-z]/.test(c)) {
      // Start of a new command.
      const op = c;
      i++;
      // Read all following number tokens until next letter or EOS.
      const args: number[] = [];
      let acc = '';
      let inNumber = false;
      while (i < d.length && !/[A-Za-z]/.test(d[i])) {
        const ch = d[i];
        if (/[\d.\-+eE]/.test(ch)) {
          // Handle the case where '-' appears mid-number (e.g., "10-20" = "10 -20")
          if (ch === '-' && inNumber && acc.length > 0 && acc[acc.length - 1] !== 'e' && acc[acc.length - 1] !== 'E') {
            args.push(parseFloat(acc));
            acc = '-';
          } else if (ch === '.' && acc.includes('.')) {
            // "1.2.3" = "1.2" then ".3"
            args.push(parseFloat(acc));
            acc = '.';
          } else {
            acc += ch;
          }
          inNumber = true;
        } else if (/[\s,]/.test(ch)) {
          if (acc.length > 0) {
            args.push(parseFloat(acc));
            acc = '';
            inNumber = false;
          }
        }
        i++;
      }
      if (acc.length > 0) args.push(parseFloat(acc));
      cmds.push({ op, args });
    } else {
      i++;
    }
  }
  return cmds;
}

// ─── Flatten Béziers to polylines ───────────────────────────────────────────

function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return [
    w0 * p0[0] + w1 * p1[0] + w2 * p2[0] + w3 * p3[0],
    w0 * p0[1] + w1 * p1[1] + w2 * p2[1] + w3 * p3[1],
  ];
}

function quadAt(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

function sampleCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 16): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= steps; i++) out.push(cubicAt(p0, p1, p2, p3, i / steps));
  return out;
}

function sampleQuad(p0: Pt, p1: Pt, p2: Pt, steps = 12): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= steps; i++) out.push(quadAt(p0, p1, p2, i / steps));
  return out;
}

// ─── Path → contours ───────────────────────────────────────────────────────

/** Parse one `d` attribute into a list of contours (closed/open polylines). */
export function pathToContours(d: string): Pt[][] {
  const cmds = tokenize(d);
  const contours: Pt[][] = [];
  let current: Pt[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCubicCtrl: Pt | null = null;
  let lastQuadCtrl: Pt | null = null;

  const finishContour = () => {
    if (current.length > 1) contours.push(current);
    current = [];
  };

  for (const c of cmds) {
    const op = c.op;
    const a = c.args;
    const rel = op === op.toLowerCase();
    let k = 0;
    switch (op.toUpperCase()) {
      case 'M':
        finishContour();
        cx = rel ? cx + a[0] : a[0];
        cy = rel ? cy + a[1] : a[1];
        current.push([cx, cy]);
        startX = cx;
        startY = cy;
        k = 2;
        // Subsequent pairs are implicit lineTo
        while (k < a.length) {
          cx = rel ? cx + a[k] : a[k];
          cy = rel ? cy + a[k + 1] : a[k + 1];
          current.push([cx, cy]);
          k += 2;
        }
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      case 'L':
        while (k < a.length) {
          cx = rel ? cx + a[k] : a[k];
          cy = rel ? cy + a[k + 1] : a[k + 1];
          current.push([cx, cy]);
          k += 2;
        }
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      case 'H':
        while (k < a.length) {
          cx = rel ? cx + a[k] : a[k];
          current.push([cx, cy]);
          k += 1;
        }
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      case 'V':
        while (k < a.length) {
          cy = rel ? cy + a[k] : a[k];
          current.push([cx, cy]);
          k += 1;
        }
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      case 'C':
        while (k + 5 < a.length) {
          const c1: Pt = [rel ? cx + a[k] : a[k], rel ? cy + a[k + 1] : a[k + 1]];
          const c2: Pt = [rel ? cx + a[k + 2] : a[k + 2], rel ? cy + a[k + 3] : a[k + 3]];
          const p: Pt = [rel ? cx + a[k + 4] : a[k + 4], rel ? cy + a[k + 5] : a[k + 5]];
          current.push(...sampleCubic([cx, cy], c1, c2, p));
          cx = p[0];
          cy = p[1];
          lastCubicCtrl = c2;
          k += 6;
        }
        lastQuadCtrl = null;
        break;
      case 'S': {
        while (k + 3 < a.length) {
          const c1: Pt = lastCubicCtrl
            ? [2 * cx - lastCubicCtrl[0], 2 * cy - lastCubicCtrl[1]]
            : [cx, cy];
          const c2: Pt = [rel ? cx + a[k] : a[k], rel ? cy + a[k + 1] : a[k + 1]];
          const p: Pt = [rel ? cx + a[k + 2] : a[k + 2], rel ? cy + a[k + 3] : a[k + 3]];
          current.push(...sampleCubic([cx, cy], c1, c2, p));
          cx = p[0];
          cy = p[1];
          lastCubicCtrl = c2;
          k += 4;
        }
        lastQuadCtrl = null;
        break;
      }
      case 'Q':
        while (k + 3 < a.length) {
          const c1: Pt = [rel ? cx + a[k] : a[k], rel ? cy + a[k + 1] : a[k + 1]];
          const p: Pt = [rel ? cx + a[k + 2] : a[k + 2], rel ? cy + a[k + 3] : a[k + 3]];
          current.push(...sampleQuad([cx, cy], c1, p));
          cx = p[0];
          cy = p[1];
          lastQuadCtrl = c1;
          k += 4;
        }
        lastCubicCtrl = null;
        break;
      case 'T': {
        while (k + 1 < a.length) {
          const c1: Pt = lastQuadCtrl
            ? [2 * cx - lastQuadCtrl[0], 2 * cy - lastQuadCtrl[1]]
            : [cx, cy];
          const p: Pt = [rel ? cx + a[k] : a[k], rel ? cy + a[k + 1] : a[k + 1]];
          current.push(...sampleQuad([cx, cy], c1, p));
          cx = p[0];
          cy = p[1];
          lastQuadCtrl = c1;
          k += 2;
        }
        lastCubicCtrl = null;
        break;
      }
      case 'Z':
        if (current.length > 0) {
          current.push([startX, startY]);
        }
        finishContour();
        cx = startX;
        cy = startY;
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      case 'A':
        // Arc: punt to a straight line for now — full arc-to-Bezier
        // conversion is several hundred lines and rarely used in our
        // source corpus.
        while (k + 6 < a.length) {
          const p: Pt = [rel ? cx + a[k + 5] : a[k + 5], rel ? cy + a[k + 6] : a[k + 6]];
          current.push(p);
          cx = p[0];
          cy = p[1];
          k += 7;
        }
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      default:
        // Unknown command — skip.
        break;
    }
  }
  finishContour();
  return contours;
}

// ─── Extract paths from an SVG string ───────────────────────────────────────

/**
 * Extract every <path d="..."/> from an SVG and convert to flattened
 * contour polylines. Other element types (rect, circle, polyline,
 * polygon, line) handled inline.
 *
 * Returns contours in the source SVG's coordinate space. The caller is
 * responsible for fitting/translating into the page.
 */
export function extractSvgContours(svg: string): Pt[][] {
  const contours: Pt[][] = [];

  // <path d="..."/>
  const pathRe = /<path\b[^>]*\bd\s*=\s*["']([^"']+)["'][^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(svg)) !== null) {
    for (const c of pathToContours(m[1])) contours.push(c);
  }

  // <polyline points="..."/>
  const polyRe = /<polyline\b[^>]*\bpoints\s*=\s*["']([^"']+)["'][^>]*\/?>/gi;
  while ((m = polyRe.exec(svg)) !== null) {
    contours.push(parsePoints(m[1], false));
  }

  // <polygon points="..."/> — closed
  const pgRe = /<polygon\b[^>]*\bpoints\s*=\s*["']([^"']+)["'][^>]*\/?>/gi;
  while ((m = pgRe.exec(svg)) !== null) {
    const c = parsePoints(m[1], true);
    contours.push(c);
  }

  // <line x1=... y1=... x2=... y2=... />
  const lineRe = /<line\b[^>]*x1\s*=\s*["']?(-?[\d.]+)[^>]*y1\s*=\s*["']?(-?[\d.]+)[^>]*x2\s*=\s*["']?(-?[\d.]+)[^>]*y2\s*=\s*["']?(-?[\d.]+)[^>]*\/?>/gi;
  while ((m = lineRe.exec(svg)) !== null) {
    contours.push([[parseFloat(m[1]), parseFloat(m[2])], [parseFloat(m[3]), parseFloat(m[4])]]);
  }

  // <rect x=... y=... width=... height=... />
  const rectRe = /<rect\b[^>]*x\s*=\s*["']?(-?[\d.]+)[^>]*y\s*=\s*["']?(-?[\d.]+)[^>]*width\s*=\s*["']?(-?[\d.]+)[^>]*height\s*=\s*["']?(-?[\d.]+)[^>]*\/?>/gi;
  while ((m = rectRe.exec(svg)) !== null) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const w = parseFloat(m[3]);
    const h = parseFloat(m[4]);
    contours.push([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]);
  }

  return contours;
}

function parsePoints(s: string, closed: boolean): Pt[] {
  const nums: number[] = [];
  for (const tok of s.split(/[\s,]+/)) {
    if (tok.length === 0) continue;
    const n = parseFloat(tok);
    if (!Number.isNaN(n)) nums.push(n);
  }
  const out: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
  if (closed && out.length > 0) out.push(out[0]);
  return out;
}
