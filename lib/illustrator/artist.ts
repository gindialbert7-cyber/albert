/**
 * The Artist parameter vector.
 *
 * Every author of the system gets one Artist — a 40-parameter style
 * record, generated deterministically from their authorId, optionally
 * tuned by uploaded reference images, and *committed* (not blended)
 * to one of 10 internal style anchors. This is the per-author
 * uniqueness layer.
 *
 * Architectural property: random sampling in a 40-D bounded box would
 * produce 50–70% aesthetically broken Artists (the manifold-validity
 * problem). We make Artists coherent by SAMPLING WITHIN ANCHOR-SPECIFIC
 * BOUNDED REGIONS rather than universally. Each of the 10 internal
 * anchors has a hand-curated parameter region whose volume is small
 * enough that random samples within it are reliably coherent.
 *
 * The anchor names are public-safe internal codenames. They are
 * statistically inspired by (but never marketed as referencing) the 10
 * reference illustrators that calibrate the system. Per the legal
 * audit, never publicly attribute living illustrators to a customer's
 * Artist; they see "Inkbloom" or "Marrow", not "Cátia Chien style."
 */

import { hashString, mulberry32 } from './rng';

// ─── Type ────────────────────────────────────────────────────────────────────

export type ArtistAnchor =
  | 'pip'        // soft watercolor, warm palette, gentle line  (Potter family)
  | 'inkbloom'   // luminous watercolor with dissolving edges    (Chien family)
  | 'marrow'    // mixed-media gouache + sketch + collage        (Kunz family)
  | 'juniper'   // digital + chalk pastel, restrained palette    (Harrison family)
  | 'driftwood' // ink-and-wash, atmospheric                     (Sydney Smith family)
  | 'cobble'    // flat shapes + texture, muted earth tones      (Klassen family)
  | 'rind'      // cut-paper collage, deliberate scissor edges   (Robinson family)
  | 'kiln'      // risograph-style, 2-4 ink limited palette      (Froese family)
  | 'tinder'    // gouache, naïve line, asymmetric shapes        (Alemagna family)
  | 'thistle';  // scratchy ink, escaped watercolor              (Blake family)

export type FillMode =
  | 'watercolor-wash'
  | 'pencil-hatch'
  | 'wash-and-hatch'
  | 'flat-with-grain'
  | 'cut-paper-collage'
  | 'risograph-mis-reg';

export type DepthLayering = 'flat' | 'soft-atmospheric' | 'strong-atmospheric';

export type Artist = {
  id: string;
  seed: number;
  anchor: ArtistAnchor;
  /** 0.7..0.95 — how strongly the anchor's bounded region constrains. */
  anchorCommitment: number;

  // ── Line behavior (8) ───────────────────────────────────────────
  inkColor: string;
  baseLineWidth: number;
  lineWidthMax: number;
  pressureCurvatureCoupling: number;
  velocityDarknessCoupling: number;
  anticipationHook: number;
  followThroughOvershoot: number;
  endpointInkPool: number;

  // ── Fill behavior (8) ───────────────────────────────────────────
  fillMode: FillMode;
  washOpacity: number;
  washBleed: number;
  rimDarkening: number;
  hatchPrimaryAngle: number;
  hatchDensity: number;
  fillPunctureRate: number;
  paperGrainIntensity: number;

  // ── Palette (curated) ──────────────────────────────────────────
  palette: string[];      // 5–7 hex swatches, chroma-capped
  paperStock: string;     // off-white shade

  // ── Composition tendencies (8) ──────────────────────────────────
  ruleOfThirdsAffinity: number;
  characterScaleBias: number;
  propDensity: 'sparse' | 'medium' | 'dense';
  whitespaceTarget: number;
  depthLayering: DepthLayering;
  edgeFraming: number;
  leadingLineAffinity: number;
  gutterDiscipline: 1.0; // ALWAYS 1.0

  // ── Character anatomy bias (6) ──────────────────────────────────
  headToBodyRatio: number;
  eyelinePosition: number;
  appealCurveTension: number;
  handFootScale: number;
  noseStyle: 'dot' | 'small-triangle' | 'curve' | 'omitted';
  expressionRange: 'subtle' | 'expressive' | 'cartoony';
};

// ─── Anchor-specific bounded regions ─────────────────────────────────────────

