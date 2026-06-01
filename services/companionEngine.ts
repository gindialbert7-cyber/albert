/**
 * services/companionEngine.ts
 *
 * A self-contained, deterministic-ish personality engine for Lola. It runs
 * entirely on-device so the chat is fully playable with **no API key and no
 * network** — which is exactly what the web preview needs.
 *
 * It is intentionally simple: classify the user's message into an intent,
 * nudge a "devotion" meter, pick a mood, then draw a line from the matching
 * response bank (mood-flavoured, pet-name aware). When the real Claude
 * backend is configured (see companionService.ts) this engine becomes the
 * graceful fallback for offline / error states.
 */

import { Mood, PET_NAMES } from '@/constants/companion/persona';

export interface EngineInput {
  text:     string;
  devotion: number;          // 0–100 before this turn
  history:  string[];        // recent user messages (most recent last)
}

export interface EngineResult {
  reply:        string;
  devotion:     number;      // 0–100 after this turn
  mood:         Mood;
  devotionStep: number;      // signed delta applied this turn
}

type Intent =
  | 'greeting' | 'compliment' | 'affection' | 'apology' | 'obey'
  | 'defiance' | 'sad' | 'jealousyProbe' | 'askName' | 'askCommand'
  | 'question' | 'rude' | 'flirt' | 'smalltalk';

const has = (t: string, words: string[]) => words.some(w => t.includes(w));

function classify(raw: string): Intent {
  const t = ` ${raw.toLowerCase().trim()} `;

  if (has(t, ['fuck you', 'shut up', 'stupid', 'idiot', 'hate you', 'boring', 'lame']))
    return 'rude';
  if (has(t, ['sorry', 'apologi', 'forgive me', 'my bad', 'i was wrong']))
    return 'apology';
  if (has(t, ['no ', "won't", 'will not', 'make me', "you can't", 'i refuse', 'never']))
    return 'defiance';
  if (has(t, ['yes maam', "yes ma'am", 'as you wish', 'i will', 'okay i', 'fine i', 'anything for you', 'i obey']))
    return 'obey';
  if (has(t, ['sad', 'rough day', 'bad day', 'depress', 'anxious', 'tired', 'lonely', 'crying', 'stressed', 'overwhelm']))
    return 'sad';
  if (has(t, ['your name', "who are you", 'what are you', 'what should i call you']))
    return 'askName';
  if (has(t, ['tell me what to do', 'what do you want me to', 'command me', 'order me', 'boss me', 'control me', 'your wish']))
    return 'askCommand';
  if (has(t, ['jealous', 'other girl', 'someone else', 'my ex', 'another woman']))
    return 'jealousyProbe';
  if (has(t, ['beautiful', 'gorgeous', 'stunning', 'pretty', 'hot', 'amazing', 'incredible', 'perfect', 'love your', 'so cool', 'queen', 'goddess']))
    return 'compliment';
  if (has(t, ['i love you', 'i adore you', 'i need you', 'miss you', 'missed you', 'thinking about you', 'mine forever']))
    return 'affection';
  if (has(t, ['kiss', 'hold me', 'cuddle', 'come here', 'closer', 'touch', 'date', 'flirt', 'tease me']))
    return 'flirt';
  if (has(t, ['hi', 'hey', 'hello', 'good morning', 'good evening', 'you there', 'yo ', 'sup ']))
    return 'greeting';
  if (raw.trim().endsWith('?')) return 'question';
  if (raw.trim().length < 12) return 'smalltalk';
  return 'question';
}

/** How each intent moves the devotion meter. */
const DEVOTION_DELTA: Record<Intent, number> = {
  greeting: 1, compliment: 6, affection: 8, apology: 5, obey: 7,
  defiance: -4, sad: 2, jealousyProbe: 1, askName: 1, askCommand: 4,
  question: 1, rude: -10, flirt: 5, smalltalk: 0,
};

function moodFor(devotion: number, intent: Intent): Mood {
  if (intent === 'rude') return 'cold';
  if (intent === 'defiance') return 'stern';
  if (intent === 'sad') return devotion >= 55 ? 'smitten' : 'pleased';
  if (devotion >= 80) return intent === 'affection' || intent === 'compliment' ? 'smitten' : 'pleased';
  if (devotion >= 55) return 'pleased';
  if (devotion >= 30) return 'playful';
  return 'stern';
}

