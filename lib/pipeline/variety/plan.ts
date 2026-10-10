import type { Brief } from "@prisma/client";
import { BRAND_STYLES, type BrandStyle } from "@/lib/pipeline/brand-styles";
import { pipeline } from "@/lib/pipeline/config";
import { capsFor } from "@/lib/pipeline/model-capabilities";
import { BLOG_FORMATS, pickBlogFormat, type BlogFormat } from "@/lib/pipeline/seo/formats";
import {
  ANGLE_LENSES,
  AUDIENCES,
  BANNED_OPENER_SETS,
  CTA_SHAPES,
  HEADING_STYLES,
  IMAGE_ASPECTS,
  INLINE_IMAGE_KINDS,
  LINKEDIN_LENGTH_BANDS,
  LINKEDIN_SHAPES,
  OG_LAYOUTS,
  OPENING_DEVICES,
  PERSONS,
  QUIRKS,
  RENDER_MODIFIERS,
  RHYTHMS,
  STAKES,
  STRUCTURES,
  STYLEBOOKS,
  TITLE_PATTERNS,
  type StructureSkeleton,
  type StyleCard,
} from "@/lib/pipeline/variety/banks";
import { createRng, type Rng } from "@/lib/pipeline/variety/rng";
import {
  mixtureDraw,
  parseWeightEnv,
  pickAvoidingRecent,
  pickWeighted,
  pickWeightedAvoidingRecent,
  type Band,
} from "@/lib/pipeline/variety/sampler";
import { recentValuesMany, type ChoiceRow } from "@/lib/pipeline/variety/store";

export type SchemaType = "BlogPosting" | "TechArticle" | "HowTo";

export type VarietyPlan = {
  seed: string;
  /* shape */
  format: BlogFormat;
  structure: StructureSkeleton;
  sectionCount: number;
  lengthBand: string;
  wordTarget: number;
  wordTargetMin: number;
  wordTargetMax: number;
  components: {
    faq: boolean;
    takeaways: boolean;
    comparisonTable: boolean;
    checklist: boolean;
    codeBlocks: number;
    pullQuote: boolean;
    productionNotes: boolean;
    sourcesSection: boolean;
    ctaShape: { id: string; instruction: string };
  };
  openingDevice: { id: string; instruction: string };
  titlePattern: { id: string; instruction: string };
  headingStyle: { id: string; instruction: string };
  rhythm: { id: string; instruction: string };
  person: { id: string; instruction: string };
  /* texture */
  stylebook: StyleCard;
  quirks: string[];
  bannedOpeners: string[];
  blockOrder: string[];
  /** null when the chosen model rejects a non-default temperature. */
  temperature: number | null;
  /** null when the chosen model rejects output_config.effort. */
  effort: "low" | "medium" | "high" | null;
  model: string;
  secondPass: boolean;
  includeSwipeFile: boolean;
  /* angle */
  lens: { id: string; instruction: string };
  audience: { id: string; instruction: string };
  stake: { id: string; instruction: string };
  /* images */
  images: {
    inlineCount: number;
    kinds: { id: string; prompt: string }[];
    aspects: { id: string; size: string }[];
    coverMode: "ai" | "og";
    coverPalette: BrandStyle;
    coverModifier: { id: string; prompt: string };
    inlinePalettes: BrandStyle[];
    inlineModifiers: { id: string; prompt: string }[];
    ogLayout: (typeof OG_LAYOUTS)[number];
  };
  /* social */
  social: {
    attachLinkedIn: boolean;
    shape: { id: string; instruction: string };
    lengthBand: { id: string; min: number; max: number };
    hashtagCount: number;
    withImage: boolean;
  };
  /* schema */
  schemaType: SchemaType;
};

/** Dimensions tracked for the no-repeat window and the variety audit. */
export const TRACKED_DIMENSIONS = [
  "format",
  "structure",
  "lengthBand",
  "openingDevice",
  "titlePattern",
  "headingStyle",
  "rhythm",
  "person",
  "stylebook",
  "lens",
  "audience",
  "stake",
  "coverMode",
  "coverPalette",
  "coverModifier",
  "inlineCount",
  "model",
  "ogLayout",
  "linkedinShape",
  "linkedinLength",
  "schemaType",
  "publishHour",
  "weekday",
] as const;

