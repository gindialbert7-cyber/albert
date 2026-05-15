/**
 * Intent router — turn high-level design intent into operator selection.
 *
 * This is the layer that sits between (1) a natural-language brief from
 * a buyer or AI brain and (2) the procedural operators in lib/artmath/.
 * Given a structured `DesignIntent` (mood, density, scale, palette,
 * directionality), it returns a `Recipe` describing which operator(s)
 * to invoke and with what parameters.
 *
 * The router is intentionally deterministic given its inputs — same
 * intent + same seed → same recipe → same byte-identical SVG. The
 * randomness available to the recipe comes only through the seed.
 *
 * In production this router can be wrapped by an LLM brain that emits
 * a structured `DesignIntent` from free-text. Today we ship the
 * rules-based version so the architecture is operational without any
 * LLM round trip — a feature flag, not a dependency.
 */

import { wallpaperPattern, type WallpaperGroup } from '../pattern/wallpaper-groups';
import { voronoi, voronoiSvg } from '../pattern/voronoi';
import {
  archetype as lArch,
  derive,
  turtle,
  lSystemSvg,
} from '../pattern/l-system';
import { flowField, flowFieldSvg } from '../pattern/flow-field';
import {
  reactionDiffusion,
  rdFieldSvg,
} from '../pattern/reaction-diffusion';
import { iterateAttractor, attractorSvg } from '../pattern/strange-attractors';
import { stipple, stippleSvg, blobsDensity } from '../pattern/stippling';
import { repeatTile, type RepeatMode } from '../pattern/repeat-modes';
import { colorway, type Colorway, type Strategy } from '../color/colorway';
import { mulberry32, type Rng } from '../../illustrator/rng';
import { fmt2 } from '../../illustrator/math/det-format';

export type Mood = 'organic' | 'geometric' | 'painterly' | 'editorial' | 'botanical' | 'meditative';
export type Density = 'sparse' | 'medium' | 'dense';
export type Scale = 'small' | 'medium' | 'large';
export type Directionality = 'omni' | 'horizontal' | 'vertical' | 'radial' | 'diagonal';

export type DesignIntent = {
  /** Overall feel. Drives operator choice. */
  mood: Mood;
  /** Visual density. Drives parameters within the chosen operator. */
  density: Density;
  /** Motif scale relative to canvas. */
  scale: Scale;
  /** Directionality / movement. */
  directionality?: Directionality;
  /** Key color in hex (drives colorway). */
  keyColor: string;
  /** Color harmony strategy. Default 'analogous'. */
  paletteStrategy?: Strategy;
  /** Canvas dimensions in pixels. */
  width: number;
  height: number;
  /** Deterministic seed. */
  seed?: number;
  /** When true, force a single repeat tile rather than full canvas
   *  composition. Default false. */
  asTile?: boolean;
};

export type Recipe = {
  operator:
    | 'wallpaper'
    | 'voronoi'
    | 'l-system'
    | 'flow-field'
    | 'reaction-diffusion'
    | 'attractor'
    | 'stippling';
  /** Repeat mode applied to the operator output. */
  repeat: RepeatMode;
  /** Tile size in pixels for repeat sampling (only used when repeating). */
  tileSize: number;
  /** Operator-specific parameter bag. */
  params: Record<string, unknown>;
  /** Colorway derived from the intent. */
  colorway: Colorway;
};

