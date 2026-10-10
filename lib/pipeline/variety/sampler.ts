import type { Rng } from "@/lib/pipeline/variety/rng";

export type Weighted<T> = { value: T; weight: number };

/** Weighted pick. Non-positive weights are dropped; all-zero falls back to uniform. */
export function pickWeighted<T>(rng: Rng, options: Weighted<T>[]): T {
  const usable = options.filter((o) => o.weight > 0);
  if (!usable.length) {
    if (!options.length) {
      throw new Error("pickWeighted called with an empty list");
    }
    return rng.pick(options).value;
  }
  const total = usable.reduce((sum, o) => sum + o.weight, 0);
  let roll = rng.float() * total;
  for (const option of usable) {
    roll -= option.weight;
    if (roll < 0) return option.value;
  }
  return usable[usable.length - 1].value;
}

/**
 * Pick avoiding anything used in the recent window.
 *
 * This is the single most important function here. Independent uniform draws
 * cluster visibly (the birthday problem); excluding the last N used values is
 * what actually makes a feed look varied. Falls back to the full pool when the
 * window would exclude everything.
 */
export function pickAvoidingRecent<T extends string>(
  rng: Rng,
  pool: readonly T[],
  recent: readonly string[],
  windowSize = 4
): T {
  if (!pool.length) {
    throw new Error("pickAvoidingRecent called with an empty pool");
  }
  const blocked = new Set(recent.slice(0, windowSize));
  const fresh = pool.filter((item) => !blocked.has(item));
  return fresh.length ? rng.pick(fresh) : rng.pick(pool);
}

/** Same, but weighted, and the recent window only reduces weight instead of excluding. */
export function pickWeightedAvoidingRecent<T extends string>(
  rng: Rng,
  options: Weighted<T>[],
  recent: readonly string[],
  windowSize = 4,
  penalty = 0.12
): T {
  const blocked = new Set(recent.slice(0, windowSize));
  const adjusted = options.map((o) => ({
    value: o.value,
    weight: blocked.has(o.value) ? o.weight * penalty : o.weight,
  }));
  return pickWeighted(rng, adjusted);
}

export type Band = { min: number; max: number; weight: number; label: string };

/**
 * Draw a continuous value from a mixture of weighted bands.
 * Used for word counts so length is a smooth distribution with a long tail
 * rather than three fixed buckets.
 */
export function mixtureDraw(
  rng: Rng,
  bands: Band[]
): { value: number; label: string; min: number; max: number } {
  const band = pickWeighted(
    rng,
    bands.map((b) => ({ value: b, weight: b.weight }))
  );
  return {
    value: rng.int(band.min, band.max),
    label: band.label,
    min: band.min,
    max: band.max,
  };
}

/** Parse "a:2,b:5" style env overrides into weights, merged over defaults. */
export function parseWeightEnv<T extends string>(
  raw: string | undefined,
  defaults: Record<T, number>
): Weighted<T>[] {
  const merged: Record<string, number> = { ...defaults };
  if (raw && raw.trim()) {
    for (const part of raw.split(",")) {
      const [key, value] = part.split(":").map((s) => s.trim());
      const n = Number(value);
      if (key && Number.isFinite(n) && key in merged) {
        merged[key] = n;
      }
    }
  }
  return (Object.keys(merged) as T[]).map((value) => ({
    value,
    weight: merged[value],
  }));
}