const DEFAULT_LENGTH_BANDS: Band[] = [
  { label: "short-take", min: 420, max: 650, weight: 10 },
  { label: "standard", min: 700, max: 1200, weight: 45 },
  { label: "long", min: 1200, max: 1800, weight: 30 },
  { label: "deep-dive", min: 1800, max: 2600, weight: 15 },
];

/** Env override: "short-take:5,standard:50,long:30,deep-dive:15". */
function lengthBands(): Band[] {
  const raw = pipeline.variety.lengthBands;
  if (!raw.trim()) return DEFAULT_LENGTH_BANDS;
  const overrides = new Map<string, number>();
  for (const part of raw.split(",")) {
    const [key, value] = part.split(":").map((s) => s.trim());
    const n = Number(value);
    if (key && Number.isFinite(n)) overrides.set(key, n);
  }
  return DEFAULT_LENGTH_BANDS.map((b) => ({
    ...b,
    weight: overrides.get(b.label) ?? b.weight,
  }));
}

/**
 * Depth signals bias the length draw instead of deciding it.
 *
 * A timely take or a code card should skew short and an architecture teardown
 * should skew long, but neither should land on the same number every time.
 */
function biasedLengthBands(brief: Brief, format: BlogFormat): Band[] {
  const bands = lengthBands();
  const hay = `${brief.topic} ${brief.angle ?? ""} ${brief.targetKeyword ?? ""}`.toLowerCase();
  const complex =
    /\b(architect|distributed|race|idempoten|kubernetes|ecs|multi-tenant|security|migrat|observab|transaction)\b/.test(
      hay
    );
  const short =
    brief.requiresLiveSource ||
    format === "Short Take" ||
    /^code\s*card/i.test(brief.pillar);

  return bands.map((band) => {
    let weight = band.weight;
    if (short) {
      if (band.label === "short-take") weight *= 5;
      if (band.label === "standard") weight *= 1.5;
      if (band.label === "long") weight *= 0.3;
      if (band.label === "deep-dive") weight *= 0.1;
    }
    if (complex || format === "Teardown" || format === "Postmortem") {
      if (band.label === "short-take") weight *= 0.2;
      if (band.label === "long") weight *= 1.6;
      if (band.label === "deep-dive") weight *= 2;
    }
    return { ...band, weight };
  });
}

/**
 * Draw one item from a bank, avoiding the recent window.
 *
 * The id is drawn ONCE and then resolved. Calling the sampler inside a
 * `.find()` predicate re-draws for every element and only matches by luck,
 * which silently biases the choice and can return undefined.
 */
function pickFromBank<T extends { id: string }>(
  rng: Rng,
  bank: readonly T[],
  recent: readonly string[],
  window: number
): T {
  const id = pickAvoidingRecent(
    rng,
    bank.map((b) => b.id),
    recent,
    window
  );
  return bank.find((b) => b.id === id) ?? bank[0];
}

function pickStructure(
  rng: Rng,
  format: BlogFormat,
  recent: string[]
): StructureSkeleton {
  const suited = STRUCTURES.filter(
    (s) => s.formats.length === 0 || s.formats.includes(format)
  );
  const pool = suited.length ? suited : STRUCTURES;
  const blocked = new Set(recent.slice(0, pipeline.varietyWindow));
  const fresh = pool.filter((s) => !blocked.has(s.id));
  return rng.pick(fresh.length ? fresh : pool);
}

function pickPalette(rng: Rng, recent: string[], window: number): BrandStyle {
  const blocked = new Set(recent.slice(0, window));
  const fresh = BRAND_STYLES.filter((s) => !blocked.has(s.id));
  return rng.pick(fresh.length ? fresh : BRAND_STYLES);
}

function pickModifier(
  rng: Rng,
  recent: string[],
  window: number
): { id: string; prompt: string } {
  const blocked = new Set(recent.slice(0, window));
  const fresh = RENDER_MODIFIERS.filter((m) => !blocked.has(m.id));
  return rng.pick(fresh.length ? fresh : RENDER_MODIFIERS);
}