/** Map an intent to a recipe (deterministic, rule-based). */
export function intentToRecipe(intent: DesignIntent): Recipe {
  const seed = intent.seed ?? 0xa770;
  const rng = mulberry32(seed);
  const cw = colorway(intent.keyColor, intent.paletteStrategy ?? 'analogous');

  // Operator choice by mood (with a touch of seeded variety).
  const moodToOperator: Record<Mood, Recipe['operator'][]> = {
    organic: ['voronoi', 'reaction-diffusion', 'flow-field'],
    geometric: ['wallpaper', 'voronoi'],
    painterly: ['flow-field', 'attractor', 'stippling'],
    editorial: ['attractor', 'stippling', 'l-system'],
    botanical: ['l-system', 'reaction-diffusion'],
    meditative: ['wallpaper', 'flow-field'],
  };
  const ops = moodToOperator[intent.mood];
  const operator = ops[Math.floor(rng() * ops.length)];

  // Tile size by scale.
  const tileSize = intent.scale === 'small' ? 56 : intent.scale === 'large' ? 140 : 90;

  // Repeat mode preference by mood / directionality.
  let repeat: RepeatMode = 'half-drop';
  if (intent.mood === 'geometric') repeat = 'straight';
  else if (intent.mood === 'meditative') repeat = 'ogival';
  else if (intent.directionality === 'horizontal') repeat = 'brick';
  else if (intent.directionality === 'omni') repeat = 'mirror';

  // Operator-specific params keyed off density.
  const params: Record<string, unknown> = {};
  switch (operator) {
    case 'wallpaper': {
      const groups: WallpaperGroup[] = ['p1', 'p2', 'pmm', 'p4m', 'p6m'];
      params.group = groups[Math.floor(rng() * groups.length)];
      break;
    }
    case 'voronoi': {
      params.count =
        intent.density === 'sparse' ? 15 : intent.density === 'dense' ? 45 : 28;
      params.relax = 3;
      break;
    }
    case 'l-system': {
      const archs = ['fern', 'tree', 'plant'] as const;
      params.archetype = archs[Math.floor(rng() * archs.length)];
      params.scale = intent.density === 'sparse' ? 3 : intent.density === 'dense' ? 5 : 4;
      break;
    }
    case 'flow-field': {
      params.freq = intent.density === 'sparse' ? 0.002 : intent.density === 'dense' ? 0.015 : 0.006;
      params.lines = intent.density === 'sparse' ? 70 : intent.density === 'dense' ? 240 : 150;
      params.separation = intent.density === 'dense' ? 5 : 10;
      break;
    }
    case 'reaction-diffusion': {
      const presets = ['spots', 'stripes', 'maze', 'coral'] as const;
      params.preset = presets[Math.floor(rng() * presets.length)];
      params.steps = 4000;
      break;
    }
    case 'attractor': {
      const presets = ['cliffordA', 'cliffordB', 'dejongB', 'svenssonA'] as const;
      params.preset = presets[Math.floor(rng() * presets.length)];
      break;
    }
    case 'stippling': {
      params.totalDots =
        intent.density === 'sparse' ? 600 : intent.density === 'dense' ? 4000 : 1600;
      break;
    }
  }

  return { operator, repeat, tileSize, params, colorway: cw };
}

/** Operators that produce canvas-wide compositions (not tile-able). */
const CANVAS_WIDE: Recipe['operator'][] = ['flow-field', 'attractor', 'stippling', 'reaction-diffusion'];

/** Render a recipe to an SVG fragment. The `_rng` carries through so
 *  per-stamp variation is deterministic. */
