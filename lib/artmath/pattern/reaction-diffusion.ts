/**
 * Reaction-diffusion (Gray-Scott model) — Turing patterns.
 *
 * Alan Turing's 1952 paper "The Chemical Basis of Morphogenesis"
 * proposed that the patterns on animal coats arise from two reacting
 * chemicals diffusing at different rates. The Gray-Scott formulation
 * (1983) is the most-studied 2-species variant; with the right (f, k)
 * parameters it produces:
 *   - spots ("leopard")
 *   - stripes ("zebra")
 *   - mazes ("brain coral")
 *   - solitons (self-replicating dots)
 *   - "bubbles" (cell-membrane-like rings)
 *
 * Equations:
 *   ∂U/∂t = Du·∇²U − UV² + f·(1 − U)
 *   ∂V/∂t = Dv·∇²V + UV² − (f + k)·V
 *
 * Discretized on a uniform grid with 5-point Laplacian and explicit
 * Euler time stepping. Boundary: wrap (toroidal). Stable for
 * Du = 0.16, Dv = 0.08, dt = 1.0.
 *
 * Output: a 2D grid of normalized "V" concentrations (the activator),
 * which the caller can render as gradient cells, isocontours, or
 * threshold polygons.
 *
 * Sources:
 *   - Turing 1952, "Chemical Basis of Morphogenesis"
 *   - Gray, Scott 1983, "Autocatalytic reactions in the isothermal CSTR"
 *   - Pearson 1993, "Complex patterns in a simple system"
 */

import { fmt2 } from '../../illustrator/math/det-format';
import { mulberry32 } from '../../illustrator/rng';

export type RDPreset = {
  /** Pattern family label. */
  label: 'spots' | 'stripes' | 'maze' | 'soliton' | 'bubbles' | 'mitosis' | 'coral';
  /** Feed rate. Range ~0.01..0.10. */
  f: number;
  /** Kill rate. Range ~0.03..0.07. */
  k: number;
};

/** Curated (f, k) presets giving distinct visual families. */
export const RD_PRESETS: Record<string, RDPreset> = {
  spots:   { label: 'spots',   f: 0.030, k: 0.062 },
  stripes: { label: 'stripes', f: 0.025, k: 0.055 },
  maze:    { label: 'maze',    f: 0.029, k: 0.057 },
  soliton: { label: 'soliton', f: 0.014, k: 0.054 },
  bubbles: { label: 'bubbles', f: 0.090, k: 0.059 },
  mitosis: { label: 'mitosis', f: 0.0367, k: 0.0649 },
  coral:   { label: 'coral',   f: 0.054, k: 0.063 },
};

export type RDOptions = {
  width: number;
  height: number;
  /** Cell side in pixels. Smaller = finer pattern, slower. Default 4. */
  cellSize?: number;
  /** Number of simulation steps. ~4000-8000 needed for stable patterns. */
  steps?: number;
  preset?: keyof typeof RD_PRESETS;
  /** Custom (f, k). Overrides preset if both provided. */
  f?: number;
  k?: number;
  /** Diffusion coefficients. Default Du=0.16, Dv=0.08. */
  Du?: number;
  Dv?: number;
  /** Seed for initial random V perturbations. */
  seed?: number;
};

export type RDField = {
  cols: number;
  rows: number;
  cellSize: number;
  /** Final activator concentration grid, normalized to [0, 1]. */
  v: Float64Array;
};

/** Run Gray-Scott reaction-diffusion to convergence. */
export function reactionDiffusion(opts: RDOptions): RDField {
  const cellSize = opts.cellSize ?? 4;
  const cols = Math.ceil(opts.width / cellSize);
  const rows = Math.ceil(opts.height / cellSize);
  const steps = opts.steps ?? 5000;
  const preset = opts.preset ? RD_PRESETS[opts.preset] : RD_PRESETS.spots;
  const f = opts.f ?? preset.f;
  const k = opts.k ?? preset.k;
  const Du = opts.Du ?? 0.16;
  const Dv = opts.Dv ?? 0.08;
  const dt = 1.0;
  const seed = opts.seed ?? 0xdebd;

  const N = cols * rows;
  const uBuf = new Float64Array(N);
  const vBuf = new Float64Array(N);
  // Initialize: U = 1 everywhere, V = 0, with small seed of V at center.
  for (let i = 0; i < N; i++) uBuf[i] = 1.0;
  let u = uBuf;
  let v = vBuf;
  const rng = mulberry32(seed);
  // Drop several random V-blobs to break symmetry.
  for (let drop = 0; drop < 6; drop++) {
    const cx = Math.floor(rng() * cols);
    const cy = Math.floor(rng() * rows);
    const r = 4 + Math.floor(rng() * 8);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const x = ((cx + dx) % cols + cols) % cols;
        const y = ((cy + dy) % rows + rows) % rows;
        v[y * cols + x] = 1.0;
        u[y * cols + x] = 0.5;
      }
    }
  }
  // Add small uniform noise to break perfect symmetry further.
  for (let i = 0; i < N; i++) {
    v[i] += (rng() - 0.5) * 0.02;
    if (v[i] < 0) v[i] = 0;
  }

  let uNext = new Float64Array(N);
  let vNext = new Float64Array(N);

  for (let step = 0; step < steps; step++) {
    for (let y = 0; y < rows; y++) {
      const yU = y === 0 ? rows - 1 : y - 1;
      const yD = y === rows - 1 ? 0 : y + 1;
      for (let x = 0; x < cols; x++) {
        const xL = x === 0 ? cols - 1 : x - 1;
        const xR = x === cols - 1 ? 0 : x + 1;
        const idx = y * cols + x;
        const ui = u[idx];
        const vi = v[idx];
        const lapU =
          u[y * cols + xL] +
          u[y * cols + xR] +
          u[yU * cols + x] +
          u[yD * cols + x] -
          4 * ui;
        const lapV =
          v[y * cols + xL] +
          v[y * cols + xR] +
          v[yU * cols + x] +
          v[yD * cols + x] -
          4 * vi;
        const uvv = ui * vi * vi;
        uNext[idx] = ui + dt * (Du * lapU - uvv + f * (1 - ui));
        vNext[idx] = vi + dt * (Dv * lapV + uvv - (f + k) * vi);
      }
    }
    // Swap ping-pong buffers.
    const tmpU = u;
    const tmpV = v;
    u = uNext;
    v = vNext;
    uNext = tmpU;
    vNext = tmpV;
  }

  return { cols, rows, cellSize, v };
}

/** Render an RD field as a grid of colored cells. */
export function rdFieldSvg(
  field: RDField,
  opts: {
    colorLow?: string;
    colorHigh?: string;
    threshold?: number; // if set, binarize at this V value
  } = {},
): string {
  const cLo = opts.colorLow ?? '#fbf7ec';
  const cHi = opts.colorHigh ?? '#39312a';
  const thr = opts.threshold;
  const cs = field.cellSize;
  let svg = '';
  for (let y = 0; y < field.rows; y++) {
    for (let x = 0; x < field.cols; x++) {
      let val = field.v[y * field.cols + x];
      if (val < 0) val = 0;
      if (val > 1) val = 1;
      let fill: string;
      if (thr !== undefined) {
        fill = val > thr ? cHi : cLo;
      } else {
        fill = mixHex(cLo, cHi, val);
      }
      svg += `<rect x="${fmt2(x * cs)}" y="${fmt2(y * cs)}" width="${fmt2(cs)}" height="${fmt2(cs)}" fill="${fill}"/>`;
    }
  }
  return svg;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
  const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}
