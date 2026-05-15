/**
 * Print pipeline orchestrator.
 *
 * The renderer emits per-page SVG. This module orchestrates SVG → PDF/X-1a:2001
 * conversion via the named stack. Each stage is a typed function with a
 * stub implementation that throws "not wired up." Production wiring:
 *
 *   1. `npm install pdf-lib @resvg/resvg-js sharp` — pure-JS rasterize +
 *      PDF assembly. Works in Node without native deps.
 *   2. Install Ghostscript 10.x on the server for PDF/X-1a finalization.
 *   3. Install veraPDF + pdfcpu for validation.
 *   4. Drop an ICC profile (USWebCoatedSWOP_v2.icc) on the server filesystem.
 *
 * The pipeline lives OUTSIDE the renderer purity boundary. The
 * renderer doesn't import this file.
 *
 * The watercolor-wobble-at-print-resolution discipline (sqrt-scale, not
 * linear) is handled by the renderer when given the print DPI as input
 * — see the dpi parameter in the page-render entry point.
 */

import type {
  PrintRenderInput,
  PrintRenderResult,
  KdpSpec,
  KdpTrimSize,
} from './types';
import { gutterForPageCount, FONT_ALLOWLIST } from './types';

// ─── Pre-flight: bleed/safe-area validation ───────────────────────────────

const TRIM_DIMS_IN: Record<KdpTrimSize, { wIn: number; hIn: number }> = {
  '8x10-portrait': { wIn: 8, hIn: 10 },
  '8.5x8.5-square': { wIn: 8.5, hIn: 8.5 },
  '10x8-landscape': { wIn: 10, hIn: 8 },
  '8.5x11-portrait': { wIn: 8.5, hIn: 11 },
  '6x9-portrait': { wIn: 6, hIn: 9 },
};

export function trimDimensions(spec: KdpSpec) {
  const t = TRIM_DIMS_IN[spec.trim];
  return {
    pageWidthIn: t.wIn + spec.bleedInches * 2,
    pageHeightIn: t.hIn + spec.bleedInches * 2,
    trimWidthIn: t.wIn,
    trimHeightIn: t.hIn,
    safeWidthIn: t.wIn - spec.safeMarginInches * 2 - gutterForPageCount(spec.pageCount),
    safeHeightIn: t.hIn - spec.safeMarginInches * 2,
  };
}

// ─── Stage 1: rasterize SVG → 600dpi PNG ──────────────────────────────────

/**
 * Stub: in production, call `@resvg/resvg-js` to rasterize each page
 * SVG at 2× target DPI for downsample headroom. Returns raw PNG bytes.
 */
export async function rasterizeSvg(_svg: string, _dpi: number): Promise<Uint8Array> {
  throw new Error('rasterizeSvg: not wired up. npm install @resvg/resvg-js and replace this stub.');
}

// ─── Stage 2: sRGB → CMYK via lcms2 ──────────────────────────────────────

/**
 * Stub: convert sRGB PNG to CMYK via lcms2 (the `lcms2` Node binding or
 * `sharp` with ICC profiles). Split rendering intents: relative-
 * colorimetric for line/text layers, perceptual for illustration.
 *
 * Ink-limit cap (TAC 280%) applied here to prevent print-press bleed-
 * through on dark areas.
 */
export async function srgbToCmyk(
  _pngBytes: Uint8Array,
  _profile: KdpSpec['colorProfile'],
): Promise<Uint8Array> {
  throw new Error('srgbToCmyk: not wired up. Install lcms2 bindings + the USWebCoatedSWOP_v2.icc profile.');
}

// ─── Stage 3: assemble pages into a PDF (pdf-lib + vector text overlay) ───

/**
 * Stub: build the full PDF document. Each page gets:
 *   - background: the CMYK-converted illustration raster at exact trim
 *     dimensions with bleed offset
 *   - text overlay: vector text from pdf-lib with embedded subset fonts,
 *     positioned via the saliency-aware composer's text_reserve_mask
 *   - metadata: title, author, subject, KDP disclosure colophon,
 *     CreationDate, ModDate (UTC)
 *
 * Multi-script text shaping handled by HarfBuzz via canvaskit-wasm.
 */