export function renderRecipe(recipe: Recipe, intent: DesignIntent): string {
  const W = intent.width;
  const H = intent.height;
  const seed = intent.seed ?? 0xa770;
  const cw = recipe.colorway;

  // For canvas-wide operators, render once at full size.
  if (CANVAS_WIDE.includes(recipe.operator)) {
    return renderCanvasWide(recipe, intent);
  }

  // Build a single-tile renderer for each operator.
  const tileRenderer = (rng: Rng, tw: number, th: number): string => {
    switch (recipe.operator) {
      case 'wallpaper': {
        const grp = (recipe.params.group as WallpaperGroup) ?? 'p4m';
        return wallpaperPattern(
          (innerRng, innerSize) => {
            const c1 = cw.colors[Math.floor(innerRng() * cw.colors.length)];
            const c2 = cw.colors[Math.floor(innerRng() * cw.colors.length)];
            return (
              `<circle cx="${fmt2(innerSize * 0.5)}" cy="${fmt2(innerSize * 0.5)}" r="${fmt2(innerSize * 0.32)}" fill="${c1}" opacity="0.85"/>` +
              `<circle cx="${fmt2(innerSize * 0.5)}" cy="${fmt2(innerSize * 0.5)}" r="${fmt2(innerSize * 0.13)}" fill="${c2}"/>`
            );
          },
          {
            group: grp,
            canvasW: tw,
            canvasH: th,
            tileSize: tw / 3,
            seed: Math.floor(rng() * 0xffff),
          },
        );
      }
      case 'voronoi': {
        const cells = voronoi({
          count: recipe.params.count as number,
          width: tw,
          height: th,
          seed: Math.floor(rng() * 0xffff),
          stride: 3,
          relax: recipe.params.relax as number,
        });
        return (
          `<rect width="${tw}" height="${th}" fill="${cw.paper}"/>` +
          voronoiSvg(
            cells,
            (_cell, innerRng) => cw.colors[Math.floor(innerRng() * cw.colors.length)],
            { stroke: cw.colors[0], strokeWidth: 0.5, seed: Math.floor(rng() * 0xffff) },
          )
        );
      }
      case 'l-system': {
        const sys = lArch(recipe.params.archetype as 'fern' | 'tree' | 'plant', recipe.params.scale as number);
        const str = derive(sys, Math.floor(rng() * 0xffff));
        const segments = turtle(str, sys, {
          x: tw / 2,
          y: th * 0.96,
          heading: -Math.PI / 2,
        });
        return (
          `<rect width="${tw}" height="${th}" fill="${cw.paper}"/>` +
          lSystemSvg(segments, {
            stroke: cw.colors[1] ?? cw.colors[0],
            strokeWidth: 1.3,
            leafWidth: 0.3,
          })
        );
      }
      case 'flow-field': {
        const lines = flowField({
          width: tw,
          height: th,
          freq: recipe.params.freq as number,
          seed: Math.floor(rng() * 0xffff),
          lines: recipe.params.lines as number,
          maxSteps: 500,
          stepLen: 1.4,
          separation: recipe.params.separation as number,
        });
        let inner = `<rect width="${tw}" height="${th}" fill="${cw.paper}"/>`;
        const colorRng = mulberry32(Math.floor(rng() * 0xffff));
        for (const line of lines) {
          const col = cw.colors[Math.floor(colorRng() * cw.colors.length)];
          inner += flowFieldSvg([line], { stroke: col, strokeWidth: 1.4, opacity: 0.85 });
        }
        return inner;
      }
      case 'reaction-diffusion': {
        const field = reactionDiffusion({
          width: tw,
          height: th,
          cellSize: 3,
          steps: recipe.params.steps as number,
          preset: recipe.params.preset as 'spots' | 'stripes' | 'maze' | 'coral',
          seed: Math.floor(rng() * 0xffff),
        });
        return rdFieldSvg(field, { colorLow: cw.paper, colorHigh: cw.colors[1] ?? cw.colors[0] });
      }
      case 'attractor': {
        const pts = iterateAttractor({
          preset: recipe.params.preset as 'cliffordA' | 'cliffordB' | 'dejongB' | 'svenssonA',
          iterations: 20000,
        });
        return (
          `<rect width="${tw}" height="${th}" fill="${cw.paper}"/>` +
          attractorSvg(pts, {
            width: tw,
            height: th,
            padding: 8,
            dotR: 0.45,
            color: cw.colors[1] ?? cw.colors[0],
            opacity: 0.10,
            sampleEvery: 1,
          })
        );
      }
      case 'stippling': {
        const blobs = [
          { x: tw * 0.35, y: th * 0.40, r: tw * 0.20, strength: 1.0 },
          { x: tw * 0.65, y: th * 0.60, r: tw * 0.24, strength: 0.85 },
        ];
        const density = blobsDensity(blobs);
        const pts = stipple({
          width: tw,
          height: th,
          density,
          method: 'rejection',
          totalDots: recipe.params.totalDots as number,
          seed: Math.floor(rng() * 0xffff),
        });
        return (
          `<rect width="${tw}" height="${th}" fill="${cw.paper}"/>` +
          stippleSvg(pts, { r: 0.9, color: cw.colors[1] ?? cw.colors[0] })
        );
      }
    }
  };

  if (intent.asTile) {
    return tileRenderer(mulberry32(seed), W, H);
  }
  // Otherwise tile across the canvas.
  return repeatTile(tileRenderer, {
    mode: recipe.repeat,
    tileW: recipe.tileSize,
    tileH: recipe.tileSize,
    canvasW: W,
    canvasH: H,
    seed,
  });
}

