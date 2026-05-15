/**
 * Diversity & representation schema.
 *
 * The Character anatomy schema must span human diversity from day 1.
 * No `race` or `ethnicity` field exists in the schema or anywhere in
 * the system — physical features are fully independent parameters,
 * freely composable. This:
 *   - prevents the system being used for stereotyped generation
 *   - prevents implicit racial categorization in training data
 *   - maps to how real human variation actually works (features don't
 *     cluster cleanly by "race")
 *   - defangs negligent-enablement vectors for trademark / character
 *     misuse
 *
 * Skin tone is parameterized by the Monk Skin Tone (MST) Scale (10
 * tones, Dr. Ellis Monk / Google 2022) — current best-practice for
 * representational illustration. Internally stored as OkLCh continuous
 * values to allow smooth shading. Undertone is a separate parameter.
 *
 * Hair texture is a continuous curl-pattern parameter (straight → coil)
 * plus a discrete style enum (40+ named styles rendered with equal
 * authorial care across all textures).
 *
 * Facial features are independent sliders (eye shape, nose bridge,
 * lip thickness, etc.) — NEVER bundled "ethnic presets."
 *
 * Mobility/sensory aids and body differences are first-class character
 * data, present in stock examples, not buried in "advanced options."
 */

// ─── Skin tone (Monk Skin Tone Scale 1-10 + undertone) ───────────────────────

export type MonkSkinTone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Hex colors approximating each MST tone, in a paper-light context. */
export const MST_HEX: Record<MonkSkinTone, string> = {
  1: '#f6e0d2',
  2: '#f1d4bf',
  3: '#e8c2a4',
  4: '#d8a98a',
  5: '#bd8665',
  6: '#9c6646',
  7: '#7a4e35',
  8: '#5a3825',
  9: '#3e2517',
  10: '#27160d',
};

export type SkinUndertone = 'cool' | 'neutral' | 'warm';

// ─── Hair ───────────────────────────────────────────────────────────────────

/** Curl pattern 0..1: 0 = straight, 0.25 = wavy, 0.5 = curly, 0.75 = coily,
 *  1.0 = tight coil (Type 4c-equivalent). Continuous so artists can
 *  interpolate. */
export type HairCurlPattern = number;

export type HairStyle =
  // Loose styles
  | 'short-loose'
  | 'medium-loose'
  | 'long-loose'
  | 'bangs-straight'
  | 'bangs-side-swept'
  // Tied / pulled-back
  | 'ponytail-high'
  | 'ponytail-low'
  | 'pigtails'
  | 'bun-top'
  | 'bun-low'
  | 'space-buns'
  // Afro / volume
  | 'afro-low'
  | 'afro-medium'
  | 'afro-high'
  | 'puff-top'
  | 'puffs-side'
  // Braids
  | 'cornrows-straight'
  | 'cornrows-curved'
  | 'box-braids-short'
  | 'box-braids-long'
  | 'knotless-braids'
  | 'micro-braids'
  | 'fulani-braids'
  | 'lemonade-braids'
  | 'single-braid'
  | 'french-braid'
  | 'two-strand-braids'
  // Locks / twists
  | 'traditional-locs'
  | 'sister-locs'
  | 'faux-locs'
  | 'two-strand-twists'
  | 'flat-twists'
  | 'bantu-knots'
  // Cut / shaped
  | 'fade-low'
  | 'fade-high'
  | 'taper'
  | 'high-top'
  | 'undercut'
  | 'mohawk'
  | 'shaved'
  // Other
  | 'waves'
  | 'hair-bead-accent'
  | 'hijab-compatible-short'
  | 'kippah-compatible';

