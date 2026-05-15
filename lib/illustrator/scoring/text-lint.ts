/**
 * Text linters that run without an LLM.
 *
 * The full Sprint 8 text-authoring stack uses a VLM (Claude/GPT-4V) for
 * counterpoint scoring (image captioning + comparison to page text).
 * These deterministic linters cover the structural rules and the
 * lexical heuristics that don't need vision/LLM.
 */

// ─── Dale-Chall vocabulary check (simplified, no full word list) ────────────
//
// In production, ship the Dale-Chall 3000-word list as a JSON blob and
// compute the unfamiliar-word fraction. Here we implement the shape of
// the check and gate it behind a list-provider injection so the actual
// list can be wired in by deployment.

export type WordListProvider = {
  isFamiliar(word: string): boolean;
};

export function daleChallDifficultPercent(text: string, list: WordListProvider): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z' ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return 0;
  let unfamiliar = 0;
  for (const w of words) {
    if (!list.isFamiliar(w)) unfamiliar++;
  }
  return unfamiliar / words.length;
}

// ─── Refrain detection ─────────────────────────────────────────────────────

/**
 * Find n-grams that repeat across pages. Suggests a refrain might be
 * possible if the book is ages 3-5 and no refrain is detected.
 */
export function detectRefrains(perPageTexts: string[], minNgramLen = 3, minOccurrences = 3): string[] {
  const counts = new Map<string, number>();
  for (const pageText of perPageTexts) {
    const words = pageText
      .toLowerCase()
      .replace(/[^a-z' ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const seenThisPage = new Set<string>();
    for (let n = minNgramLen; n <= 6; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n).join(' ');
        if (seenThisPage.has(gram)) continue;
        seenThisPage.add(gram);
        counts.set(gram, (counts.get(gram) || 0) + 1);
      }
    }
  }
  const refrains: string[] = [];
  for (const [gram, n] of counts) {
    if (n >= minOccurrences) refrains.push(gram);
  }
  // Sort by length descending, then count.
  refrains.sort((a, b) => b.length - a.length || (counts.get(b)! - counts.get(a)!));
  return refrains;
}

// ─── Page-turn tension ─────────────────────────────────────────────────────

/**
 * Heuristic: a right-hand-page-ending should leave the reader wanting
 * to turn. We approximate "tension" by checking the last sentence's
 * structure: ending with a question mark, an ellipsis, an incomplete-
 * looking phrase, or an action verb suggesting consequence.
 *
 * For real production, this should be augmented with an LLM check that
 * reads the text + the next page and confirms the turn pays off.
 */
const TENSION_END_PATTERNS = [
  /\?\s*$/,
  /\.\.\.\s*$/,
  /…\s*$/,
  /\b(suddenly|then|but|until|when|wonder|what if|will|going to)\b[^.]*$/i,
];

export function hasPageTurnTension(pageText: string): boolean {
  const trimmed = pageText.trim();
  if (trimmed.length === 0) return false;
  // Last sentence.
  const sentences = trimmed.split(/[.!]\s+/);
  const last = sentences[sentences.length - 1];
  return TENSION_END_PATTERNS.some((re) => re.test(last));
}

// ─── Show-don't-tell ───────────────────────────────────────────────────────

const EMOTION_TELL_WORDS = [
  'happy', 'sad', 'angry', 'scared', 'afraid', 'lonely', 'excited',
  'mad', 'frustrated', 'worried', 'nervous', 'proud', 'embarrassed',
  'jealous', 'curious', 'confused', 'tired', 'sleepy', 'bored',
];

export function emotionTellRate(text: string): { rate: number; words: string[] } {
  const words = text
    .toLowerCase()
    .replace(/[^a-z' ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return { rate: 0, words: [] };
  const found: string[] = [];
  for (const w of words) {
    if (EMOTION_TELL_WORDS.includes(w)) found.push(w);
  }
  return { rate: found.length / words.length, words: found };
}

// ─── Read-aloud awkwardness ────────────────────────────────────────────────

/** Phoneme-cluster heuristic: detect tongue-twisters by consonant density. */
export function readAloudAwkwardness(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 0;
  // Score each word by consonant-cluster length, normalize.
  let total = 0;
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z]/g, '');
    let maxCluster = 0;
    let cur = 0;
    for (const ch of lower) {
      if (/[bcdfghjklmnpqrstvwxz]/.test(ch)) {
        cur++;
        if (cur > maxCluster) maxCluster = cur;
      } else {
        cur = 0;
      }
    }
    if (maxCluster >= 4) total += 1;
  }
  return total / words.length;
}

// ─── Word count + age-band gate ────────────────────────────────────────────

export type AgeBand = 'board' | 'picture-3-5' | 'picture-5-7' | 'early-reader' | 'chapter';

export type WordCountResult = {
  totalWords: number;
  perPageMax: number;
  withinCap: boolean;
  perPageCap: number;
  totalCap: number;
};

const AGE_BAND_LIMITS: Record<AgeBand, { perPage: number; total: number }> = {
  board: { perPage: 10, total: 50 },
  'picture-3-5': { perPage: 25, total: 300 },
  'picture-5-7': { perPage: 60, total: 600 },
  'early-reader': { perPage: 80, total: 2500 },
  chapter: { perPage: 200, total: 12000 },
};

export function checkWordCount(perPageTexts: string[], band: AgeBand): WordCountResult {
  const caps = AGE_BAND_LIMITS[band];
  let total = 0;
  let perPageMax = 0;
  for (const pageText of perPageTexts) {
    const wc = pageText.split(/\s+/).filter((w) => w.length > 0).length;
    total += wc;
    if (wc > perPageMax) perPageMax = wc;
  }
  return {
    totalWords: total,
    perPageMax,
    withinCap: total <= caps.total && perPageMax <= caps.perPage,
    perPageCap: caps.perPage,
    totalCap: caps.total,
  };
}