/**
 * Each anchor's parameter region. Sampling Artists from inside one of
 * these regions yields visibly distinct styles while keeping each
 * Artist internally coherent. These ranges are CALIBRATED — they are
 * the part of the system that requires ongoing taste-driven iteration
 * (the "permanent calibration loop" the plan named).
 */
type Range<T> = { min: T; max: T };
type DiscretePick<T> = readonly T[];

type AnchorRegion = {
  inkColor: DiscretePick<string>;
  paperStock: DiscretePick<string>;
  baseLineWidth: Range<number>;
  lineWidthMax: Range<number>;
  pressureCurvatureCoupling: Range<number>;
  anticipationHook: Range<number>;
  followThroughOvershoot: Range<number>;
  endpointInkPool: Range<number>;
  fillMode: DiscretePick<FillMode>;
  washOpacity: Range<number>;
  washBleed: Range<number>;
  rimDarkening: Range<number>;
  hatchPrimaryAngle: Range<number>;
  hatchDensity: Range<number>;
  fillPunctureRate: Range<number>;
  paperGrainIntensity: Range<number>;
  palette: DiscretePick<readonly string[]>;
  ruleOfThirdsAffinity: Range<number>;
  characterScaleBias: Range<number>;
  propDensity: DiscretePick<'sparse' | 'medium' | 'dense'>;
  whitespaceTarget: Range<number>;
  depthLayering: DiscretePick<DepthLayering>;
  edgeFraming: Range<number>;
  leadingLineAffinity: Range<number>;
  headToBodyRatio: Range<number>;
  eyelinePosition: Range<number>;
  appealCurveTension: Range<number>;
  handFootScale: Range<number>;
  noseStyle: DiscretePick<'dot' | 'small-triangle' | 'curve' | 'omitted'>;
  expressionRange: DiscretePick<'subtle' | 'expressive' | 'cartoony'>;
};

