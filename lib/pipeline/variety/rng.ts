import { randomBytes } from "node:crypto";

/**
 * Seeded RNG for the content pipeline.
 *
 * Every randomized decision in a run comes from one of these, created from the
 * runId, so a run is reproducible: pass PIPELINE_VARIETY_SEED (or the runId of
 * a past run) and you get the same plan back for debugging. Without a seed it
 * draws fresh entropy from node:crypto.
 */
export type Rng = {
  readonly seed: string;
  /** Uniform float in [0, 1). */
  float(): number;
  /** Uniform integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  /** True with the given probability (0 to 1). */
  bool(probability: number): boolean;
  /** Uniform pick. Throws on an empty list, which is always a bank bug. */
  pick<T>(items: readonly T[]): T;
  /** Up to `count` distinct items, in random order. */
  pickMany<T>(items: readonly T[], count: number): T[];
  shuffle<T>(items: readonly T[]): T[];
  /** Normal draw, clamped to [min, max] when given. */
  gaussian(mean: number, sd: number, min?: number, max?: number): number;
};

/** cyrb128: string to four 32-bit seeds. */
function seedParts(seed: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i += 1) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  return [
    (h3 ^ (h1 >>> 18)) >>> 0,
    (h4 ^ (h2 >>> 22)) >>> 0,
    (h1 ^ (h3 >>> 17)) >>> 0,
    (h2 ^ (h4 >>> 19)) >>> 0,
  ];
}

/** sfc32: small, fast, good enough distribution for editorial sampling. */
function sfc32(a: number, b: number, c: number, d: number): () => number {
  let s0 = a >>> 0;
  let s1 = b >>> 0;
  let s2 = c >>> 0;
  let s3 = d >>> 0;
  return () => {
    s0 >>>= 0;
    s1 >>>= 0;
    s2 >>>= 0;
    s3 >>>= 0;
    let t = (s0 + s1) >>> 0;
    s0 = s1 ^ (s1 >>> 9);
    s1 = (s2 + (s2 << 3)) >>> 0;
    s2 = (s2 << 21) | (s2 >>> 11);
    s3 = (s3 + 1) >>> 0;
    t = (t + s3) >>> 0;
    s2 = (s2 + t) >>> 0;
    return (t >>> 0) / 4294967296;
  };
}

export function createRng(seed?: string): Rng {
  const actualSeed =
    seed && seed.trim() ? seed.trim() : randomBytes(16).toString("hex");
  const [a, b, c, d] = seedParts(actualSeed);
  const next = sfc32(a, b, c, d);
  // Discard the first few to wash out short-seed correlation.
  for (let i = 0; i < 12; i += 1) next();

  const rng: Rng = {
    seed: actualSeed,
    float: () => next(),
    int: (min, max) => {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      if (hi <= lo) return lo;
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    bool: (probability) => next() < probability,
    pick: <T,>(items: readonly T[]): T => {
      if (!items.length) {
        throw new Error("rng.pick called with an empty list");
      }
      return items[Math.floor(next() * items.length)];
    },
    pickMany: <T,>(items: readonly T[], count: number): T[] =>
      rng.shuffle(items).slice(0, Math.max(0, Math.min(count, items.length))),
    shuffle: <T,>(items: readonly T[]): T[] => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    gaussian: (mean, sd, min, max) => {
      // Box-Muller.
      let u = 0;
      let v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      let value = mean + z * sd;
      if (min !== undefined) value = Math.max(min, value);
      if (max !== undefined) value = Math.min(max, value);
      return value;
    },
  };

  return rng;
}
