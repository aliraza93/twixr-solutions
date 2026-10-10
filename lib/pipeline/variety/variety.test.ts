import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { capsFor } from "@/lib/pipeline/model-capabilities";
import { createRng } from "@/lib/pipeline/variety/rng";
import {
  mixtureDraw,
  parseWeightEnv,
  pickAvoidingRecent,
  pickWeighted,
} from "@/lib/pipeline/variety/sampler";
import {
  BANNED_OPENER_SETS,
  INLINE_IMAGE_KINDS,
  OPENING_DEVICES,
  RENDER_MODIFIERS,
  STRUCTURES,
  STYLEBOOKS,
  TITLE_PATTERNS,
} from "@/lib/pipeline/variety/banks";
import { BRAND_STYLES } from "@/lib/pipeline/brand-styles";
import { resolveEntities } from "@/lib/seo-entities";
import {
  atLocalTime,
  drawPublishAt,
  hourBucket,
  localHour,
  tzOffsetMinutes,
} from "@/lib/pipeline/variety/clock";

describe("createRng", () => {
  it("is reproducible for the same seed", () => {
    const a = createRng("seed-one");
    const b = createRng("seed-one");
    const drawsA = Array.from({ length: 20 }, () => a.int(0, 1000));
    const drawsB = Array.from({ length: 20 }, () => b.int(0, 1000));
    assert.deepEqual(drawsA, drawsB);
  });

  it("differs across seeds", () => {
    const a = createRng("seed-one");
    const b = createRng("seed-two");
    const drawsA = Array.from({ length: 20 }, () => a.int(0, 1000));
    const drawsB = Array.from({ length: 20 }, () => b.int(0, 1000));
    assert.notDeepEqual(drawsA, drawsB);
  });

  it("keeps int() inside the inclusive bounds", () => {
    const rng = createRng("bounds");
    for (let i = 0; i < 500; i += 1) {
      const v = rng.int(3, 7);
      assert.ok(v >= 3 && v <= 7, `got ${v}`);
    }
    // A degenerate range must not loop or go out of bounds.
    assert.equal(rng.int(5, 5), 5);
  });

  it("pickMany never returns duplicates or overruns the pool", () => {
    const rng = createRng("pickmany");
    const picked = rng.pickMany(["a", "b", "c"], 10);
    assert.equal(picked.length, 3);
    assert.equal(new Set(picked).size, 3);
    assert.deepEqual(rng.pickMany(["a", "b", "c"], 0), []);
  });

  it("throws on an empty pick rather than returning undefined", () => {
    const rng = createRng("empty");
    assert.throws(() => rng.pick([]));
  });
});

describe("pickAvoidingRecent", () => {
  it("never returns a value inside the recent window", () => {
    const rng = createRng("avoid");
    const pool = ["a", "b", "c", "d", "e"] as const;
    for (let i = 0; i < 200; i += 1) {
      const got = pickAvoidingRecent(rng, pool, ["a", "b"], 2);
      assert.ok(got !== "a" && got !== "b", `got ${got}`);
    }
  });

  it("falls back to the full pool when the window would exclude everything", () => {
    const rng = createRng("avoid-all");
    const got = pickAvoidingRecent(rng, ["a", "b"], ["a", "b"], 5);
    assert.ok(got === "a" || got === "b");
  });

  it("spreads across the pool rather than clustering", () => {
    const rng = createRng("spread");
    const pool = ["a", "b", "c", "d", "e", "f"] as const;
    const recent: string[] = [];
    const counts = new Map<string, number>();
    for (let i = 0; i < 120; i += 1) {
      const got = pickAvoidingRecent(rng, pool, recent, 3);
      recent.unshift(got);
      counts.set(got, (counts.get(got) ?? 0) + 1);
    }
    // With a window of 3 over a pool of 6, nothing should dominate.
    assert.equal(counts.size, pool.length);
    for (const [value, n] of counts) {
      assert.ok(n < 60, `${value} appeared ${n} times out of 120`);
    }
  });

  it("guarantees no value repeats inside its own window", () => {
    const rng = createRng("window");
    const pool = ["a", "b", "c", "d", "e"] as const;
    const history: string[] = [];
    for (let i = 0; i < 100; i += 1) {
      const got = pickAvoidingRecent(rng, pool, history, 3);
      assert.ok(!history.slice(0, 3).includes(got));
      history.unshift(got);
    }
  });
});

describe("pickWeighted", () => {
  it("respects the weights roughly", () => {
    const rng = createRng("weights");
    let heavy = 0;
    const n = 4000;
    for (let i = 0; i < n; i += 1) {
      if (
        pickWeighted(rng, [
          { value: "heavy", weight: 90 },
          { value: "light", weight: 10 },
        ]) === "heavy"
      ) {
        heavy += 1;
      }
    }
    const share = heavy / n;
    assert.ok(share > 0.85 && share < 0.95, `heavy share was ${share}`);
  });

  it("falls back to uniform when every weight is zero", () => {
    const rng = createRng("zero-weights");
    const got = pickWeighted(rng, [
      { value: "a", weight: 0 },
      { value: "b", weight: 0 },
    ]);
    assert.ok(got === "a" || got === "b");
  });
});

