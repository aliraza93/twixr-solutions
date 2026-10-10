import { requireDb, withDb } from "@/lib/cms/db";
import { TRACKED_DIMENSIONS } from "@/lib/pipeline/variety/plan";

/**
 * Variety audit.
 *
 * Randomization that is never measured is randomization you are trusting on
 * faith. Every dimension the planner draws is recorded, so collapse (a bank
 * that stopped rotating, a weight that got misconfigured, a dimension pinned
 * by an env override) shows up here as low entropy or a long run of one value
 * rather than as something a reader notices first.
 */

export type DimensionReport = {
  dimension: string;
  samples: number;
  distinct: number;
  /** Shannon entropy in bits. */
  entropy: number;
  /** Entropy as a fraction of the maximum possible for this many distinct values. */
  normalized: number;
  /** Longest run of the same value in a row. */
  maxRun: number;
  topValue: string;
  topShare: number;
  alarms: string[];
};

export type VarietyAudit = {
  window: number;
  dimensions: DimensionReport[];
  alarms: string[];
  healthy: boolean;
};

function shannon(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return -counts
    .filter((c) => c > 0)
    .reduce((sum, c) => {
      const p = c / total;
      return sum + p * Math.log2(p);
    }, 0);
}

function longestRun(values: string[]): number {
  let best = 0;
  let current = 0;
  let previous: string | null = null;
  for (const v of values) {
    current = v === previous ? current + 1 : 1;
    previous = v;
    best = Math.max(best, current);
  }
  return best;
}

/** Dimensions where a long run is expected and not a problem. */
const RUN_TOLERANT = new Set(["weekday", "schemaType", "coverMode", "model"]);

export async function auditVariety(window = 20): Promise<VarietyAudit> {
  const rows = await withDb(async () => {
    const db = requireDb();
    return db.varietyChoice.findMany({
      where: { dimension: { in: [...TRACKED_DIMENSIONS] } },
      orderBy: { createdAt: "desc" },
      take: window * TRACKED_DIMENSIONS.length,
      select: { dimension: true, value: true, createdAt: true },
    });
  }, []);

  const byDimension = new Map<string, string[]>();
  for (const row of rows) {
    const list = byDimension.get(row.dimension) ?? [];
    if (list.length < window) list.push(row.value);
    byDimension.set(row.dimension, list);
  }

  const dimensions: DimensionReport[] = [];
  const alarms: string[] = [];

  for (const dimension of TRACKED_DIMENSIONS) {
    const values = byDimension.get(dimension) ?? [];
    if (values.length < 4) continue; // not enough history to judge

    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

    const entropy = shannon([...counts.values()]);
    const maxEntropy = Math.log2(Math.max(2, counts.size));
    const normalized = maxEntropy > 0 ? entropy / maxEntropy : 0;
    const maxRun = longestRun(values);
    const [topValue, topCount] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topShare = topCount / values.length;

    const dimAlarms: string[] = [];
    if (counts.size === 1) {
      dimAlarms.push(`collapsed to a single value: ${topValue}`);
    } else if (topShare > 0.6 && values.length >= 8) {
      dimAlarms.push(
        `${topValue} is ${Math.round(topShare * 100)}% of the last ${values.length}`
      );
    }
    if (!RUN_TOLERANT.has(dimension) && maxRun > 3) {
      dimAlarms.push(`${topValue} repeated ${maxRun} times in a row`);
    }

    dimensions.push({
      dimension,
      samples: values.length,
      distinct: counts.size,
      entropy: Math.round(entropy * 100) / 100,
      normalized: Math.round(normalized * 100) / 100,
      maxRun,
      topValue,
      topShare: Math.round(topShare * 100) / 100,
      alarms: dimAlarms,
    });

    for (const a of dimAlarms) alarms.push(`${dimension}: ${a}`);
  }

  return {
    window,
    dimensions,
    alarms,
    healthy: alarms.length === 0,
  };
}

/** Spread of the things a reader notices most: length, timing, image count. */
export type ShapeAudit = {
  posts: number;
  wordCount: { mean: number; stdev: number; min: number; max: number };
  gapHours: { mean: number; stdev: number; min: number; max: number };
  distinctPublishHours: number;
  titleFirstWordCollisions: string[];
};

export async function auditShape(window = 20): Promise<ShapeAudit> {
  const posts = await withDb(async () => {
    const db = requireDb();
    return db.blogPost.findMany({
      where: { origin: "pipeline", published: true },
      orderBy: { createdAt: "desc" },
      take: window,
      select: { title: true, body: true, publishAt: true, createdAt: true },
    });
  }, []);

  const words = posts.map(
    (p) => (p.body ?? "").trim().split(/\s+/).filter(Boolean).length
  );
  const stamps = posts
    .map((p) => p.publishAt ?? p.createdAt)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const gaps: number[] = [];
  for (let i = 1; i < stamps.length; i += 1) {
    gaps.push((stamps[i].getTime() - stamps[i - 1].getTime()) / 3600_000);
  }

  const stats = (values: number[]) => {
    if (!values.length) return { mean: 0, stdev: 0, min: 0, max: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return {
      mean: Math.round(mean),
      stdev: Math.round(Math.sqrt(variance)),
      min: Math.round(Math.min(...values)),
      max: Math.round(Math.max(...values)),
    };
  };

  const firstWords = new Map<string, number>();
  for (const p of posts) {
    const w = p.title.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    if (w) firstWords.set(w, (firstWords.get(w) ?? 0) + 1);
  }

  return {
    posts: posts.length,
    wordCount: stats(words),
    gapHours: stats(gaps),
    distinctPublishHours: new Set(stamps.map((s) => s.getUTCHours())).size,
    titleFirstWordCollisions: [...firstWords.entries()]
      .filter(([, n]) => n >= 3)
      .map(([w, n]) => `${w} (${n}x)`),
  };
}

export function formatAuditText(
  variety: VarietyAudit,
  shape: ShapeAudit
): string {
  const lines = [
    `Variety audit over the last ${variety.window} runs:`,
    variety.healthy
      ? "  No collapse detected."
      : `  ${variety.alarms.length} alarm(s):`,
    ...variety.alarms.map((a) => `  - ${a}`),
    "",
    `Shape over the last ${shape.posts} published posts:`,
    `  Words: mean ${shape.wordCount.mean}, stdev ${shape.wordCount.stdev}, range ${shape.wordCount.min}-${shape.wordCount.max}`,
    `  Gap between posts: mean ${shape.gapHours.mean}h, stdev ${shape.gapHours.stdev}h, range ${shape.gapHours.min}-${shape.gapHours.max}h`,
    `  Distinct publish hours: ${shape.distinctPublishHours}`,
  ];
  if (shape.titleFirstWordCollisions.length) {
    lines.push(
      `  Repeated title first words: ${shape.titleFirstWordCollisions.join(", ")}`
    );
  }
  // A low stdev on word count means the length draw is not reaching its tails,
  // which is the most common sign the bands got narrowed by an env override.
  if (shape.wordCount.stdev > 0 && shape.wordCount.stdev < 150) {
    lines.push(
      `  Warning: word-count spread is narrow (stdev ${shape.wordCount.stdev}); check PIPELINE_LENGTH_BANDS`
    );
  }
  return lines.join("\n");
}