const ANCHOR_REGIONS: Record<ArtistAnchor, AnchorRegion> = {
  pip: {
    inkColor: ['#5a4226', '#6b4d2b', '#523c25'],
    paperStock: ['#f4ecd6', '#f6eed8', '#f1e6cc'],
    baseLineWidth: { min: 1.0, max: 1.4 },
    lineWidthMax: { min: 1.6, max: 2.0 },
    pressureCurvatureCoupling: { min: 0.15, max: 0.25 },
    anticipationHook: { min: 0.025, max: 0.04 },
    followThroughOvershoot: { min: 0.03, max: 0.05 },
    endpointInkPool: { min: 0.4, max: 0.7 },
    fillMode: ['watercolor-wash'],
    washOpacity: { min: 0.5, max: 0.65 },
    washBleed: { min: 3.0, max: 4.5 },
    rimDarkening: { min: 0.1, max: 0.18 },
    hatchPrimaryAngle: { min: 25, max: 45 },
    hatchDensity: { min: 5.5, max: 7.0 },
    fillPunctureRate: { min: 0.01, max: 0.025 },
    paperGrainIntensity: { min: 0.6, max: 0.8 },
    palette: [
      ['#c4956c', '#e9c6a0', '#a8745a', '#d8a07c', '#6d4a3b', '#f0d4ad'],
      ['#b88565', '#e2c3a0', '#9b6952', '#d4a17e', '#7c5040', '#eed5b3'],
    ],
    ruleOfThirdsAffinity: { min: 0.6, max: 0.8 },
    characterScaleBias: { min: 0.95, max: 1.1 },
    propDensity: ['sparse', 'medium'],
    whitespaceTarget: { min: 0.25, max: 0.32 },
    depthLayering: ['soft-atmospheric'],
    edgeFraming: { min: 0.15, max: 0.3 },
    leadingLineAffinity: { min: 0.6, max: 0.8 },
    headToBodyRatio: { min: 2.4, max: 2.8 },
    eyelinePosition: { min: 0.58, max: 0.62 },
    appealCurveTension: { min: 0.55, max: 0.68 },
    handFootScale: { min: 0.82, max: 0.92 },
    noseStyle: ['curve', 'dot'],
    expressionRange: ['subtle', 'expressive'],
  },
  inkbloom: {
    inkColor: ['#3a2a1c', '#2e2620', '#3d2f24'],
    paperStock: ['#f6efe1', '#f8f0e3', '#f4ede0'],
    baseLineWidth: { min: 0.9, max: 1.3 },
    lineWidthMax: { min: 1.8, max: 2.4 },
    pressureCurvatureCoupling: { min: 0.18, max: 0.32 },
    anticipationHook: { min: 0.02, max: 0.04 },
    followThroughOvershoot: { min: 0.04, max: 0.07 },
    endpointInkPool: { min: 0.6, max: 1.0 },
    fillMode: ['watercolor-wash', 'wash-and-hatch'],
    washOpacity: { min: 0.45, max: 0.6 },
    washBleed: { min: 4.0, max: 6.0 },
    rimDarkening: { min: 0.15, max: 0.22 },
    hatchPrimaryAngle: { min: 30, max: 60 },
    hatchDensity: { min: 4.5, max: 6.5 },
    fillPunctureRate: { min: 0.015, max: 0.03 },
    paperGrainIntensity: { min: 0.7, max: 0.85 },
    palette: [
      ['#a05f4d', '#d4b59a', '#6d8a8a', '#cfa97e', '#3f4655', '#ead4b8'],
      ['#b06a55', '#c8a585', '#5e7d80', '#d6b58c', '#4a4f5e', '#e8d2b1'],
    ],
    ruleOfThirdsAffinity: { min: 0.5, max: 0.75 },
    characterScaleBias: { min: 0.9, max: 1.05 },
    propDensity: ['sparse', 'medium'],
    whitespaceTarget: { min: 0.22, max: 0.32 },
    depthLayering: ['strong-atmospheric'],
    edgeFraming: { min: 0.0, max: 0.15 },
    leadingLineAffinity: { min: 0.5, max: 0.7 },
    headToBodyRatio: { min: 2.5, max: 3.0 },
    eyelinePosition: { min: 0.55, max: 0.62 },
    appealCurveTension: { min: 0.5, max: 0.6 },
    handFootScale: { min: 0.78, max: 0.9 },
    noseStyle: ['dot', 'curve'],
    expressionRange: ['subtle'],
  },
  marrow: {
    inkColor: ['#3a2a1c', '#2c241e', '#3f2d23'],
    paperStock: ['#f3ead4', '#f6eedb', '#f1e8d2'],
    baseLineWidth: { min: 1.2, max: 1.7 },
    lineWidthMax: { min: 2.0, max: 2.6 },
    pressureCurvatureCoupling: { min: 0.2, max: 0.35 },
    anticipationHook: { min: 0.025, max: 0.045 },
    followThroughOvershoot: { min: 0.035, max: 0.06 },
    endpointInkPool: { min: 0.7, max: 1.1 },
    fillMode: ['wash-and-hatch', 'cut-paper-collage'],
    washOpacity: { min: 0.55, max: 0.7 },
    washBleed: { min: 2.5, max: 4.0 },
    rimDarkening: { min: 0.15, max: 0.22 },
    hatchPrimaryAngle: { min: 25, max: 55 },
    hatchDensity: { min: 4.0, max: 5.5 },
    fillPunctureRate: { min: 0.02, max: 0.04 },
    paperGrainIntensity: { min: 0.75, max: 0.9 },
    palette: [
      ['#a83a3a', '#e7a14c', '#3e6448', '#c89f5c', '#262922', '#f0d7a2'],
      ['#9a4a3e', '#d8975a', '#4a7050', '#cfa46e', '#2c2922', '#e8d1a4'],
    ],
    ruleOfThirdsAffinity: { min: 0.55, max: 0.75 },
    characterScaleBias: { min: 0.95, max: 1.15 },
    propDensity: ['medium', 'dense'],
    whitespaceTarget: { min: 0.18, max: 0.28 },
    depthLayering: ['soft-atmospheric'],
    edgeFraming: { min: 0.05, max: 0.2 },
    leadingLineAffinity: { min: 0.55, max: 0.75 },
    headToBodyRatio: { min: 2.3, max: 2.7 },
    eyelinePosition: { min: 0.58, max: 0.63 },
    appealCurveTension: { min: 0.55, max: 0.65 },
    handFootScale: { min: 0.8, max: 0.92 },
    noseStyle: ['curve', 'small-triangle'],
    expressionRange: ['expressive'],
  },
  juniper: {
    inkColor: ['#3a342d', '#2d2925', '#403832'],
    paperStock: ['#f8f1e6', '#fbf5ec', '#f5eee2'],
    baseLineWidth: { min: 1.0, max: 1.4 },
    lineWidthMax: { min: 1.5, max: 1.9 },
    pressureCurvatureCoupling: { min: 0.15, max: 0.25 },
    anticipationHook: { min: 0.025, max: 0.035 },
    followThroughOvershoot: { min: 0.03, max: 0.045 },
    endpointInkPool: { min: 0.5, max: 0.8 },
    fillMode: ['flat-with-grain', 'wash-and-hatch'],
    washOpacity: { min: 0.5, max: 0.65 },
    washBleed: { min: 2.0, max: 3.5 },
    rimDarkening: { min: 0.1, max: 0.15 },
    hatchPrimaryAngle: { min: 35, max: 55 },
    hatchDensity: { min: 5.0, max: 6.5 },
    fillPunctureRate: { min: 0.01, max: 0.02 },
    paperGrainIntensity: { min: 0.65, max: 0.8 },
    palette: [
      ['#d4a09c', '#a5a4ad', '#e0c8b2', '#7b7484', '#372e30', '#f0dbc9'],
      ['#c8958f', '#9a98a2', '#d8c1aa', '#706879', '#2f2729', '#e8d3c1'],
    ],
    ruleOfThirdsAffinity: { min: 0.55, max: 0.7 },
    characterScaleBias: { min: 1.0, max: 1.15 },
    propDensity: ['sparse', 'medium'],
    whitespaceTarget: { min: 0.25, max: 0.35 },
    depthLayering: ['flat', 'soft-atmospheric'],
    edgeFraming: { min: 0.0, max: 0.1 },
    leadingLineAffinity: { min: 0.5, max: 0.7 },
    headToBodyRatio: { min: 2.5, max: 3.0 },
    eyelinePosition: { min: 0.58, max: 0.63 },
    appealCurveTension: { min: 0.55, max: 0.62 },
    handFootScale: { min: 0.82, max: 0.9 },
    noseStyle: ['dot', 'small-triangle'],
    expressionRange: ['subtle', 'expressive'],
  },
  driftwood: {
    inkColor: ['#2e2620', '#352a22', '#28201a'],
    paperStock: ['#f5ecd9', '#f8efdc', '#f2e9d4'],
    baseLineWidth: { min: 1.1, max: 1.6 },
    lineWidthMax: { min: 1.8, max: 2.4 },
    pressureCurvatureCoupling: { min: 0.2, max: 0.32 },
    anticipationHook: { min: 0.03, max: 0.05 },
    followThroughOvershoot: { min: 0.04, max: 0.07 },
    endpointInkPool: { min: 0.7, max: 1.0 },
    fillMode: ['watercolor-wash', 'wash-and-hatch'],
    washOpacity: { min: 0.5, max: 0.65 },
    washBleed: { min: 3.5, max: 5.5 },
    rimDarkening: { min: 0.15, max: 0.22 },
    hatchPrimaryAngle: { min: 30, max: 50 },
    hatchDensity: { min: 4.5, max: 6.0 },
    fillPunctureRate: { min: 0.015, max: 0.03 },
    paperGrainIntensity: { min: 0.7, max: 0.85 },
    palette: [
      ['#6a5a4a', '#a89074', '#3a4f55', '#9e8268', '#2a2620', '#cdb89c'],
      ['#796b58', '#9a8369', '#475b62', '#8c7361', '#332d27', '#bfae93'],
    ],
    ruleOfThirdsAffinity: { min: 0.6, max: 0.78 },
    characterScaleBias: { min: 0.95, max: 1.1 },
    propDensity: ['sparse', 'medium'],
    whitespaceTarget: { min: 0.2, max: 0.3 },
    depthLayering: ['strong-atmospheric'],
    edgeFraming: { min: 0.1, max: 0.25 },
    leadingLineAffinity: { min: 0.6, max: 0.8 },
    headToBodyRatio: { min: 2.4, max: 2.8 },
    eyelinePosition: { min: 0.56, max: 0.62 },
    appealCurveTension: { min: 0.5, max: 0.6 },
    handFootScale: { min: 0.8, max: 0.9 },
    noseStyle: ['dot', 'curve'],
    expressionRange: ['subtle'],
  },
  cobble: {
    inkColor: ['#39312a', '#3a2e26', '#332b25'],
    paperStock: ['#f5ecd5', '#f8efd8', '#f1e8d0'],
    baseLineWidth: { min: 0.8, max: 1.2 },
    lineWidthMax: { min: 1.2, max: 1.6 },
    pressureCurvatureCoupling: { min: 0.1, max: 0.18 },
    anticipationHook: { min: 0.02, max: 0.03 },
    followThroughOvershoot: { min: 0.025, max: 0.04 },
    endpointInkPool: { min: 0.3, max: 0.6 },
    fillMode: ['flat-with-grain'],
    washOpacity: { min: 0.6, max: 0.78 },
    washBleed: { min: 1.5, max: 3.0 },
    rimDarkening: { min: 0.06, max: 0.12 },
    hatchPrimaryAngle: { min: 40, max: 50 },
    hatchDensity: { min: 6.0, max: 7.5 },
    fillPunctureRate: { min: 0.005, max: 0.015 },
    paperGrainIntensity: { min: 0.55, max: 0.75 },
    palette: [
      ['#6e5d4a', '#9b8d72', '#3f4642', '#cab494', '#28241e', '#ddd0b3'],
      ['#7c6a55', '#a4957a', '#4a524d', '#bea787', '#2f2922', '#d0c2a5'],
    ],
    ruleOfThirdsAffinity: { min: 0.65, max: 0.85 },
    characterScaleBias: { min: 0.95, max: 1.1 },
    propDensity: ['sparse'],
    whitespaceTarget: { min: 0.28, max: 0.4 },
    depthLayering: ['flat', 'soft-atmospheric'],
    edgeFraming: { min: 0.0, max: 0.1 },
    leadingLineAffinity: { min: 0.45, max: 0.65 },
    headToBodyRatio: { min: 2.6, max: 3.2 },
    eyelinePosition: { min: 0.58, max: 0.62 },
    appealCurveTension: { min: 0.5, max: 0.58 },
    handFootScale: { min: 0.78, max: 0.88 },
    noseStyle: ['dot', 'omitted'],
    expressionRange: ['subtle'],
  },
  rind: {
    inkColor: ['#3a2a1c', '#322820', '#3f2d23'],
    paperStock: ['#f5ecd5', '#f8efd8', '#f3e9d0'],
    baseLineWidth: { min: 1.0, max: 1.4 },
    lineWidthMax: { min: 1.4, max: 1.8 },
    pressureCurvatureCoupling: { min: 0.1, max: 0.18 },
    anticipationHook: { min: 0.025, max: 0.035 },
    followThroughOvershoot: { min: 0.03, max: 0.045 },
    endpointInkPool: { min: 0.4, max: 0.7 },
    fillMode: ['cut-paper-collage', 'flat-with-grain'],
    washOpacity: { min: 0.7, max: 0.85 },
    washBleed: { min: 1.0, max: 2.5 },
    rimDarkening: { min: 0.05, max: 0.12 },
    hatchPrimaryAngle: { min: 35, max: 55 },
    hatchDensity: { min: 5.5, max: 7.0 },
    fillPunctureRate: { min: 0.01, max: 0.025 },
    paperGrainIntensity: { min: 0.7, max: 0.85 },
    palette: [
      ['#c8704d', '#e6c068', '#3a6a8a', '#d5a577', '#2c2620', '#f0d8a8'],
      ['#b85f4a', '#dab268', '#456e8a', '#cfa274', '#332b24', '#e6d2a5'],
    ],
    ruleOfThirdsAffinity: { min: 0.55, max: 0.75 },
    characterScaleBias: { min: 1.0, max: 1.15 },
    propDensity: ['medium', 'dense'],
    whitespaceTarget: { min: 0.18, max: 0.28 },
    depthLayering: ['flat'],
    edgeFraming: { min: 0.0, max: 0.1 },
    leadingLineAffinity: { min: 0.5, max: 0.7 },
    headToBodyRatio: { min: 2.4, max: 2.9 },
    eyelinePosition: { min: 0.58, max: 0.63 },
    appealCurveTension: { min: 0.55, max: 0.62 },
    handFootScale: { min: 0.85, max: 0.95 },
    noseStyle: ['dot', 'small-triangle'],
    expressionRange: ['expressive'],
  },
  kiln: {
    inkColor: ['#1f1812', '#251c14', '#1c1610'],
    paperStock: ['#f5ecd5', '#f8efd8', '#f0e7cd'],
    baseLineWidth: { min: 0.9, max: 1.3 },
    lineWidthMax: { min: 1.3, max: 1.7 },
    pressureCurvatureCoupling: { min: 0.1, max: 0.18 },
    anticipationHook: { min: 0.02, max: 0.03 },
    followThroughOvershoot: { min: 0.025, max: 0.04 },
    endpointInkPool: { min: 0.3, max: 0.55 },
    fillMode: ['risograph-mis-reg', 'flat-with-grain'],
    washOpacity: { min: 0.65, max: 0.8 },
    washBleed: { min: 1.5, max: 3.0 },
    rimDarkening: { min: 0.06, max: 0.14 },
    hatchPrimaryAngle: { min: 30, max: 60 },
    hatchDensity: { min: 5.0, max: 7.0 },
    fillPunctureRate: { min: 0.01, max: 0.025 },
    paperGrainIntensity: { min: 0.7, max: 0.85 },
    palette: [
      ['#9c4b35', '#3e6d8a', '#e4b056', '#1f1812'],
      ['#a85a3a', '#3a6e90', '#d8a85a', '#1c1610'],
    ],
    ruleOfThirdsAffinity: { min: 0.6, max: 0.8 },
    characterScaleBias: { min: 0.95, max: 1.1 },
    propDensity: ['sparse', 'medium'],
    whitespaceTarget: { min: 0.22, max: 0.34 },
    depthLayering: ['flat'],
    edgeFraming: { min: 0.0, max: 0.1 },
    leadingLineAffinity: { min: 0.5, max: 0.7 },
    headToBodyRatio: { min: 2.5, max: 3.0 },
    eyelinePosition: { min: 0.58, max: 0.62 },
    appealCurveTension: { min: 0.55, max: 0.62 },
    handFootScale: { min: 0.8, max: 0.9 },
    noseStyle: ['dot'],
    expressionRange: ['subtle', 'expressive'],
  },
  tinder: {
    inkColor: ['#39312a', '#3a2e26', '#332b25'],
    paperStock: ['#f5e9d2', '#f8edd6', '#f1e7d0'],
    baseLineWidth: { min: 1.1, max: 1.7 },
    lineWidthMax: { min: 1.8, max: 2.4 },
    pressureCurvatureCoupling: { min: 0.2, max: 0.35 },
    anticipationHook: { min: 0.03, max: 0.05 },
    followThroughOvershoot: { min: 0.045, max: 0.08 },
    endpointInkPool: { min: 0.7, max: 1.1 },
    fillMode: ['wash-and-hatch', 'watercolor-wash'],
    washOpacity: { min: 0.5, max: 0.65 },
    washBleed: { min: 3.0, max: 4.5 },
    rimDarkening: { min: 0.12, max: 0.2 },
    hatchPrimaryAngle: { min: 20, max: 50 },
    hatchDensity: { min: 4.5, max: 6.0 },
    fillPunctureRate: { min: 0.02, max: 0.04 },
    paperGrainIntensity: { min: 0.75, max: 0.9 },
    palette: [
      ['#c8755a', '#e7c168', '#5e8552', '#cda47c', '#2c2922', '#ead7a8'],
      ['#bf6e55', '#d8b260', '#6e9460', '#c5a079', '#332e26', '#dfcd9c'],
    ],
    ruleOfThirdsAffinity: { min: 0.55, max: 0.78 },
    characterScaleBias: { min: 0.95, max: 1.15 },
    propDensity: ['medium', 'dense'],
    whitespaceTarget: { min: 0.18, max: 0.3 },
    depthLayering: ['soft-atmospheric'],
    edgeFraming: { min: 0.05, max: 0.2 },
    leadingLineAffinity: { min: 0.55, max: 0.78 },
    headToBodyRatio: { min: 2.2, max: 2.7 },
    eyelinePosition: { min: 0.6, max: 0.65 },
    appealCurveTension: { min: 0.55, max: 0.68 },
    handFootScale: { min: 0.82, max: 0.95 },
    noseStyle: ['curve', 'small-triangle'],
    expressionRange: ['expressive', 'cartoony'],
  },
  thistle: {
    inkColor: ['#2e261e', '#322a22', '#28201a'],
    paperStock: ['#f6efe1', '#f9f2e3', '#f4ecde'],
    baseLineWidth: { min: 1.3, max: 1.9 },
    lineWidthMax: { min: 2.2, max: 2.8 },
    pressureCurvatureCoupling: { min: 0.25, max: 0.4 },
    anticipationHook: { min: 0.035, max: 0.06 },
    followThroughOvershoot: { min: 0.05, max: 0.09 },
    endpointInkPool: { min: 0.9, max: 1.2 },
    fillMode: ['watercolor-wash', 'wash-and-hatch'],
    washOpacity: { min: 0.45, max: 0.6 },
    washBleed: { min: 4.5, max: 7.0 },
    rimDarkening: { min: 0.15, max: 0.25 },
    hatchPrimaryAngle: { min: 25, max: 55 },
    hatchDensity: { min: 4.0, max: 5.5 },
    fillPunctureRate: { min: 0.02, max: 0.04 },
    paperGrainIntensity: { min: 0.7, max: 0.85 },
    palette: [
      ['#c45a48', '#e9b25a', '#5d7baf', '#d39e74', '#2e261e', '#f0d8b0'],
      ['#b85342', '#d8a35a', '#5d80a8', '#c89568', '#332b24', '#e5cca5'],
    ],
    ruleOfThirdsAffinity: { min: 0.5, max: 0.75 },
    characterScaleBias: { min: 0.95, max: 1.15 },
    propDensity: ['medium', 'dense'],
    whitespaceTarget: { min: 0.2, max: 0.32 },
    depthLayering: ['soft-atmospheric'],
    edgeFraming: { min: 0.05, max: 0.2 },
    leadingLineAffinity: { min: 0.6, max: 0.85 },
    headToBodyRatio: { min: 2.2, max: 2.6 },
    eyelinePosition: { min: 0.6, max: 0.66 },
    appealCurveTension: { min: 0.6, max: 0.7 },
    handFootScale: { min: 0.85, max: 1.0 },
    noseStyle: ['curve', 'small-triangle'],
    expressionRange: ['expressive', 'cartoony'],
  },
};

