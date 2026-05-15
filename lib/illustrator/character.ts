/**
 * Characters are parameter sheets, not pixels.
 *
 * A Character is a small immutable record of look-defining numbers and
 * choices. Pose, position and expression are *page-level* inputs that are
 * passed alongside the character to the renderer. The same character +
 * different pose always produces the same animal in different positions —
 * that is how page-to-page consistency is guaranteed: not by hoping, but
 * by reading the exact same parameters every time.
 */

import { Rng, hashString, mulberry32 } from './rng';

export type Species = 'rabbit' | 'owl' | 'fox' | 'mouse';

export type EyeStyle = 'dot' | 'dot-shine' | 'closed-curve' | 'sleepy';

export type Build = 'small-round' | 'tall-thin' | 'plump';

export type Accessory =
  | { kind: 'none' }
  | { kind: 'scarf'; color: string }
  | { kind: 'bowtie'; color: string }
  | { kind: 'flower'; color: string }
  | { kind: 'hat'; color: string };

export type Character = {
  id: string; // stable name, e.g. "pip"
  name: string; // display name, e.g. "Pip"
  species: Species;
  furColor: string;
  bellyColor: string;
  noseColor: string;
  cheekColor: string;
  eyeStyle: EyeStyle;
  build: Build;
  /** Degrees, applied to ear/feature tilt. Small values, e.g. -10..10. */
  featureTilt: number;
  /** 0.6..1.4 — multiplies overall character size. */
  scale: number;
  accessory: Accessory;
  /** A seed lets internal random details (whisker count, freckle pattern,
   *  fur texture) stay locked across renders. */
  seed: number;
};

export type Facing = 'left' | 'right' | 'forward';

export type ArmPose = 'down' | 'wave' | 'reach-up' | 'hold-front' | 'hugging';

export type LegPose = 'stand' | 'sit' | 'walk' | 'curled';

export type EyeState = 'open' | 'closed' | 'wink-left' | 'wink-right' | 'wide';

export type MouthState = 'smile' | 'small' | 'open-o' | 'frown' | 'tongue';

export type Pose = {
  facing: Facing;
  arms: ArmPose;
  legs: LegPose;
  eyes: EyeState;
  mouth: MouthState;
  /** Degrees, applied to head tilt. */
  headTilt: number;
  /** Optional small bobble, used for pose variety. */
  bodyTilt?: number;
};

export const DEFAULT_POSE: Pose = {
  facing: 'forward',
  arms: 'down',
  legs: 'stand',
  eyes: 'open',
  mouth: 'smile',
  headTilt: 0,
};

export type Placement = {
  /** Center x in canvas pixels. */
  x: number;
  /** Foot/base y in canvas pixels. */
  y: number;
  /** Multiplier on character.scale. Page-level scale (depth, importance). */
  scale?: number;
};

/** Deterministic per-character RNG: fur texture, freckles, etc. stay locked. */
export function characterRng(c: Character, salt = ''): Rng {
  return mulberry32((c.seed ^ hashString(c.id + ':' + salt)) >>> 0);
}