describe("mixtureDraw", () => {
  it("returns a value inside the chosen band and reaches both tails", () => {
    const rng = createRng("mixture");
    const bands = [
      { label: "short", min: 400, max: 650, weight: 10 },
      { label: "mid", min: 700, max: 1200, weight: 45 },
      { label: "long", min: 1800, max: 2600, weight: 15 },
    ];
    const labels = new Set<string>();
    for (let i = 0; i < 400; i += 1) {
      const got = mixtureDraw(rng, bands);
      const band = bands.find((b) => b.label === got.label)!;
      assert.ok(got.value >= band.min && got.value <= band.max);
      labels.add(got.label);
    }
    // All three bands must actually be reachable, otherwise the length
    // distribution has silently collapsed.
    assert.equal(labels.size, 3);
  });
});

describe("parseWeightEnv", () => {
  it("merges overrides over defaults and ignores unknown keys", () => {
    const got = parseWeightEnv("ai:10,nonsense:5", { ai: 75, og: 25 });
    const map = new Map(got.map((o) => [o.value, o.weight]));
    assert.equal(map.get("ai"), 10);
    assert.equal(map.get("og"), 25);
    assert.equal(map.size, 2);
  });

  it("returns the defaults for empty or malformed input", () => {
    const got = parseWeightEnv("", { ai: 75, og: 25 });
    assert.equal(got.length, 2);
    const bad = parseWeightEnv("ai:notanumber", { ai: 75, og: 25 });
    assert.equal(new Map(bad.map((o) => [o.value, o.weight])).get("ai"), 75);
  });
});

describe("model capabilities", () => {
  it("blocks forced tool choice and temperature where the API rejects them", () => {
    // These two are the ones that would 400 the whole run if got wrong.
    const opus = capsFor("claude-opus-5-5");
    assert.equal(opus.forcedToolChoice, false);
    assert.equal(opus.temperature, false);
    assert.equal(opus.effort, true);

    const sonnet55 = capsFor("claude-sonnet-5-5");
    assert.equal(sonnet55.forcedToolChoice, false);
    assert.equal(sonnet55.temperature, false);

    const haiku55 = capsFor("claude-haiku-5-5");
    assert.equal(haiku55.temperature, false);
    assert.equal(haiku55.forcedToolChoice, true);
  });

  it("allows both on the configured default blog model", () => {
    const sonnet46 = capsFor("claude-sonnet-4-6");
    assert.equal(sonnet46.forcedToolChoice, true);
    assert.equal(sonnet46.temperature, true);
    assert.equal(sonnet46.effort, true);
  });

  it("blocks effort on the models that error on it", () => {
    assert.equal(capsFor("claude-haiku-4-5").effort, false);
    assert.equal(capsFor("claude-haiku-4-5").temperature, true);
  });
});

describe("banks", () => {
  it("have unique ids, which the no-repeat window depends on", () => {
    const sets: [string, { id: string }[]][] = [
      ["structures", STRUCTURES],
      ["stylebooks", STYLEBOOKS],
      ["openingDevices", OPENING_DEVICES],
      ["titlePatterns", TITLE_PATTERNS],
      ["renderModifiers", RENDER_MODIFIERS],
      ["inlineImageKinds", INLINE_IMAGE_KINDS],
      ["brandStyles", BRAND_STYLES],
    ];
    for (const [name, bank] of sets) {
      const ids = bank.map((b) => b.id);
      assert.equal(new Set(ids).size, ids.length, `${name} has duplicate ids`);
    }
  });

  it("are large enough for the windows that sample them", () => {
    // A pool smaller than its exclusion window silently falls back to the full
    // pool, which is how perceived repetition creeps back in.
    assert.ok(STRUCTURES.length >= 8);
    assert.ok(STYLEBOOKS.length >= 8);
    assert.ok(OPENING_DEVICES.length >= 8);
    assert.ok(BRAND_STYLES.length >= 20);
    assert.ok(RENDER_MODIFIERS.length >= 8);
    assert.ok(INLINE_IMAGE_KINDS.length >= 8);
  });

  it("gives every structure a usable section range", () => {
    for (const s of STRUCTURES) {
      assert.ok(s.sectionsMin <= s.sectionsMax, s.id);
      assert.ok(s.shape.length > 0, s.id);
    }
  });

  it("keeps every banned-opener set non-empty", () => {
    for (const set of BANNED_OPENER_SETS) {
      assert.ok(set.length > 0);
    }
  });

  it("uses no em or en dashes anywhere in the prompt banks", () => {
    // These strings go straight into prompts and published copy, where the
    // project forbids them outright.
    const text = JSON.stringify([
      STRUCTURES,
      STYLEBOOKS,
      OPENING_DEVICES,
      TITLE_PATTERNS,
      RENDER_MODIFIERS,
      INLINE_IMAGE_KINDS,
      BANNED_OPENER_SETS,
    ]);
    assert.ok(!/[—–−]/.test(text));
  });
});