/** Hair-style metadata: which curl patterns is the style appropriate to? */
export const HAIR_STYLE_CURL_RANGE: Record<HairStyle, { min: number; max: number }> = {
  'short-loose': { min: 0, max: 0.5 },
  'medium-loose': { min: 0, max: 0.5 },
  'long-loose': { min: 0, max: 0.5 },
  'bangs-straight': { min: 0, max: 0.3 },
  'bangs-side-swept': { min: 0, max: 0.5 },
  'ponytail-high': { min: 0, max: 1 },
  'ponytail-low': { min: 0, max: 1 },
  pigtails: { min: 0, max: 1 },
  'bun-top': { min: 0, max: 1 },
  'bun-low': { min: 0, max: 1 },
  'space-buns': { min: 0, max: 1 },
  'afro-low': { min: 0.5, max: 1 },
  'afro-medium': { min: 0.6, max: 1 },
  'afro-high': { min: 0.6, max: 1 },
  'puff-top': { min: 0.5, max: 1 },
  'puffs-side': { min: 0.5, max: 1 },
  'cornrows-straight': { min: 0.5, max: 1 },
  'cornrows-curved': { min: 0.5, max: 1 },
  'box-braids-short': { min: 0.4, max: 1 },
  'box-braids-long': { min: 0.4, max: 1 },
  'knotless-braids': { min: 0.4, max: 1 },
  'micro-braids': { min: 0.4, max: 1 },
  'fulani-braids': { min: 0.5, max: 1 },
  'lemonade-braids': { min: 0.5, max: 1 },
  'single-braid': { min: 0, max: 0.7 },
  'french-braid': { min: 0, max: 0.7 },
  'two-strand-braids': { min: 0.3, max: 1 },
  'traditional-locs': { min: 0.6, max: 1 },
  'sister-locs': { min: 0.6, max: 1 },
  'faux-locs': { min: 0.4, max: 1 },
  'two-strand-twists': { min: 0.5, max: 1 },
  'flat-twists': { min: 0.5, max: 1 },
  'bantu-knots': { min: 0.5, max: 1 },
  'fade-low': { min: 0, max: 1 },
  'fade-high': { min: 0, max: 1 },
  taper: { min: 0, max: 1 },
  'high-top': { min: 0.5, max: 1 },
  undercut: { min: 0, max: 0.7 },
  mohawk: { min: 0, max: 1 },
  shaved: { min: 0, max: 1 },
  waves: { min: 0.2, max: 0.6 },
  'hair-bead-accent': { min: 0.4, max: 1 },
  'hijab-compatible-short': { min: 0, max: 1 },
  'kippah-compatible': { min: 0, max: 1 },
};

// ─── Facial features (independent sliders) ──────────────────────────────────

export type EyeShape =
  | 'almond'
  | 'round'
  | 'hooded'
  | 'monolid'
  | 'double-lid'
  | 'upturned'
  | 'downturned';

export type NoseTipShape = 'rounded' | 'pointed' | 'flat' | 'upturned';

export type MouthShape = 'rounded' | 'wide' | 'small' | 'heart-shaped';

export type ChinShape = 'rounded' | 'pointed' | 'square' | 'cleft';

export type FacialFeatures = {
  eyeShape: EyeShape;
  eyeSize: number;     // 0.7..1.3 multiplier
  eyeSpacing: number;  // 0.85..1.15 of head-width fraction
  irisColor: string;   // OkLCh-stored, hex output
  // Eyebrows
  browThickness: number; // 0.6..1.3
  browArch: number;      // 0..1 (0 = straight, 1 = pronounced)
  // Nose (independent params)
  noseBridgeHeight: number; // 0.6..1.3
  noseTipShape: NoseTipShape;
  nostrilWidth: number;     // 0.7..1.3
  noseLength: number;       // 0.7..1.3
  // Mouth
  lipUpperThickness: number; // 0.7..1.4
  lipLowerThickness: number; // 0.7..1.5
  mouthShape: MouthShape;
  cupidsBowDefinition: number; // 0..1
  // Face shape
  faceShape: 'round' | 'oval' | 'square' | 'heart' | 'long' | 'diamond';
  cheekbonePromenance: number; // 0.7..1.3
  chinWidth: number;  // 0.7..1.3
  chinLength: number; // 0.7..1.3
  chinShape: ChinShape;
  foreheadHeight: number; // 0.8..1.2
  earProtrusion: number;  // 0..1 (0 = flat against head, 1 = sticking out)
  // Optional decorative
  freckles: 'none' | 'sparse' | 'dense';
  birthmarks: { x: number; y: number; size: number }[];
  vitiligoPattern: 'none' | 'sparse' | 'patchy' | 'extensive';
};

// ─── Body parameters ────────────────────────────────────────────────────────