function schemaTypeFor(format: BlogFormat, structureId: string): SchemaType {
  if (structureId === "symptoms-rootcause-playbook" || format === "Checklist") {
    return "HowTo";
  }
  if (
    format === "Teardown" ||
    format === "Postmortem" ||
    format === "Numbers" ||
    format === "Anti-pattern"
  ) {
    return "TechArticle";
  }
  return "BlogPosting";
}

export type BuildPlanInput = {
  brief: Brief;
  runId: string;
  formatOverride?: string;
  /** Admin can pin individual dimensions for a one-off post. */
  overrides?: Partial<Record<string, string>>;
};

export async function buildVarietyPlan(
  input: BuildPlanInput
): Promise<{ plan: VarietyPlan; choices: ChoiceRow[] }> {
  const seed = pipeline.varietySeed
    ? `${pipeline.varietySeed}:${input.runId}`
    : input.runId;
  const rng = createRng(seed);
  const window = pipeline.varietyWindow;
  const recent = await recentValuesMany([...TRACKED_DIMENSIONS], window + 3);
  const pick = (dimension: string) => recent[dimension] ?? [];
  const override = (dimension: string) => input.overrides?.[dimension];

  /* ---- format ---------------------------------------------------- */
  const overrideFormat = BLOG_FORMATS.find(
    (f) => f.toLowerCase() === (input.formatOverride ?? "").trim().toLowerCase()
  );
  // Keyword hints become a bias, not a rule: follow the hint most of the time,
  // otherwise draw from everything that has not run recently.
  const hinted = pickBlogFormat({
    topic: input.brief.topic,
    angle: input.brief.angle,
    pillar: input.brief.pillar,
    requiresLiveSource: input.brief.requiresLiveSource,
  });
  const format: BlogFormat =
    overrideFormat ??
    (input.brief.requiresLiveSource || /^code\s*card/i.test(input.brief.pillar)
      ? hinted
      : rng.bool(0.6)
        ? hinted
        : pickAvoidingRecent(
            rng,
            BLOG_FORMATS.filter((f) => f !== "Short Take"),
            pick("format"),
            window
          ));

  /* ---- shape ----------------------------------------------------- */
  const structure = pickStructure(rng, format, pick("structure"));
  const length = mixtureDraw(rng, biasedLengthBands(input.brief, format));
  const sectionCount = rng.int(structure.sectionsMin, structure.sectionsMax);

  const components = {
    faq: rng.bool(0.72),
    takeaways: rng.bool(0.35),
    comparisonTable: rng.bool(format === "Decision Table" ? 0.85 : 0.3),
    checklist: rng.bool(format === "Checklist" ? 0.9 : 0.4),
    codeBlocks: pickWeighted(rng, [
      { value: 0, weight: 15 },
      { value: 1, weight: 25 },
      { value: 2, weight: 30 },
      { value: 3, weight: 20 },
      { value: 4, weight: 10 },
    ]),
    pullQuote: rng.bool(0.2),
    productionNotes: rng.bool(0.3),
    sourcesSection: input.brief.requiresLiveSource ? true : rng.bool(0.25),
    ctaShape: rng.pick(CTA_SHAPES),
  };

  const openingDevice =
    OPENING_DEVICES.find((d) => d.id === override("openingDevice")) ??
    pickFromBank(rng, OPENING_DEVICES, pick("openingDevice"), window);

  const titlePattern = pickFromBank(
    rng,
    TITLE_PATTERNS,
    pick("titlePattern"),
    window
  );

  const headingStyle = pickFromBank(
    rng,
    HEADING_STYLES,
    pick("headingStyle"),
    2
  );

  const rhythm = pickFromBank(rng, RHYTHMS, pick("rhythm"), 1);

  const personId = pickWeightedAvoidingRecent(
    rng,
    [
      { value: "first-singular", weight: 55 },
      { value: "second", weight: 30 },
      { value: "first-plural-team", weight: 15 },
    ],
    pick("person"),
    2
  );
  const person = PERSONS.find((p) => p.id === personId) ?? PERSONS[0];

  /* ---- texture --------------------------------------------------- */
  const stylebook = pickFromBank(rng, STYLEBOOKS, pick("stylebook"), window);
  const quirks = rng.pickMany(QUIRKS, rng.bool(0.4) ? 2 : 1);
  const bannedOpeners = rng.pick(BANNED_OPENER_SETS);
  // Block order matters: models are order sensitive, so shuffling the guidance
  // blocks diversifies output without changing a single instruction.
  const blockOrder = rng.shuffle([
    "voice",
    "structure",
    "angle",
    "depth",
    "format",
    "pillars",
  ]);
  const model = pickWeightedAvoidingRecent(
    rng,
    parseWeightEnv(pipeline.variety.modelWeights, {
      [pipeline.models.blog]: 70,
      [pipeline.models.blogDeep]: 20,
      [pipeline.models.blogFast]: 10,
    }),
    pick("model"),
    1,
    0.5
  );
  // Sampling is conditioned on the drawn model: passing temperature to a model
  // that removed it, or forcing tool choice where it is rejected, is a 400.
  const caps = capsFor(model);
  const temperature = caps.temperature
    ? Math.round(
        (pipeline.variety.tempMin +
          rng.float() * (pipeline.variety.tempMax - pipeline.variety.tempMin)) *
          100
      ) / 100
    : null;
  // Where temperature is unavailable, effort is the texture lever instead: it
  // changes how much the model deliberates, which is visible in the prose.
  const effort = caps.effort
    ? pickWeighted<"low" | "medium" | "high">(rng, [
        { value: "low", weight: 25 },
        { value: "medium", weight: 50 },
        { value: "high", weight: 25 },
      ])
    : null;
  const secondPass = rng.bool(pipeline.variety.secondPassProb);
  const includeSwipeFile = rng.bool(0.5);

  /* ---- angle ----------------------------------------------------- */
  const lens = pickFromBank(rng, ANGLE_LENSES, pick("lens"), window);
  const audience = pickFromBank(rng, AUDIENCES, pick("audience"), 3);
  const stake = pickFromBank(rng, STAKES, pick("stake"), 3);

  /* ---- images ---------------------------------------------------- */
  const inlineCount = pickWeighted(
    rng,
    parseWeightEnv(pipeline.variety.imageCounts, {
      "0": 8,
      "1": 17,
      "2": 35,
      "3": 30,
      "4": 10,
    })
  );
  const inlineN = Number(inlineCount);
  const kinds = rng.pickMany(INLINE_IMAGE_KINDS, inlineN);
  const aspects = Array.from({ length: inlineN }, () => {
    const a = pickWeighted(
      rng,
      IMAGE_ASPECTS.map((x) => ({ value: x, weight: x.weight }))
    );
    return { id: a.id, size: a.size };
  });
  const coverMode = pickWeighted(
    rng,
    parseWeightEnv<"ai" | "og">(pipeline.variety.coverModes, {
      ai: 75,
      og: 25,
    })
  );
  const coverPalette = pickPalette(rng, pick("coverPalette"), 6);
  const coverModifier = pickModifier(rng, pick("coverModifier"), 4);
  const usedPalettes = [coverPalette.id, ...pick("coverPalette").slice(0, 4)];
  const inlinePalettes = Array.from({ length: inlineN }, () => {
    const palette = pickPalette(rng, usedPalettes, usedPalettes.length);
    usedPalettes.push(palette.id);
    return palette;
  });
  const inlineModifiers = rng
    .pickMany(RENDER_MODIFIERS, Math.max(1, inlineN))
    .slice(0, Math.max(0, inlineN));
  const ogLayout = pickFromBank(rng, OG_LAYOUTS, pick("ogLayout"), 3);

  /* ---- social ---------------------------------------------------- */
  const socialShape = pickFromBank(
    rng,
    LINKEDIN_SHAPES,
    pick("linkedinShape"),
    3
  );
  const socialBand = pickWeighted(
    rng,
    LINKEDIN_LENGTH_BANDS.map((b) => ({ value: b, weight: b.weight }))
  );
  const social = {
    attachLinkedIn: rng.bool(pipeline.variety.linkedinAttachProb),
    shape: socialShape,
    lengthBand: { id: socialBand.id, min: socialBand.min, max: socialBand.max },
    hashtagCount: pickWeighted(rng, [
      { value: 0, weight: 12 },
      { value: 1, weight: 8 },
      { value: 2, weight: 15 },
      { value: 3, weight: 25 },
      { value: 4, weight: 25 },
      { value: 5, weight: 15 },
    ]),
    withImage: rng.bool(0.7),
  };

  const schemaType = schemaTypeFor(format, structure.id);

  const plan: VarietyPlan = {
    seed,
    format,
    structure,
    sectionCount,
    lengthBand: length.label,
    wordTarget: length.value,
    wordTargetMin: Math.round(length.value * 0.85),
    wordTargetMax: Math.round(length.value * 1.15),
    components,
    openingDevice,
    titlePattern,
    headingStyle,
    rhythm,
    person,
    stylebook,
    quirks,
    bannedOpeners,
    blockOrder,
    temperature,
    effort,
    model,
    secondPass,
    includeSwipeFile,
    lens,
    audience,
    stake,
    images: {
      inlineCount: inlineN,
      kinds,
      aspects,
      coverMode,
      coverPalette,
      coverModifier,
      inlinePalettes,
      inlineModifiers,
      ogLayout,
    },
    social,
    schemaType,
  };

  const choices: ChoiceRow[] = [
    { dimension: "format", value: format },
    { dimension: "structure", value: structure.id },
    { dimension: "lengthBand", value: length.label },
    { dimension: "openingDevice", value: openingDevice.id },
    { dimension: "titlePattern", value: titlePattern.id },
    { dimension: "headingStyle", value: headingStyle.id },
    { dimension: "rhythm", value: rhythm.id },
    { dimension: "person", value: person.id },
    { dimension: "stylebook", value: stylebook.id },
    { dimension: "lens", value: lens.id },
    { dimension: "audience", value: audience.id },
    { dimension: "stake", value: stake.id },
    { dimension: "coverMode", value: coverMode },
    { dimension: "coverPalette", value: coverPalette.id },
    { dimension: "coverModifier", value: coverModifier.id },
    { dimension: "inlineCount", value: String(inlineN) },
    { dimension: "model", value: model },
    { dimension: "ogLayout", value: ogLayout.id },
    { dimension: "linkedinShape", value: socialShape.id },
    { dimension: "linkedinLength", value: socialBand.id },
    { dimension: "schemaType", value: schemaType },
  ];

  return { plan, choices };
}

