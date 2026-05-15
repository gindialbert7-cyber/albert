/**
 * Cross-page shot-type rhythm scheduler.
 *
 * A 30-page book composed by independent per-page solvers ends up
 * looking like 30 same-shot pages (because the per-page solver doesn't
 * know what page came before). The fix is a book-level Markov chain
 * that explicitly samples shot types with anti-repeat penalties and
 * pacing constraints, BEFORE the per-page composition runs.
 *
 * Vocabulary from the composition research:
 *   1. wide_establishing      — landscape, distant subject
 *   2. medium_two_shot        — two characters in frame at midrange
 *   3. close_up               — single subject, head-and-shoulders
 *   4. extreme_close          — eye/object detail
 *   5. full_spread_panorama   — landscape spread, no center subject
 *   6. vignette               — soft-edged, single emotional moment
 *   7. text_only_breather     — minimal illustration, text feature
 *   8. character_only_silhouette — subject against blank/paper bg
 *
 * Constraints (enforced via Metropolis-Hastings on full sequences):
 *   - No more than 2 consecutive same-shot pages
 *   - At least 1 full_spread_panorama every 6 pages
 *   - At least 1 text_only_breather every 8 pages
 *   - Total shot-type entropy > 0.75 × log2(N_shot_types)
 *   - The climax beat (pp 24-27) defaults to close_up or full_spread
 */

import { mulberry32, hashString } from '../rng';
import { dLog } from '../math/det-math';

export type ShotType =
  | 'wide_establishing'
  | 'medium_two_shot'
  | 'close_up'
  | 'extreme_close'
  | 'full_spread_panorama'
  | 'vignette'
  | 'text_only_breather'
  | 'character_only_silhouette';

export const ALL_SHOT_TYPES: ShotType[] = [
  'wide_establishing',
  'medium_two_shot',
  'close_up',
  'extreme_close',
  'full_spread_panorama',
  'vignette',
  'text_only_breather',
  'character_only_silhouette',
];

const N = ALL_SHOT_TYPES.length;

// ── Transition matrix: P(next | prev). Penalize same-shot transitions. ──
// Rows are "prev"; columns are "next". Each row sums to 1.
function buildTransitionMatrix(): number[][] {
  const M: number[][] = [];
  for (let i = 0; i < N; i++) {
    M.push(new Array(N).fill(0));
    let total = 0;
    for (let j = 0; j < N; j++) {
      // Penalty for same shot — much lower probability.
      let p = i === j ? 0.05 : 1.0;
      // Slight extra penalty for very similar shots (close_up + extreme_close).
      const a = ALL_SHOT_TYPES[i];
      const b = ALL_SHOT_TYPES[j];
      if ((a === 'close_up' && b === 'extreme_close') || (a === 'extreme_close' && b === 'close_up')) {
        p *= 0.4;
      }
      if ((a === 'wide_establishing' && b === 'full_spread_panorama') || (a === 'full_spread_panorama' && b === 'wide_establishing')) {
        p *= 0.4;
      }
      // Slight extra encouragement for variety transitions.
      if (a === 'text_only_breather' && b !== 'text_only_breather') {
        p *= 1.5;
      }
      M[i][j] = p;
      total += p;
    }
    for (let j = 0; j < N; j++) M[i][j] /= total;
  }
  return M;
}

// ── Sequence energy: lower is better ──
function sequenceEnergy(seq: ShotType[], pageBeats: ShotType[] | null): number {
  let e = 0;
  // 1. No more than 2 consecutive same-shot.
  for (let i = 2; i < seq.length; i++) {
    if (seq[i] === seq[i - 1] && seq[i - 1] === seq[i - 2]) e += 5;
  }
  // 2. At least 1 full_spread_panorama every 6 pages.
  for (let i = 0; i + 6 <= seq.length; i += 6) {
    if (!seq.slice(i, i + 6).includes('full_spread_panorama')) e += 3;
  }
  // 3. At least 1 text_only_breather every 8 pages.
  for (let i = 0; i + 8 <= seq.length; i += 8) {
    if (!seq.slice(i, i + 8).includes('text_only_breather')) e += 2;
  }
  // 4. Entropy target.
  const counts = new Array(N).fill(0);
  for (const s of seq) counts[ALL_SHOT_TYPES.indexOf(s)]++;
  let entropy = 0;
  const LN2 = 0.6931471805599453;
  for (const c of counts) {
    if (c > 0) {
      const p = c / seq.length;
      entropy -= p * (dLog(p) / LN2);
    }
  }
  const targetEntropy = 0.75 * (dLog(N) / LN2);
  if (entropy < targetEntropy) e += (targetEntropy - entropy) * 6;
  // 5. Page-beat lock (climax page → close_up or full_spread).
  if (pageBeats) {
    for (let i = 0; i < seq.length && i < pageBeats.length; i++) {
      if (pageBeats[i] && seq[i] !== pageBeats[i]) e += 4;
    }
  }
  return e;
}

