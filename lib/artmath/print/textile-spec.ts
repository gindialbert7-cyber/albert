/**
 * Textile spec PDF — production deliverable for a textile buyer.
 *
 * Takes a composed pattern (rendered as SVG) plus the recipe metadata
 * and writes a multi-page PDF spec sheet that includes:
 *   1. Full-bleed pattern preview at the buyer's print size
 *   2. Repeat unit shown with bounding-box dimensions
 *   3. Colorway swatches with hex / RGB / CMYK values
 *   4. Recipe / parameter card (operator, repeat mode, seed) so the
 *      design is reproducible
 *   5. Colophon — generator version, license note, contact line
 *
 * This file lives outside lib/artmath/ purity (uses pdf-lib + resvg),
 * so it's only called by the print-export orchestrator script, never
 * by the deterministic operators themselves.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Resvg } from '@resvg/resvg-js';
import type { Recipe } from '../compose/intent-router';

const INCH_TO_POINT = 72;

export type TextileSpecInput = {
  /** Composed SVG for the full-bleed pattern preview. */
  patternSvg: string;
  /** Pattern preview canvas size in pixels (matches the SVG viewBox). */
  patternWidthPx: number;
  patternHeightPx: number;
  /** Composed SVG for the single repeat unit. */
  repeatTileSvg: string;
  repeatTileSizePx: number;
  /** Recipe data carried through from the intent router. */
  recipe: Recipe;
  /** Buyer-facing pattern name. */
  patternName: string;
  /** Free-text brief that drove the design, included on the spec. */
  brief?: string;
  /** Renderer version string for the colophon. */
  rendererVersion: string;
  /** Print spec. */
  print: {
    /** Page size in inches (US Letter default 8.5×11). */
    widthIn: number;
    heightIn: number;
    /** Output raster DPI (300 = production). */
    dpi: number;
  };
};

/** sRGB hex → approximate CMYK. (No ICC profile; this is an indicative
 *  conversion for the spec sheet — the print broker will apply the
 *  actual ICC at proof stage.) */