/** Compact form for GenerationLog meta and the admin UI. */
export function summarizePlan(plan: VarietyPlan): Record<string, unknown> {
  return {
    seed: plan.seed,
    format: plan.format,
    structure: plan.structure.id,
    lengthBand: plan.lengthBand,
    wordTarget: plan.wordTarget,
    sections: plan.sectionCount,
    opening: plan.openingDevice.id,
    titlePattern: plan.titlePattern.id,
    headings: plan.headingStyle.id,
    rhythm: plan.rhythm.id,
    person: plan.person.id,
    stylebook: plan.stylebook.id,
    quirks: plan.quirks,
    lens: plan.lens.id,
    audience: plan.audience.id,
    stake: plan.stake.id,
    model: plan.model,
    temperature: plan.temperature,
    effort: plan.effort,
    secondPass: plan.secondPass,
    components: {
      ...plan.components,
      ctaShape: plan.components.ctaShape.id,
    },
    images: {
      inlineCount: plan.images.inlineCount,
      coverMode: plan.images.coverMode,
      coverPalette: plan.images.coverPalette.id,
      coverModifier: plan.images.coverModifier.id,
      kinds: plan.images.kinds.map((k) => k.id),
      aspects: plan.images.aspects.map((a) => a.id),
      ogLayout: plan.images.ogLayout.id,
    },
    social: {
      attach: plan.social.attachLinkedIn,
      shape: plan.social.shape.id,
      length: plan.social.lengthBand.id,
      hashtags: plan.social.hashtagCount,
      withImage: plan.social.withImage,
    },
    schemaType: plan.schemaType,
  };
}