export type AgeCohort =
  | 'newborn'
  | 'infant'
  | 'toddler'
  | 'preschool'
  | 'elementary'
  | 'tween'
  | 'teen'
  | 'young-adult'
  | 'adult'
  | 'middle-age'
  | 'elder';

export type BodyParameters = {
  /** Age in years (float). Combined with ageCohort for proportions. */
  ageYears: number;
  ageCohort: AgeCohort;
  /** Height z-score relative to age cohort (-2..+2). */
  heightZScore: number;
  /** Body mass: 0 = very-thin, 0.4 = average, 0.7 = plus, 1.0 = super-plus. */
  massIndex: number;
  /** Muscle definition 0..1. */
  muscleDefinition: number;
  /** Shoulder width relative to torso (0.7..1.3). */
  shoulderWidth: number;
  /** Hip width relative to shoulder (0.7..1.3). */
  hipWidth: number;
  torsoLength: number; // 0.85..1.15
  limbLength: number;  // 0.85..1.15
};

// ─── Mobility & sensory aids, body differences ──────────────────────────────

export type MobilityAid =
  | 'none'
  | 'wheelchair-manual'
  | 'wheelchair-powered'
  | 'wheelchair-sports'
  | 'crutches-forearm'
  | 'crutches-axillary'
  | 'rollator'
  | 'walker-standard'
  | 'cane-standard'
  | 'cane-quad'
  | 'cane-white-long'
  | 'cane-white-id';

export type SensoryAid =
  | 'glasses-round'
  | 'glasses-square'
  | 'glasses-aviator'
  | 'sunglasses'
  | 'hearing-aid-bte'
  | 'hearing-aid-ite'
  | 'cochlear-implant'
  | 'aac-tablet'
  | 'service-animal'
  | 'sunflower-lanyard';

export type Prosthetic =
  | 'none'
  | 'upper-limb-flesh'
  | 'upper-limb-mechanical'
  | 'upper-limb-decorated'
  | 'lower-limb-flesh'
  | 'lower-limb-mechanical'
  | 'lower-limb-decorated';

export type BodyDifference = {
  prosthetic: Prosthetic;
  /** Unilateral or bilateral limb difference */
  limbDifference: 'none' | 'unilateral-arm' | 'bilateral-arm' | 'unilateral-leg' | 'bilateral-leg' | 'unilateral-hand' | 'bilateral-hand';
  alopecia: 'none' | 'partial' | 'total';
  /** Scar locations (anatomical names) */
  scars: string[];
};

// ─── Religious / cultural attire ────────────────────────────────────────────

export type HeadCovering =
  | 'none'
  | 'hijab-shayla'
  | 'hijab-khimar'
  | 'hijab-al-amira'
  | 'hijab-niqab'
  | 'kippah-knit'
  | 'kippah-velvet'
  | 'kippah-bukharian'
  | 'dastar-sikh'
  | 'pagri-traditional'
  | 'tichel'
  | 'sheitel'
  | 'kufi'
  | 'taqiyah'
  | 'mantilla'
  | 'plain-dress-cap'
  | 'rain-hat'
  | 'sun-hat'
  | 'baseball-cap'
  | 'beanie'
  | 'beret';

export type GarmentTradition =
  | 'everyday-western'
  | 'sari-nivi'
  | 'sari-bengali'
  | 'sari-gujarati'
  | 'salwar-kameez'
  | 'kimono'
  | 'hanbok'
  | 'ao-dai'
  | 'dashiki'
  | 'kente-cloth'
  | 'huipil'
  | 'kilt'
  | 'lederhosen'
  | 'cheongsam'
  | 'jubba';

// ─── Identity data ──────────────────────────────────────────────────────────

export type Pronouns =
  | { kind: 'preset'; value: 'she/her' | 'he/him' | 'they/them' }
  | { kind: 'custom'; subject: string; object: string; possessive: string; reflexive: string };

export type RelationshipEdge = {
  fromId: string;
  toId: string;
  /** Bidirectional unless specifically directed. */
  kind:
    | 'co-parent'
    | 'parent'
    | 'child'
    | 'grandparent'
    | 'grandchild'
    | 'sibling'
    | 'half-sibling'
    | 'step-sibling'
    | 'foster-parent'
    | 'adoptive-parent'
    | 'guardian'
    | 'chosen-family'
    | 'friend'
    | 'partner'
    | 'cousin'
    | 'aunt-uncle'
    | 'niece-nephew';
};