// ─── Sampling utilities ──────────────────────────────────────────────────────

function sampleRange(rng: () => number, r: Range<number>): number {
  return r.min + (r.max - r.min) * rng();
}

function samplePick<T>(rng: () => number, list: DiscretePick<T>): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

// ─── Correlation projection (the 10 must-encode rules) ───────────────────────

/**
 * After independent sampling, enforce 10 inter-parameter correlations
 * so the Artist is coherent. These are the rules from the manifold-
 * validity research that prevent the worst pathologies.
 */
function projectCorrelations(a: Artist): Artist {
  // 1. wobbleAmplitude × lineWeight ≤ K — represented here as
  //    lineWidthMax ≤ baseLineWidth × 2.2 (a thick line that's also wildly
  //    variable looks like noise, not gestural).
  if (a.lineWidthMax > a.baseLineWidth * 2.2) {
    a.lineWidthMax = a.baseLineWidth * 2.2;
  }
  // 2. washOpacity + rimDarkening ≤ 0.85 — high opacity + heavy rim = muddy.
  if (a.washOpacity + a.rimDarkening > 0.85) {
    a.rimDarkening = Math.max(0.05, 0.85 - a.washOpacity);
  }
  // 3. hatchDensity inversely scales with washOpacity (don't hatch over wash).
  if (a.washOpacity > 0.7 && a.hatchDensity < 5) {
    a.hatchDensity = 5.5; // spread out the hatch if wash is opaque
  }
  // 4. characterScaleBias × propDensity ≤ K (crowding).
  if (a.characterScaleBias > 1.1 && a.propDensity === 'dense') {
    a.propDensity = 'medium';
  }
  // 5. headBodyRatio couples to appealCurveTension (chibi needs softer curves).
  if (a.headToBodyRatio < 2.4 && a.appealCurveTension < 0.55) {
    a.appealCurveTension = 0.55;
  }
  // 6. paletteContrast couples to rimDarkening — handled in palette generation.
  // 7. pressureCurvatureCoupling requires sufficient line width variance to read.
  if (a.pressureCurvatureCoupling > 0.25 && a.lineWidthMax / a.baseLineWidth < 1.4) {
    a.pressureCurvatureCoupling = 0.2;
  }
  // 8. whitespaceTarget inversely couples to propDensity.
  if (a.whitespaceTarget > 0.3 && a.propDensity === 'dense') {
    a.propDensity = 'medium';
  }
  if (a.whitespaceTarget < 0.2 && a.propDensity === 'sparse') {
    a.propDensity = 'medium';
  }
  // 9. fillMode = 'flat-with-grain' excludes meaningful bleed.
  if (a.fillMode === 'flat-with-grain' || a.fillMode === 'cut-paper-collage') {
    a.washBleed = Math.min(a.washBleed, 2.0);
  }
  // 10. expressionRange couples to noseStyle (cartoon nose needs wide expression).
  if (a.noseStyle === 'omitted' && a.expressionRange === 'cartoony') {
    a.expressionRange = 'expressive';
  }
  return a;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Deterministically generate an Artist for an author.
 *
 * The author ID is hashed to pick an anchor and to seed all parameter
 * sampling. Two different author IDs yield two different Artists. Same
 * author ID always yields the same Artist, forever.
 */
export function seedArtist(authorId: string, options?: { anchor?: ArtistAnchor }): Artist {
  const seed = hashString('artist:' + authorId);
  const rng = mulberry32(seed);

  // Pick anchor either explicitly or by hashing authorId.
  const anchorOptions: ArtistAnchor[] = [
    'pip', 'inkbloom', 'marrow', 'juniper', 'driftwood',
    'cobble', 'rind', 'kiln', 'tinder', 'thistle',
  ];
  const anchor: ArtistAnchor = options?.anchor ?? anchorOptions[Math.floor(rng() * anchorOptions.length) % anchorOptions.length];
  const region = ANCHOR_REGIONS[anchor];

  const draft: Artist = {
    id: 'artist-' + (seed >>> 0).toString(16),
    seed,
    anchor,
    anchorCommitment: 0.7 + 0.25 * rng(),

    inkColor: samplePick(rng, region.inkColor),
    baseLineWidth: sampleRange(rng, region.baseLineWidth),
    lineWidthMax: sampleRange(rng, region.lineWidthMax),
    pressureCurvatureCoupling: sampleRange(rng, region.pressureCurvatureCoupling),
    velocityDarknessCoupling: 0.1 + 0.2 * rng(),
    anticipationHook: sampleRange(rng, region.anticipationHook),
    followThroughOvershoot: sampleRange(rng, region.followThroughOvershoot),
    endpointInkPool: sampleRange(rng, region.endpointInkPool),

    fillMode: samplePick(rng, region.fillMode),
    washOpacity: sampleRange(rng, region.washOpacity),
    washBleed: sampleRange(rng, region.washBleed),
    rimDarkening: sampleRange(rng, region.rimDarkening),
    hatchPrimaryAngle: sampleRange(rng, region.hatchPrimaryAngle),
    hatchDensity: sampleRange(rng, region.hatchDensity),
    fillPunctureRate: sampleRange(rng, region.fillPunctureRate),
    paperGrainIntensity: sampleRange(rng, region.paperGrainIntensity),

    palette: samplePick(rng, region.palette).slice(),
    paperStock: samplePick(rng, region.paperStock),

    ruleOfThirdsAffinity: sampleRange(rng, region.ruleOfThirdsAffinity),
    characterScaleBias: sampleRange(rng, region.characterScaleBias),
    propDensity: samplePick(rng, region.propDensity),
    whitespaceTarget: sampleRange(rng, region.whitespaceTarget),
    depthLayering: samplePick(rng, region.depthLayering),
    edgeFraming: sampleRange(rng, region.edgeFraming),
    leadingLineAffinity: sampleRange(rng, region.leadingLineAffinity),
    gutterDiscipline: 1.0,

    headToBodyRatio: sampleRange(rng, region.headToBodyRatio),
    eyelinePosition: sampleRange(rng, region.eyelinePosition),
    appealCurveTension: sampleRange(rng, region.appealCurveTension),
    handFootScale: sampleRange(rng, region.handFootScale),
    noseStyle: samplePick(rng, region.noseStyle),
    expressionRange: samplePick(rng, region.expressionRange),
  };

  return projectCorrelations(draft);
}

/** Anchor names enumerated for UIs and tests. */
export const ALL_ANCHORS: ArtistAnchor[] = [
  'pip', 'inkbloom', 'marrow', 'juniper', 'driftwood',
  'cobble', 'rind', 'kiln', 'tinder', 'thistle',
];