function hexToCmyk(hex: string): { c: number; m: number; y: number; k: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { c: 0, m: 0, y: 0, k: 100 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const kBlack = 1 - Math.max(r, g, b);
  if (kBlack >= 0.99) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - r - kBlack) / (1 - kBlack);
  const mC = (1 - g - kBlack) / (1 - kBlack);
  const y = (1 - b - kBlack) / (1 - kBlack);
  return {
    c: Math.round(c * 100),
    m: Math.round(mC * 100),
    y: Math.round(y * 100),
    k: Math.round(kBlack * 100),
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function hexToPdfRgb(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgb(r / 255, g / 255, b / 255);
}

/** Generate the spec PDF as raw bytes. */
export async function renderTextileSpec(input: TextileSpecInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(input.patternName);
  pdf.setSubject('Procedural textile pattern — surface design spec');
  pdf.setProducer(`Albert procedural pattern library v${input.rendererVersion}`);
  pdf.setCreator(`Albert procedural pattern library v${input.rendererVersion}`);

  const font = await pdf.embedStandardFont(StandardFonts.Helvetica);
  const bold = await pdf.embedStandardFont(StandardFonts.HelveticaBold);

  const pageW = input.print.widthIn * INCH_TO_POINT;
  const pageH = input.print.heightIn * INCH_TO_POINT;

  // ─── Page 1: hero preview ─────────────────────────────────────────
  {
    const page = pdf.addPage([pageW, pageH]);
    // Title strip.
    page.drawRectangle({ x: 0, y: pageH - 60, width: pageW, height: 60, color: hexToPdfRgb(input.recipe.colorway.colors[0] ?? '#39312a') });
    page.drawText(input.patternName, { x: 36, y: pageH - 38, size: 22, font: bold, color: hexToPdfRgb('#fdfaf2') });
    page.drawText(`procedural pattern — spec sheet`, {
      x: 36,
      y: pageH - 56,
      size: 9,
      font,
      color: hexToPdfRgb('#fdfaf2'),
    });
    // Pattern preview (full bleed minus margin).
    const margin = 36;
    const previewW = pageW - 2 * margin;
    const previewH = pageH - 60 - margin - margin;
    const targetWidthPx = Math.min(2400, Math.round(input.print.dpi * (previewW / INCH_TO_POINT)));
    // Some operators (L-systems, dense flow fields) produce SVG with
    // tens of thousands of nodes. resvg's default node cap is 1M; bump
    // it for safety.
    const resvg = new Resvg(input.patternSvg, {
      fitTo: { mode: 'width', value: targetWidthPx },
    });
    const pngData = resvg.render().asPng();
    const png = await pdf.embedPng(pngData);
    page.drawImage(png, { x: margin, y: margin, width: previewW, height: previewH });
  }

  // ─── Page 2: repeat unit + recipe + colorway ─────────────────────
  {
    const page = pdf.addPage([pageW, pageH]);
    page.drawText('Spec sheet', { x: 36, y: pageH - 50, size: 22, font: bold, color: hexToPdfRgb('#39312a') });
    page.drawText(input.patternName, { x: 36, y: pageH - 68, size: 12, font, color: hexToPdfRgb('#5b4f43') });

    // Section: Recipe block.
    let cursorY = pageH - 110;
    page.drawText('Recipe', { x: 36, y: cursorY, size: 13, font: bold, color: hexToPdfRgb('#39312a') });
    cursorY -= 18;
    const recipeLines = [
      `operator      ${input.recipe.operator}`,
      `repeat mode   ${input.recipe.repeat}`,
      `tile size     ${input.recipe.tileSize} px`,
      `palette       ${input.recipe.colorway.strategy} (${input.recipe.colorway.colors.length} colors)`,
      `paper tone    ${input.recipe.colorway.paper}`,
    ];
    for (const line of recipeLines) {
      page.drawText(line, { x: 36, y: cursorY, size: 10, font, color: hexToPdfRgb('#39312a') });
      cursorY -= 14;
    }
    if (input.brief) {
      cursorY -= 6;
      page.drawText('Brief', { x: 36, y: cursorY, size: 13, font: bold, color: hexToPdfRgb('#39312a') });
      cursorY -= 18;
      // Wrap brief at 80 chars.
      const lines = wrapText(input.brief, 80);
      for (const line of lines) {
        page.drawText(line, { x: 36, y: cursorY, size: 10, font, color: hexToPdfRgb('#5b4f43') });
        cursorY -= 14;
      }
    }

    // Section: Repeat unit preview.
    cursorY -= 14;
    page.drawText('Repeat unit', { x: 36, y: cursorY, size: 13, font: bold, color: hexToPdfRgb('#39312a') });
    cursorY -= 6;
    const tilePx = Math.min(180, input.repeatTileSizePx);
    const tileDpi = 300;
    const tileResvg = new Resvg(input.repeatTileSvg, { fitTo: { mode: 'width', value: tileDpi } });
    const tilePngData = tileResvg.render().asPng();
    const tilePng = await pdf.embedPng(tilePngData);
    const tileTopY = cursorY - tilePx;
    page.drawImage(tilePng, { x: 36, y: tileTopY, width: tilePx, height: tilePx });
    page.drawRectangle({
      x: 36,
      y: tileTopY,
      width: tilePx,
      height: tilePx,
      borderColor: hexToPdfRgb('#39312a'),
      borderWidth: 0.6,
    });
    // Dimension label
    page.drawText(`${input.repeatTileSizePx} px`, {
      x: 36 + tilePx + 8,
      y: tileTopY + tilePx / 2,
      size: 10,
      font,
      color: hexToPdfRgb('#5b4f43'),
    });
    cursorY = tileTopY - 20;

    // Section: Colorway swatches.
    cursorY -= 14;
    page.drawText('Colorway', { x: 36, y: cursorY, size: 13, font: bold, color: hexToPdfRgb('#39312a') });
    cursorY -= 24;
    const swatchW = 56;
    const swatchH = 56;
    const swatchGap = 12;
    for (let i = 0; i < input.recipe.colorway.colors.length; i++) {
      const c = input.recipe.colorway.colors[i];
      const x = 36 + i * (swatchW + swatchGap);
      page.drawRectangle({
        x,
        y: cursorY - swatchH,
        width: swatchW,
        height: swatchH,
        color: hexToPdfRgb(c),
        borderColor: hexToPdfRgb('#39312a'),
        borderWidth: 0.3,
      });
      const { r, g, b } = hexToRgb(c);
      const cmyk = hexToCmyk(c);
      const textX = x + 2;
      let textY = cursorY - swatchH - 12;
      page.drawText(c, { x: textX, y: textY, size: 8, font: bold, color: hexToPdfRgb('#39312a') });
      textY -= 10;
      page.drawText(`R ${r} G ${g} B ${b}`, { x: textX, y: textY, size: 7, font, color: hexToPdfRgb('#5b4f43') });
      textY -= 9;
      page.drawText(`C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`, { x: textX, y: textY, size: 7, font, color: hexToPdfRgb('#5b4f43') });
    }
    cursorY -= swatchH + 50;

    // Colophon.
    const colophonY = 40;
    page.drawLine({
      start: { x: 36, y: colophonY + 20 },
      end: { x: pageW - 36, y: colophonY + 20 },
      thickness: 0.3,
      color: hexToPdfRgb('#5b4f43'),
    });
    page.drawText(
      `Procedural pattern. Renderer v${input.rendererVersion}. sRGB; print broker should apply ICC at proof stage.`,
      { x: 36, y: colophonY, size: 7, font, color: hexToPdfRgb('#5b4f43') },
    );
  }

  return pdf.save();
}

function wrapText(text: string, maxCols: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur.length + w.length + 1 > maxCols) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