// ─── The diversity bundle attached to a Character ───────────────────────────

export type CharacterDiversity = {
  skinTone: MonkSkinTone;
  skinUndertone: SkinUndertone;
  /** Optional explicit hex override (e.g., for fantastical characters); when
   *  present, takes precedence over the MST_HEX lookup. */
  skinHexOverride?: string;

  hairCurlPattern: HairCurlPattern;
  hairStyle: HairStyle;
  hairColor: string;
  hairLength: 'short' | 'medium' | 'long' | 'very-long';

  facial: FacialFeatures;
  body: BodyParameters;

  mobilityAid: MobilityAid;
  sensoryAids: SensoryAid[];
  bodyDifference: BodyDifference;

  headCovering: HeadCovering;
  garmentTradition: GarmentTradition;

  pronouns: Pronouns;
  displayName: string;
  /** Optional pronunciation hint for the display name. */
  pronunciation?: string;
};

// ─── Defaults ───────────────────────────────────────────────────────────────

export function defaultDiversity(name: string = ''): CharacterDiversity {
  return {
    skinTone: 5,
    skinUndertone: 'neutral',
    hairCurlPattern: 0.5,
    hairStyle: 'medium-loose',
    hairColor: '#3a2a1c',
    hairLength: 'medium',
    facial: {
      eyeShape: 'almond',
      eyeSize: 1.0,
      eyeSpacing: 1.0,
      irisColor: '#5a4226',
      browThickness: 1.0,
      browArch: 0.4,
      noseBridgeHeight: 1.0,
      noseTipShape: 'rounded',
      nostrilWidth: 1.0,
      noseLength: 1.0,
      lipUpperThickness: 1.0,
      lipLowerThickness: 1.1,
      mouthShape: 'rounded',
      cupidsBowDefinition: 0.5,
      faceShape: 'oval',
      cheekbonePromenance: 1.0,
      chinWidth: 1.0,
      chinLength: 1.0,
      chinShape: 'rounded',
      foreheadHeight: 1.0,
      earProtrusion: 0.4,
      freckles: 'none',
      birthmarks: [],
      vitiligoPattern: 'none',
    },
    body: {
      ageYears: 6,
      ageCohort: 'elementary',
      heightZScore: 0,
      massIndex: 0.4,
      muscleDefinition: 0.2,
      shoulderWidth: 1.0,
      hipWidth: 1.0,
      torsoLength: 1.0,
      limbLength: 1.0,
    },
    mobilityAid: 'none',
    sensoryAids: [],
    bodyDifference: {
      prosthetic: 'none',
      limbDifference: 'none',
      alopecia: 'none',
      scars: [],
    },
    headCovering: 'none',
    garmentTradition: 'everyday-western',
    pronouns: { kind: 'preset', value: 'they/them' },
    displayName: name,
  };
}

// ─── Demographic-balanced default cast generator ────────────────────────────

/**
 * Generate a default Character distribution that mirrors US child
 * demographics (Census 2024). The system surfaces this when an author
 * opens "Add a character" without preferences — so that diversity is
 * the UNMARKED DEFAULT, not an opt-in mode (the diversity research's
 * highest-leverage day-1 move).
 *
 * Inputs: an RNG and a position-in-cast index (so a 4-character cast
 * has visibly varied tones, not 4 same-tone characters).
 */
