/**
 * Print-pipeline types.
 *
 * The renderer emits SVG (vector); the print pipeline turns it into
 * KDP-print-ready PDF/X-1a:2001 with embedded CMYK ICC, bleed, trim,
 * font subsets.
 *
 * The pipeline runs OUTSIDE the renderer purity boundary (it needs
 * Ghostscript, lcms2, HarfBuzz, FreeType — all native binaries). The
 * renderer doesn't touch any of these.
 *
 * Stack (per the print-research agent):
 *   SVG generator  →  resvg-js (600dpi internal raster)
 *                  →  HarfBuzz+FreeType via canvaskit-wasm (text shaping)
 *                  →  pdf-lib (page assembly + vector text + metadata)
 *                  →  lcms2 (sRGB → USWebCoatedSWOP CMYK, split intents)
 *                  →  Ghostscript 10.x (PDF/X-1a:2001 finalization)
 *                  →  veraPDF + pdfcpu (validation)
 */

export type KdpTrimSize =
  | '8x10-portrait'
  | '8.5x8.5-square'
  | '10x8-landscape'
  | '8.5x11-portrait'
  | '6x9-portrait';

export type KdpSpec = {
  trim: KdpTrimSize;
  /** Bleed in inches; KDP standard is 0.125". */
  bleedInches: number;
  /** Safe-area margin inside trim in inches; KDP standard is 0.25". */
  safeMarginInches: number;
  /** Gutter inches; varies by page count per KDP spec. */
  gutterInches: number;
  /** Total page count (determines gutter). */
  pageCount: number;
  /** Color profile target. */
  colorProfile: 'USWebCoatedSWOP' | 'CoatedGRACoL2013' | 'Fogra39';
  /** Target raster DPI. Internal raster should be 2× this for downsampling. */
  dpi: number;
};

export const DEFAULT_KDP_SPEC: KdpSpec = {
  trim: '8x10-portrait',
  bleedInches: 0.125,
  safeMarginInches: 0.25,
  gutterInches: 0.375, // 24-150 pages; gets larger for thicker books
  pageCount: 32,
  colorProfile: 'USWebCoatedSWOP',
  dpi: 300,
};

export function gutterForPageCount(pageCount: number): number {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  return 0.75;
}

export type PrintRenderInput = {
  /** Per-page SVG (the renderer's pure output). */
  pageSvgs: { id: string; svg: string }[];
  /** Per-page text content + layout. */
  pageTexts: {
    id: string;
    text: string;
    /** Page-side: 'left' (verso) or 'right' (recto). Used to enforce no-text-in-gutter. */
    side: 'left' | 'right' | 'single';
  }[];
  /** Cover page (full bleed front + spine + back). */
  cover: { svg: string };
  spec: KdpSpec;
  /** Output file path. */
  outPath: string;
  /** Book metadata for PDF dictionary. */
  meta: {
    title: string;
    author: string;
    /** ISO date string. */
    date: string;
    /** Optional KDP disclosure ("AI-assisted procedural illustration"). */
    disclosure?: string;
  };
};

export type PrintRenderResult = {
  /** Did the pipeline succeed? */
  ok: boolean;
  /** Path to the generated PDF. */
  pdfPath?: string;
  /** Validation report from veraPDF + pdfcpu. */
  validation?: {
    pdfXCompliant: boolean;
    fontsAllEmbedded: boolean;
    bleedCorrect: boolean;
    issues: string[];
  };
  /** Pipeline stage that failed, if applicable. */
  failedStage?: 'rasterize' | 'cmyk-convert' | 'pdf-assemble' | 'pdfx-finalize' | 'validate';
  /** Error message. */
  error?: string;
};

/**
 * Font allowlist for commercial PDF embedding.
 *
 * Per the legal audit: open-license fonts are safe for embedding in
 * commercial PDFs that customers resell. Monotype enterprise fonts
 * (Bembo Book, Sabon, Mrs Eaves OT) require a separate $3.5–12.5k/yr
 * server license — defer to a paid tier post-revenue.
 */
export const FONT_ALLOWLIST = {
  body: [
    'EB Garamond',           // Bembo-adjacent humanist serif, OFL
    'Atkinson Hyperlegible', // Inclusive default, OFL+Apache
    'Cormorant Garamond',    // OFL alternative
    'Source Serif Pro',      // Adobe, OFL
    'Spectral',              // Production Type, OFL
  ],
  display: [
    'Playfair Display',
    'Cormorant SC',
    'Inter',
    'Atkinson Hyperlegible',
  ],
  hebrew: ['Frank Ruehl CLM', 'Heebo'],
  arabic: ['Amiri', 'Noto Naskh Arabic'],
  cjk: ['Noto Sans CJK', 'Noto Serif CJK'],
  // Forbidden by default — would produce amateur output.
  blocked: ['Comic Sans MS', 'Papyrus', 'Curlz MT', 'Calibri', 'Brush Script MT'],
};
