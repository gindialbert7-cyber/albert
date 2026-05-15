/**
 * Quality-scorer types.
 *
 * Per the reward-hacking research: the production scorer is never the
 * source of truth — humans are. The scorer's job is throughput. So we
 * design as a 3-scorer ensemble + audit scorer + locked human-eval set
 * + 5% counterfactual exploration slate.
 *
 * Each scorer returns a 20-feature vector + a decision band (accept /
 * borderline / reject). The ensemble combines scorers with a
 * DISAGREEMENT PENALTY: high disagreement among scorers is the
 * strongest single signal of adversarial input or genuinely
 * borderline output.
 *
 * Sources:
 *   - Deterministic scorers (compositionMetrics, colorHarmony,
 *     paletteRestraint, structural lint): pure JS, available today.
 *   - ML scorers (VILA-R, TOPIQ, CLIP-IQA, custom hand-drawn-vs-clipart
 *     classifier): live OUTSIDE the renderer purity boundary; called
 *     from the scoring service, results discretized to integer buckets
 *     before any influence on render (per ML quarantine discipline).
 */

export type ScoreBand = 'accept' | 'borderline' | 'reject';

/** A 20-element feature vector per scored page. */
export type PageFeatures = {
  // Composition (5)
  saliencyThirdsDistance: number;   // 0..1
  balanceLR: number;                 // -1..1
  balanceTB: number;                 // -1..1
  negativeSpaceRatio: number;        // 0..1
  focalPointCount: number;           // integer

  // Color (3)
  paletteEntropy: number;            // 0..log2(palette size)
  harmonyTemplateFit: number;        // 0..1 (1 = perfect Matsuda template match)
  chromaMax: number;                 // 0..1 (peak OKLab chroma, AI-signature gate)

  // Anti-AI signature (4)
  edgeAnisotropy: number;            // 0..1 (hand-drawn vs clipart classifier)
  hfEnergyMid: number;               // 0..1 (mid-frequency FFT energy)
  styleCentroidCosine: number;       // 0..1 (similarity to author's trusted centroid)
  artifactFaceProbability: number;   // 0..1 (extra-fingers / asymmetric-eyes)

  // ML / external (4) — NaN if not yet computed
  vilaRScore: number;
  improvedAestheticScore: number;
  topiqScore: number;
  clipIqaGood: number;

  // Content (1)
  textImageCounterpoint: number;     // 0..1 (lower = more redundant)

  // Page metadata (3) — passed through for the scorer's bookkeeping
  bookId: string;
  pageId: string;
  rendererOutputVersion: string;
};

export type PageScore = {
  features: PageFeatures;
  /** Final calibrated P(accept), 0..1. */
  pAccept: number;
  band: ScoreBand;
  /** Which thresholds were applied (so we can audit version drift). */
  thresholdVersion: string;
  /** Reasons for the decision, human-readable. */
  notes: string[];
};

/** Configuration for the scoring stack (thresholds, ensemble weights). */
export type ScorerConfig = {
  thresholdVersion: string;
  tauAccept: number;   // P(accept) ≥ τ_accept ⇒ accept
  tauReroll: number;   // P(accept) < τ_reroll ⇒ reject + re-roll
  /** Weights for each scorer in the ensemble. NaN entries are skipped. */
  weights: {
    composition: number;
    colorHarmony: number;
    paletteRestraint: number;
    structural: number;
    vilaR: number;
    topiq: number;
    clipIqa: number;
    edgeAnisotropy: number;
    counterpoint: number;
  };
  /** If scorer disagreement (max - min) exceeds this, force borderline. */
  disagreementThreshold: number;
};

export const DEFAULT_SCORER_CONFIG: ScorerConfig = {
  thresholdVersion: '2026.05.15',
  tauAccept: 0.62,
  tauReroll: 0.35,
  weights: {
    composition: 1.0,
    colorHarmony: 0.6,
    paletteRestraint: 0.8,
    structural: 1.2,
    vilaR: 1.0,
    topiq: 0.7,
    clipIqa: 0.8,
    edgeAnisotropy: 1.1,
    counterpoint: 0.6,
  },
  disagreementThreshold: 0.35,
};