describe("hourBucket", () => {
  it("maps an instant to a named part of the day", () => {
    const buckets = new Set<string>();
    for (let h = 0; h < 24; h += 1) {
      buckets.add(hourBucket(new Date(Date.UTC(2026, 0, 1, h, 0, 0))));
    }
    // Every bucket label should be reachable across a full day.
    assert.ok(buckets.size >= 4);
    for (const b of buckets) {
      assert.ok(
        ["night", "morning", "afternoon", "evening", "late"].includes(b),
        b
      );
    }
  });
});

describe("clock", () => {
  it("draws publish times inside the intended local hours", () => {
    const rng = createRng("clock-blog");
    const from = new Date(Date.UTC(2026, 5, 15, 2, 0, 0));
    const hours = new Set<number>();
    for (let i = 0; i < 300; i += 1) {
      const { at } = drawPublishAt(rng, "blog", { from, maxDaysAhead: 2 });
      const hour = localHour(at);
      hours.add(hour);
      // The blog distribution gives 00:00-05:00 only a thin tail, but it must
      // never produce an hour outside 0-23 or an instant before `from`.
      assert.ok(hour >= 0 && hour <= 23, `hour ${hour}`);
      assert.ok(at.getTime() > from.getTime(), "publish time must be ahead");
    }
    // Daytime hours must dominate: at least a dozen distinct hours, and the
    // bulk of draws inside the waking window.
    assert.ok(hours.size >= 10, `only ${hours.size} distinct hours`);
  });

  it("puts most LinkedIn draws in working hours", () => {
    const rng = createRng("clock-li");
    const from = new Date(Date.UTC(2026, 5, 15, 2, 0, 0));
    let inWindow = 0;
    const n = 300;
    for (let i = 0; i < n; i += 1) {
      const { at } = drawPublishAt(rng, "linkedin", { from, maxDaysAhead: 3 });
      const hour = localHour(at);
      if (hour >= 6 && hour <= 23) inWindow += 1;
    }
    // The off-peak tail is deliberate but small.
    assert.ok(inWindow / n > 0.9, `only ${inWindow}/${n} in the waking window`);
  });

  it("resolves the configured timezone offset", () => {
    // Asia/Karachi is UTC+5 with no DST, so the offset is stable year round.
    const january = tzOffsetMinutes(new Date(Date.UTC(2026, 0, 15, 12, 0, 0)));
    const july = tzOffsetMinutes(new Date(Date.UTC(2026, 6, 15, 12, 0, 0)));
    assert.equal(january, 300);
    assert.equal(july, 300);
  });

  it("maps a UTC instant to the right local hour", () => {
    // 19:30 UTC is 00:30 the next day in Karachi.
    const at = new Date(Date.UTC(2026, 5, 15, 19, 30, 0));
    assert.equal(localHour(at), 0);
    // 04:00 UTC is 09:00 local.
    assert.equal(localHour(new Date(Date.UTC(2026, 5, 15, 4, 0, 0))), 9);
  });

  it("builds a local time that round-trips to the requested hour", () => {
    const from = new Date(Date.UTC(2026, 5, 15, 2, 0, 0));
    for (const hour of [0, 6, 9, 14, 20, 23]) {
      const at = atLocalTime(from, 0, hour, 30);
      assert.equal(localHour(at), hour, `requested ${hour}`);
    }
  });
});

describe("entity resolution", () => {
  it("uses canonical casing rather than a title-case guess", () => {
    const got = resolveEntities(
      ["typescript", "nodejs", "postgres", "aws", "mysql", "git"],
      ""
    );
    const names = got.map((e) => e.name);
    assert.ok(names.includes("TypeScript"), names.join(", "));
    assert.ok(names.includes("Node.js"), names.join(", "));
    assert.ok(names.includes("PostgreSQL"), names.join(", "));
    assert.ok(names.includes("Amazon Web Services"), names.join(", "));
    assert.ok(names.includes("MySQL"), names.join(", "));
    assert.ok(names.includes("Git"), names.join(", "));
  });

  it("collapses aliases to one entity", () => {
    const got = resolveEntities(["node.js", "nodejs"], "");
    const nodes = got.filter((e) => e.sameAs.endsWith("Q756100"));
    assert.equal(nodes.length, 1);
  });

  it("prefers the longest match", () => {
    const got = resolveEntities(["tailwind css"], "");
    assert.ok(got.some((e) => e.name === "Tailwind CSS"));
  });

  it("returns nothing for unrelated text", () => {
    assert.deepEqual(resolveEntities(["knitting"], "a post about wool"), []);
  });

  it("emits only absolute wikidata URIs", () => {
    for (const e of resolveEntities(["laravel", "redis", "aws"], "")) {
      assert.match(e.sameAs, /^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/);
    }
  });
});
