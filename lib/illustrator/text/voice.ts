/**
 * Voice signature — the per-author text style parallel to the Artist.
 *
 * From the text-authoring research: the single best defense against
 * "generic ChatGPT children's book voice" is conditioning every LLM
 * call on the author's own voice — extracted from 3–5 of their
 * existing writing samples or pages they like.
 *
 * The Voice is a structured record (not just an embedding) so it can
 * be authored manually, edited, and inspected. Production also computes
 * a vector embedding via SigLIP-text or a sentence-transformer and
 * caches it for similarity-drift detection.
 */

export type VoiceSignature = {
  id: string;
  /** Bound to the authorId so the Voice persists with the account. */
  authorId: string;

  // Lexical signatures
  averageSentenceLength: number;     // in words
  sentenceLengthVariance: number;
  vocabularyTier: 'simple' | 'mixed' | 'rich';
  preferredPunctuation: ('em-dash' | 'comma' | 'semicolon' | 'parenthetical' | 'ellipsis')[];
  characteristicPhrases: string[];

  // Narrative voice
  pointOfView: 'first-person' | 'second-person' | 'third-person-omniscient' | 'third-person-limited';
  narratorWarmth: 'cool' | 'neutral' | 'warm' | 'effusive';
  sentimentArc: 'rising' | 'falling' | 'oscillating' | 'steady';

  // Mood
  whimsy: number; // 0..1
  gravity: number; // 0..1
  surprise: number; // 0..1 (frequency of unexpected turns)

  // Vocabulary domains the author leans on
  metaphorDomains: string[];

  // Sample texts kept for few-shot prompting
  samples: { source: string; text: string }[];
};

// ─── Universe-level Lexicon ────────────────────────────────────────────────

export type UniverseLexicon = {
  /** Catchphrases the cast says ("Oh, fish-sticks!"). */
  catchphrases: { speakerId: string; phrase: string }[];
  /** In-world terms with canonical spellings ("the Whispering Wood"). */
  canonicalTerms: { term: string; meaning: string; spelling: string }[];
  /** Established world rules ("the pond freezes in winter"). */
  worldRules: string[];
  /** Forbidden vocabulary (anachronism, off-tone). */
  bannedVocab: string[];
  /** Preferred vocabulary (in-genre, on-tone). */
  preferredVocab: string[];
};

// ─── Lexical analysis ─────────────────────────────────────────────────────

/** Compute average sentence length + variance from a corpus. */
export function lexicalStats(text: string): { avgLen: number; variance: number } {
  const sentences = text.split(/[.!?]\s+/).filter((s) => s.length > 0);
  if (sentences.length === 0) return { avgLen: 0, variance: 0 };
  const lengths = sentences.map((s) => s.split(/\s+/).filter((w) => w.length > 0).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  let v = 0;
  for (const l of lengths) v += (l - avg) * (l - avg);
  return { avgLen: avg, variance: v / lengths.length };
}

/** Detect characteristic phrases via repeated n-grams across samples. */
export function detectCharacteristicPhrases(samples: string[], minOccurrences = 3): string[] {
  const counts = new Map<string, number>();
  for (const sample of samples) {
    const words = sample
      .toLowerCase()
      .replace(/[^a-z' ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const seen = new Set<string>();
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n).join(' ');
        if (seen.has(gram)) continue;
        seen.add(gram);
        counts.set(gram, (counts.get(gram) || 0) + 1);
      }
    }
  }
  const phrases: string[] = [];
  for (const [gram, n] of counts) {
    if (n >= minOccurrences) phrases.push(gram);
  }
  phrases.sort((a, b) => (counts.get(b)! - counts.get(a)!));
  return phrases.slice(0, 20);
}

/** Heuristic vocabulary tier from average word length + uniqueness. */
export function vocabularyTier(text: string): 'simple' | 'mixed' | 'rich' {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 'simple';
  const avgLen = words.reduce((a, w) => a + w.length, 0) / words.length;
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ''))).size;
  const variety = unique / words.length;
  if (avgLen < 4.2 || variety < 0.45) return 'simple';
  if (avgLen > 5.4 && variety > 0.6) return 'rich';
  return 'mixed';
}

// ─── Extract a Voice signature from samples ───────────────────────────────

export function extractVoiceFromSamples(
  authorId: string,
  samples: { source: string; text: string }[],
): VoiceSignature {
  const allText = samples.map((s) => s.text).join('\n\n');
  const { avgLen, variance } = lexicalStats(allText);
  const characteristicPhrases = detectCharacteristicPhrases(samples.map((s) => s.text));
  const tier = vocabularyTier(allText);

  // Crude POV detector: count "I", "you", "he/she/they" frequencies in the
  // first 200 words of each sample.
  let firstP = 0;
  let secondP = 0;
  let thirdP = 0;
  for (const sample of samples) {
    const words = sample.text.toLowerCase().split(/\s+/).slice(0, 200);
    for (const w of words) {
      if (w === 'i' || w === 'me' || w === 'my' || w === "i'm") firstP++;
      else if (w === 'you' || w === 'your') secondP++;
      else if (w === 'he' || w === 'she' || w === 'they' || w === 'her' || w === 'his' || w === 'them') thirdP++;
    }
  }
  const pov: VoiceSignature['pointOfView'] =
    firstP > secondP && firstP > thirdP
      ? 'first-person'
      : secondP > firstP && secondP > thirdP
      ? 'second-person'
      : 'third-person-limited';

  return {
    id: 'voice-' + authorId,
    authorId,
    averageSentenceLength: avgLen,
    sentenceLengthVariance: variance,
    vocabularyTier: tier,
    preferredPunctuation: [], // refined later
    characteristicPhrases,
    pointOfView: pov,
    narratorWarmth: 'warm', // default; refined by LLM analysis offline
    sentimentArc: 'rising', // default
    whimsy: 0.6,
    gravity: 0.3,
    surprise: 0.5,
    metaphorDomains: [],
    samples,
  };
}

// ─── Voice-drift detection ─────────────────────────────────────────────────

/**
 * Compute a similarity score between a candidate text and the author's
 * Voice signature, deterministically from lexical features (no
 * embedding required). Useful as the first-stage drift gate before
 * the embedding-based scorer.
 */
export function voiceSimilarity(text: string, voice: VoiceSignature): number {
  const stats = lexicalStats(text);
  const tier = vocabularyTier(text);

  // Distance components.
  const dLen = Math.abs(stats.avgLen - voice.averageSentenceLength) / Math.max(8, voice.averageSentenceLength);
  const dVar = Math.abs(stats.variance - voice.sentenceLengthVariance) / Math.max(8, voice.sentenceLengthVariance);
  const dTier =
    tier === voice.vocabularyTier ? 0 : tier === 'mixed' || voice.vocabularyTier === 'mixed' ? 0.3 : 0.8;

  // Check how many characteristic phrases appear in the candidate.
  let phraseHits = 0;
  const lowerText = text.toLowerCase();
  for (const p of voice.characteristicPhrases) {
    if (lowerText.includes(p)) phraseHits++;
  }
  const phraseSignal = Math.min(1, phraseHits / Math.max(1, voice.characteristicPhrases.length * 0.5));

  // Combine: similarity is 1 minus weighted distance.
  const dist = Math.min(1, 0.4 * dLen + 0.3 * dVar + 0.3 * dTier);
  return Math.max(0, Math.min(1, 0.7 * (1 - dist) + 0.3 * phraseSignal));
}
