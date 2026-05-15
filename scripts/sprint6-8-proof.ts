#!/usr/bin/env node
/**
 * scripts/sprint6-8-proof.ts
 *
 * Demonstrates the deterministic scoring + text-linting + voice-extraction
 * layers running today (no ML models or LLM calls — those are wired
 * upstream of the renderer boundary in production).
 */

import { compositionMetrics, harmonyScore, paletteRestraint, lintBookCraft } from '../lib/illustrator/scoring/deterministic';
import {
  detectRefrains,
  hasPageTurnTension,
  emotionTellRate,
  readAloudAwkwardness,
  checkWordCount,
} from '../lib/illustrator/scoring/text-lint';
import { extractVoiceFromSamples, voiceSimilarity, vocabularyTier } from '../lib/illustrator/text/voice';
import { seedArtist } from '../lib/illustrator/artist';

console.log('─── 1. Composition metrics ───────────────────────────────');
const composition = compositionMetrics(
  [
    { kind: 'character', x: 250, y: 360, w: 120, h: 180, saliency: 0.9 },
    { kind: 'prop', x: 480, y: 460, w: 80, h: 80, saliency: 0.4 },
    { kind: 'prop', x: 80, y: 280, w: 60, h: 120, saliency: 0.5 },
    { kind: 'text', x: 60, y: 60, w: 700, h: 60, saliency: 0.3 },
  ],
  { width: 800, height: 600 },
);
console.log('  ', JSON.stringify(composition, null, 2));

console.log('\n─── 2. Color harmony (Matsuda template fit) ────────────────');
// Pip's anchor palette
const artist = seedArtist('demo-author', { anchor: 'pip' });
console.log('  artist palette:', artist.palette);
const harmony = harmonyScore(artist.palette);
console.log('  ', JSON.stringify(harmony));

console.log('\n─── 3. Palette restraint (chroma audit) ───────────────────');
console.log('  ', JSON.stringify(paletteRestraint(artist.palette)));
console.log('  HOT palette (should violate):');
console.log('  ', JSON.stringify(paletteRestraint(['#ff0000', '#00ff00', '#0000ff', '#ff00ff'])));

console.log('\n─── 4. Book-craft lint ─────────────────────────────────────');
const okBook = lintBookCraft({
  pageCount: 32,
  climaxPageIndex: 25,
  ageBand: 'picture-5-7',
  bodyFont: 'EB Garamond',
  bodyFontSizePt: 20,
  perPageWordCounts: [12, 18, 22, 8, 15, 25, 20, 18, 30, 22, 15, 18, 12, 20, 25, 18, 15, 22, 20, 18, 25, 30, 22, 12, 8, 15, 18, 20, 12, 8, 0, 0],
});
console.log('  OK book:', JSON.stringify(okBook));
const badBook = lintBookCraft({
  pageCount: 31, // not multiple of 8
  climaxPageIndex: 15, // wrong
  ageBand: 'picture-3-5',
  bodyFont: 'Comic Sans MS', // blocked
  bodyFontSizePt: 12, // wrong for age
  perPageWordCounts: new Array(31).fill(50), // over per-page cap
});
console.log('  BAD book:', JSON.stringify(badBook));

console.log('\n─── 5. Text-lint heuristics ────────────────────────────────');
const goodSpread = 'Pip stepped out of his burrow. Where would the path lead today?';
console.log('  page-turn tension on "...path lead today?":', hasPageTurnTension(goodSpread));
console.log('  page-turn tension on flat ending:', hasPageTurnTension('Pip walked home.'));

const tellingText = 'Pip was very happy and excited but also a little nervous and scared.';
const tell = emotionTellRate(tellingText);
console.log('  emotion-tell rate (high):', tell);
console.log('  emotion-tell rate on showing text:', emotionTellRate(
  'Pip\'s ears stood straight up. He took a small step closer to the glowing mushroom.',
));

console.log('  read-aloud awkwardness (tongue-twister):', readAloudAwkwardness('strict scripts'));
console.log('  read-aloud awkwardness (easy):', readAloudAwkwardness('the pip rabbit hopped'));

console.log('\n─── 6. Refrain detection ───────────────────────────────────');
const repeatingBook = [
  'Brown bear, brown bear, what do you see?',
  'I see a red bird looking at me.',
  'Red bird, red bird, what do you see?',
  'I see a yellow duck looking at me.',
  'Yellow duck, yellow duck, what do you see?',
];
console.log('  refrains:', detectRefrains(repeatingBook, 3, 2));

console.log('\n─── 7. Word count per age band ─────────────────────────────');
const wc = checkWordCount(
  ['Pip stepped out.', 'The path was new.', 'He felt small.', 'A mushroom glowed.'],
  'picture-3-5',
);
console.log('  ', JSON.stringify(wc));

console.log('\n─── 8. Voice signature extraction ──────────────────────────');
const samples = [
  {
    source: 'page-1.txt',
    text: 'In the small green meadow, where the dew lay thick on every blade of grass, a rabbit named Pip stretched and yawned. He looked toward the trees.',
  },
  {
    source: 'page-2.txt',
    text: 'The wind whispered through the leaves. Pip\'s ears tilted forward. Somewhere, a small stream sang to itself.',
  },
  {
    source: 'page-3.txt',
    text: 'Pip stepped carefully. The world was wide and strange, but Pip was small and brave, and that was a kind of magic too.',
  },
];
const voice = extractVoiceFromSamples('author-pip-001', samples);
console.log('  ', JSON.stringify({
  pov: voice.pointOfView,
  avgLen: voice.averageSentenceLength.toFixed(2),
  variance: voice.sentenceLengthVariance.toFixed(2),
  tier: voice.vocabularyTier,
  topPhrases: voice.characteristicPhrases.slice(0, 5),
}, null, 2));

console.log('\n─── 9. Voice-similarity drift detection ───────────────────');
const onVoice = 'In the small dim burrow, Pip yawned and stretched, and the morning light slipped in.';
const offVoice = 'OMG Pip was like sooo tired. He literally couldn\'t even with the sunrise.';
console.log('  on-voice similarity:', voiceSimilarity(onVoice, voice).toFixed(3));
console.log('  off-voice similarity:', voiceSimilarity(offVoice, voice).toFixed(3));

// Ensure the unused imports are still useful for type-checking.
void vocabularyTier;
console.log('\n✓ All deterministic scorers + linters + voice tools run successfully.');