export async function assemblePdf(
  _input: PrintRenderInput,
  _cmykPageRasters: Uint8Array[],
): Promise<Uint8Array> {
  throw new Error('assemblePdf: not wired up. npm install pdf-lib canvaskit-wasm.');
}

// ─── Stage 4: PDF/X-1a:2001 finalization via Ghostscript ─────────────────

/**
 * Stub: invoke Ghostscript with -dPDFX -sColorConversionStrategy=CMYK
 * -sOutputICCProfile=USWebCoatedSWOP.icc to upgrade the assembled PDF
 * to PDF/X-1a:2001 compliance. Required for KDP print acceptance.
 */
export async function finalizePdfX(_pdfBytes: Uint8Array, _spec: KdpSpec): Promise<Uint8Array> {
  throw new Error('finalizePdfX: not wired up. Install Ghostscript 10.x on server.');
}

// ─── Stage 5: validate ────────────────────────────────────────────────────

/**
 * Stub: run veraPDF (PDF/X compliance) + pdfcpu (bleed/trim box
 * verification) on the finalized PDF. Returns the validation report.
 */
export async function validatePdfX(_pdfBytes: Uint8Array): Promise<PrintRenderResult['validation']> {
  throw new Error('validatePdfX: not wired up. Install veraPDF + pdfcpu binaries.');
}

// ─── Orchestrator ────────────────────────────────────────────────────────

export async function renderToPrint(input: PrintRenderInput): Promise<PrintRenderResult> {
  // 1. Pre-flight: font + bleed checks.
  const dims = trimDimensions(input.spec);
  if (dims.safeWidthIn < 4 || dims.safeHeightIn < 4) {
    return { ok: false, error: `Safe area too small: ${dims.safeWidthIn}×${dims.safeHeightIn} in. Check bleed + margin + gutter.` };
  }
  for (const f of [/* future: iterate any font set we use here */]) {
    if (FONT_ALLOWLIST.blocked.includes(f as string)) {
      return { ok: false, error: `Font ${f} is on the blocklist (amateur-tell).` };
    }
  }

  // 2. Per-page raster
  let cmykPageRasters: Uint8Array[];
  try {
    cmykPageRasters = [];
    for (const page of input.pageSvgs) {
      const png = await rasterizeSvg(page.svg, input.spec.dpi * 2);
      const cmyk = await srgbToCmyk(png, input.spec.colorProfile);
      cmykPageRasters.push(cmyk);
    }
  } catch (e) {
    return { ok: false, failedStage: 'rasterize', error: (e as Error).message };
  }

  // 3. Assemble PDF
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await assemblePdf(input, cmykPageRasters);
  } catch (e) {
    return { ok: false, failedStage: 'pdf-assemble', error: (e as Error).message };
  }

  // 4. Finalize to PDF/X-1a
  let finalizedBytes: Uint8Array;
  try {
    finalizedBytes = await finalizePdfX(pdfBytes, input.spec);
  } catch (e) {
    return { ok: false, failedStage: 'pdfx-finalize', error: (e as Error).message };
  }

  // 5. Validate
  let validation: PrintRenderResult['validation'];
  try {
    validation = await validatePdfX(finalizedBytes);
  } catch (e) {
    return { ok: false, failedStage: 'validate', error: (e as Error).message };
  }

  // 6. Write file (caller-supplied path).
  // In production: `fs.writeFile(input.outPath, finalizedBytes)`.
  return { ok: true, pdfPath: input.outPath, validation };
}

// ─── KDP disclosure + colophon helpers ────────────────────────────────────

/**
 * The KDP-disclosure colophon page text. Per the legal audit, framed as
 * "AI-assisted procedural illustration" (not "AI-generated"), to match
 * how KDP describes the AI-assisted category. Important for both KDP
 * human-reviewer disposition and customer copyright registration.
 */
export function defaultDisclosureColophon(meta: PrintRenderInput['meta']): string {
  const year = meta.date.slice(0, 4);
  return [
    `${meta.title}`,
    `By ${meta.author}, ${year}.`,
    '',
    'Procedural illustration created with deterministic vector code.',
    'Character parameters and page composition authored by the human;',
    'rendering performed by procedural software (not a generative image',
    'model). AI-assisted under KDP Content Guidelines.',
    '',
    'Renderer-output-version: 2026.05.15',
  ].join('\n');
}