// ── Sample a starting sequence by following the Markov chain ──
function sampleSequence(rng: () => number, length: number, M: number[][]): ShotType[] {
  const seq: ShotType[] = [];
  // First page: weighted by row-sum of the matrix (which is just uniform here).
  let prevIdx = Math.floor(rng() * N);
  seq.push(ALL_SHOT_TYPES[prevIdx]);
  for (let i = 1; i < length; i++) {
    const row = M[prevIdx];
    const r = rng();
    let cum = 0;
    let nextIdx = 0;
    for (let j = 0; j < N; j++) {
      cum += row[j];
      if (cum >= r) {
        nextIdx = j;
        break;
      }
    }
    seq.push(ALL_SHOT_TYPES[nextIdx]);
    prevIdx = nextIdx;
  }
  return seq;
}

// ── Metropolis-Hastings refinement ──
function refine(
  initial: ShotType[],
  rng: () => number,
  pageBeats: ShotType[] | null,
  iterations: number = 1000,
): ShotType[] {
  let current = initial.slice();
  let currentE = sequenceEnergy(current, pageBeats);
  for (let it = 0; it < iterations; it++) {
    // Propose: swap one page's shot type to a different one.
    const i = Math.floor(rng() * current.length);
    // If this page has a locked beat, skip.
    if (pageBeats && pageBeats[i]) continue;
    const newShot = ALL_SHOT_TYPES[Math.floor(rng() * N)];
    if (newShot === current[i]) continue;
    const candidate = current.slice();
    candidate[i] = newShot;
    const candidateE = sequenceEnergy(candidate, pageBeats);
    const dE = candidateE - currentE;
    // Accept if better, or with probability exp(-dE / T) — here T=1.
    if (dE <= 0 || rng() < approxExpNegative(dE)) {
      current = candidate;
      currentE = candidateE;
    }
  }
  return current;
}

/** Deterministic exp(-x) approximation for the Metropolis acceptance step. */
function approxExpNegative(x: number): number {
  if (x >= 10) return 0;
  if (x <= 0) return 1;
  // 1/(1 + x + x²/2 + x³/6 + x⁴/24) is a smooth proxy with the right
  // limits and shape, deterministic.
  return 1 / (1 + x + x * x * 0.5 + x * x * x * 0.16666667 + x * x * x * x * 0.04166667);
}

// ── Public API ──

/**
 * Schedule shot types for a book of N pages.
 *
 * Optionally accepts a `pageBeats` array — same length as `pageCount`,
 * with entries either null (free) or a forced shot type (e.g., the
 * climax pages locked to close_up).
 *
 * Same `bookSeed` → same sequence forever.
 */
export function scheduleShotTypes(
  pageCount: number,
  bookSeed: string | number,
  pageBeats: (ShotType | null)[] | null = null,
): ShotType[] {
  const seedNum = typeof bookSeed === 'string' ? hashString('shot:' + bookSeed) : bookSeed;
  const rng = mulberry32(seedNum);
  const M = buildTransitionMatrix();
  const initial = sampleSequence(rng, pageCount, M);
  const beats = pageBeats ? pageBeats.map((b) => (b ?? null) as ShotType) : null;
  // If beats has nulls, replace with the initial pick for the energy
  // calculation but mark the slot as "locked = no" for refinement.
  // Simpler: treat the beats vector as "forced if non-null."
  const forcedBeats: ShotType[] | null = pageBeats
    ? pageBeats.map((b, i) => (b !== null ? b : initial[i]))
    : null;
  // Lock the forced beats in the initial sequence so refinement starts
  // from a valid state.
  if (pageBeats) {
    for (let i = 0; i < pageBeats.length; i++) {
      if (pageBeats[i] !== null) initial[i] = pageBeats[i] as ShotType;
    }
  }
  return refine(initial, rng, forcedBeats, 1500);
}

/**
 * Default page-beat lock for a 32-page picture book: climax pages get
 * dramatic shots, opening and closing visual rhyme each other (both
 * full_spread).
 */
export function defaultBeats32(): (ShotType | null)[] {
  const beats: (ShotType | null)[] = new Array(32).fill(null);
  // Opening spread (pp 4-5)
  beats[3] = 'wide_establishing';
  beats[4] = 'wide_establishing';
  // Inciting incident (pp 6-7) — close_up to introduce conflict
  beats[5] = 'close_up';
  beats[6] = 'medium_two_shot';
  // Crisis (pp 22-23) — vignette
  beats[21] = 'vignette';
  beats[22] = 'vignette';
  // Climax (pp 24-27) — full_spread + close_up
  beats[23] = 'full_spread_panorama';
  beats[24] = 'full_spread_panorama';
  beats[25] = 'close_up';
  beats[26] = 'extreme_close';
  // Resolution + closing spread (pp 30-31)
  beats[29] = 'wide_establishing';
  beats[30] = 'wide_establishing';
  return beats;
}
