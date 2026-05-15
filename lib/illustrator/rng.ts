/**
 * Seeded pseudo-random number generation and value noise.
 *
 * Determinism is the entire point: the same prompt + seed must always
 * yield the same illustration so users can iterate and reproduce results.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function range(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Deterministic 2D value noise in [0, 1], smoothed with smoothstep. */
export function makeNoise2D(seed: number): (x: number, y: number) => number {
  const lattice = (ix: number, iy: number): number => {
    let h = (ix * 374761393 + iy * 668265263 + seed * 982451653) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = lattice(x0, y0);
    const b = lattice(x0 + 1, y0);
    const c = lattice(x0, y0 + 1);
    const d = lattice(x0 + 1, y0 + 1);
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
  };
}