/** Canvas-wide operators: render once at full size, no tile repeat. */
function renderCanvasWide(recipe: Recipe, intent: DesignIntent): string {
  const W = intent.width;
  const H = intent.height;
  const seed = intent.seed ?? 0xa770;
  const cw = recipe.colorway;

  switch (recipe.operator) {
    case 'flow-field': {
      const lines = flowField({
        width: W,
        height: H,
        freq: recipe.params.freq as number,
        seed,
        lines: recipe.params.lines as number,
        maxSteps: 600,
        stepLen: 1.6,
        separation: recipe.params.separation as number,
      });
      let inner = `<rect width="${W}" height="${H}" fill="${cw.paper}"/>`;
      const colorRng = mulberry32(seed);
      for (const line of lines) {
        const col = cw.colors[Math.floor(colorRng() * cw.colors.length)];
        inner += flowFieldSvg([line], { stroke: col, strokeWidth: 1.4, opacity: 0.85 });
      }
      return inner;
    }
    case 'attractor': {
      const pts = iterateAttractor({
        preset: recipe.params.preset as 'cliffordA' | 'cliffordB' | 'dejongB' | 'svenssonA',
        iterations: 80000,
      });
      return (
        `<rect width="${W}" height="${H}" fill="${cw.paper}"/>` +
        attractorSvg(pts, {
          width: W,
          height: H,
          padding: 16,
          dotR: 0.5,
          color: cw.colors[1] ?? cw.colors[0],
          opacity: 0.08,
          sampleEvery: 1,
        })
      );
    }
    case 'reaction-diffusion': {
      const field = reactionDiffusion({
        width: W,
        height: H,
        cellSize: 3,
        steps: recipe.params.steps as number,
        preset: recipe.params.preset as 'spots' | 'stripes' | 'maze' | 'coral',
        seed,
      });
      return rdFieldSvg(field, { colorLow: cw.paper, colorHigh: cw.colors[1] ?? cw.colors[0] });
    }
    case 'stippling': {
      // Build a multi-blob density spanning the canvas.
      const blobs = [
        { x: W * 0.30, y: H * 0.35, r: W * 0.22, strength: 1.0 },
        { x: W * 0.70, y: H * 0.55, r: W * 0.20, strength: 0.95 },
        { x: W * 0.45, y: H * 0.80, r: W * 0.18, strength: 0.75 },
      ];
      const density = blobsDensity(blobs);
      const pts = stipple({
        width: W,
        height: H,
        density,
        method: 'poisson',
        rMin: 3,
        rMax: 18,
        seed,
      });
      return (
        `<rect width="${W}" height="${H}" fill="${cw.paper}"/>` +
        stippleSvg(pts, { r: 0.9, color: cw.colors[1] ?? cw.colors[0] })
      );
    }
  }
  return '';
}

/** Convenience: intent → SVG fragment in one call. */
export function composeIntent(intent: DesignIntent): { svg: string; recipe: Recipe } {
  const recipe = intentToRecipe(intent);
  const svg = renderRecipe(recipe, intent);
  return { svg, recipe };
}