export function sampleDefaultDiversity(
  rng: () => number,
  positionInCast: number = 0,
  totalCastSize: number = 1,
): CharacterDiversity {
  // Skin tone distribution: rough US child demographics
  // (~50% non-Hispanic White, ~25% Hispanic, ~14% Black, ~6% Asian,
  // ~5% multiracial/other). Mapped to MST tones via the perceptual
  // approximation that lighter / mid / dark roughly partitions to
  // these groups, with significant within-group variance.
  const pool: MonkSkinTone[] = [
    1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9, 10,
  ];
  // For multi-character casts, stratify so we don't accidentally pick
  // 4 light skin tones in a row.
  let tone: MonkSkinTone;
  if (totalCastSize > 1) {
    const stratum = positionInCast / totalCastSize;
    const strataIndex = Math.floor(stratum * pool.length);
    const jitterIndex = (strataIndex + Math.floor(rng() * 3) - 1 + pool.length) % pool.length;
    tone = pool[jitterIndex];
  } else {
    tone = pool[Math.floor(rng() * pool.length) % pool.length];
  }

  const undertones: SkinUndertone[] = ['cool', 'neutral', 'warm'];
  const undertone = undertones[Math.floor(rng() * 3)];

  // Hair curl pattern correlated weakly with tone (light tones skew
  // straighter on average; dark tones skew coilier — but never absolute).
  const curlBase = tone <= 4 ? 0.2 : tone <= 7 ? 0.55 : 0.85;
  const hairCurlPattern = Math.max(0, Math.min(1, curlBase + (rng() - 0.5) * 0.6));

  // Pick a hair style appropriate to the curl pattern.
  const compatibleStyles = (Object.entries(HAIR_STYLE_CURL_RANGE) as [HairStyle, { min: number; max: number }][])
    .filter(([, range]) => hairCurlPattern >= range.min && hairCurlPattern <= range.max)
    .map(([style]) => style);
  const hairStyle = compatibleStyles[Math.floor(rng() * compatibleStyles.length) % compatibleStyles.length];

  // Hair color: dark dominant, with brown/blonde for lighter tones.
  const hairColorPool = tone <= 3
    ? ['#3a2a1c', '#5a3825', '#7a4e35', '#c89465', '#ddae73']
    : tone <= 6
    ? ['#2a1c10', '#3a2a1c', '#5a3825']
    : ['#1a0f08', '#2a1c10', '#3a2a1c'];
  const hairColor = hairColorPool[Math.floor(rng() * hairColorPool.length) % hairColorPool.length];

  // Hair length: stratified picks
  const lengths: ('short' | 'medium' | 'long' | 'very-long')[] = ['short', 'medium', 'medium', 'long'];
  const hairLength = lengths[Math.floor(rng() * lengths.length) % lengths.length];

  // Facial features sample
  const eyeShapes: EyeShape[] = ['almond', 'round', 'hooded', 'monolid', 'double-lid', 'upturned', 'downturned'];
  const eyeShape = eyeShapes[Math.floor(rng() * eyeShapes.length) % eyeShapes.length];

  const noseTipShapes: NoseTipShape[] = ['rounded', 'pointed', 'flat', 'upturned'];
  const noseTipShape = noseTipShapes[Math.floor(rng() * noseTipShapes.length) % noseTipShapes.length];

  // Pronouns: 45% she/her, 45% he/him, 10% they/them by default
  const pronounRoll = rng();
  const pronouns: Pronouns = pronounRoll < 0.45
    ? { kind: 'preset', value: 'she/her' }
    : pronounRoll < 0.9
    ? { kind: 'preset', value: 'he/him' }
    : { kind: 'preset', value: 'they/them' };

  // Mobility/sensory aids: 5% chance of a mobility aid, 8% glasses, etc.,
  // reflecting that disability is genuinely present in real classrooms.
  const mobility: MobilityAid = rng() < 0.05
    ? (['wheelchair-manual', 'wheelchair-sports', 'crutches-forearm', 'cane-white-long'] as MobilityAid[])[Math.floor(rng() * 4)]
    : 'none';

  const sensoryAids: SensoryAid[] = [];
  if (rng() < 0.18) {
    // Glasses
    sensoryAids.push((['glasses-round', 'glasses-square', 'glasses-aviator'] as SensoryAid[])[Math.floor(rng() * 3)]);
  }
  if (rng() < 0.03) sensoryAids.push('hearing-aid-bte');

  const div = defaultDiversity();
  div.skinTone = tone;
  div.skinUndertone = undertone;
  div.hairCurlPattern = hairCurlPattern;
  div.hairStyle = hairStyle;
  div.hairColor = hairColor;
  div.hairLength = hairLength;
  div.facial.eyeShape = eyeShape;
  div.facial.noseTipShape = noseTipShape;
  div.pronouns = pronouns;
  div.mobilityAid = mobility;
  div.sensoryAids = sensoryAids;
  return div;
}

// ─── Utility: get the actual hex color for a Character's skin ───────────────

export function skinHex(d: CharacterDiversity): string {
  if (d.skinHexOverride) return d.skinHexOverride;
  return MST_HEX[d.skinTone];
}