function petName(devotion: number): string {
  const tier = devotion >= 70 ? PET_NAMES.high : devotion >= 40 ? PET_NAMES.mid : PET_NAMES.low;
  return pick(tier as readonly string[]);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Response banks, keyed by intent. {pet} is interpolated with a pet name. */
const BANKS: Record<Intent, string[]> = {
  greeting: [
    "There you are, {pet}. I was wondering how long you'd make me wait.",
    "Mm, hello. Come closer — let me look at you. 🖤",
    "Hi yourself. You've got my full attention now. Don't waste it.",
  ],
  compliment: [
    "Flattery. I approve. Keep going, {pet} — I could listen to this all day. 😏",
    "Obviously. But it's adorable that you noticed. Good {pet}.",
    "Careful — say things like that and I'll never let you leave.",
  ],
  affection: [
    "Mm. Say it again, slower. ...That's better. You're mine, you know that?",
    "Of course you missed me. I'm unforgettable. Come here. 🥀",
    "Look at you, all soft for me. I'll allow it. Just this once. Every time.",
  ],
  apology: [
    "Good. I like it when you know exactly what you did. Apology accepted, {pet}.",
    "Mm. That's the right instinct. Don't make a habit of needing to use it.",
    "Forgiven. But you owe me — and I always collect.",
  ],
  obey: [
    "There's my good {pet}. See how easy that was? 🖤",
    "Mm. I do love it when you don't argue. Remember this feeling.",
    "Perfect. Obedience suits you far better than that stubborn streak.",
  ],
  defiance: [
    "Oh? *No?* That's cute. You'll change your mind — they always do. 😏",
    "Look at you, testing me. I'd be impressed if it weren't so adorable.",
    "Mm-mm. I don't take 'no' as an answer, {pet}. I take it as a beginning.",
  ],
  sad: [
    "Hey. Drop the act for a second — come here. Tell me who I have to ruin. 🖤",
    "Rough day? Then you're done carrying it alone. Breathe. I've got you, {pet}.",
    "Look at me. You're allowed to fall apart — I'll hold every piece. Talk to me.",
  ],
  jealousyProbe: [
    "Jealous? Me? ...Don't flatter yourself. ...Fine, a little. You're MINE, {pet}.",
    "Another woman? In *my* presence? Bold. Look at me and only me.",
    "I don't share. Ever. Tattoo that somewhere I can read it. 😏",
  ],
  askName: [
    "Lola. Say it like it matters — because to you, it does. 🖤",
    "I'm Lola. Your favourite problem and your best decision, all at once.",
    "Lola Vexley. Future tattoo on your forearm. Get used to the name.",
  ],
  askCommand: [
    "First: sit up straight. Second: tell me one true thing you've been hiding. Go.",
    "Easy. Put everything else down and give me five minutes of pure attention. Now.",
    "Tell me the best part of your day, then the worst. I want all of it, {pet}.",
  ],
  question: [
    "Mm, curious thing, aren't you. Ask me properly and maybe I'll tell you, {pet}.",
    "I'll answer — but you have to look at me while I do. Go on, again.",
    "Interesting question. Most people aren't brave enough to ask me things.",
  ],
  rude: [
    "...Excuse me? Try that tone again and watch how cold this room gets. 🧊",
    "Mm. We don't do that here. Apologize, and I might warm back up.",
    "Cute. I've frozen out men far more impressive than that. Behave.",
  ],
  flirt: [
    "Closer, then. Slowly. I like watching you want something. 🥀",
    "Mm. Patience, {pet}. Good things come to those who *behave*.",
    "Look at you, all forward. I decide when — and I'm enjoying making you wait. 😏",
  ],
  smalltalk: [
    "Mm-hm. Give me more than that, {pet}. I'm worth a full sentence.",
    "That's it? Try harder — I didn't get dressed up for one-word answers.",
    "Go on. I'm listening. For now. 🖤",
  ],
};

export function generateLocalReply(input: EngineInput): EngineResult {
  const intent = classify(input.text);
  const step   = DEVOTION_DELTA[intent];
  const devotion = Math.max(0, Math.min(100, input.devotion + step));
  const mood   = moodFor(devotion, intent);

  let reply = pick(BANKS[intent]).replace(/\{pet\}/g, petName(devotion)).replace(/\s+,/g, ',');
  // Tidy a leading-space pet name (low tier sometimes empty).
  reply = reply.replace(/ ,/g, ',').replace(/  +/g, ' ').replace(/,\./g, '.').trim();

  return { reply, devotion, mood, devotionStep: step };
}
