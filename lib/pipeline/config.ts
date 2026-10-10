export const pipeline = {
  enabled: process.env.PIPELINE_ENABLED !== "false",
  /** When true (default), publish blog + schedule LinkedIn without needs_review. */
  autoPublish: process.env.PIPELINE_AUTO_PUBLISH !== "false",
  /** Soft weekly cadence (random days). Default 3-4 posts/week. */
  postsPerWeekMin: Number(process.env.PIPELINE_POSTS_PER_WEEK_MIN ?? 3),
  postsPerWeekMax: Number(process.env.PIPELINE_POSTS_PER_WEEK_MAX ?? 4),
  /** Generate X drafts for manual posting in admin (no X API). Default on. */
  xManualDrafts: process.env.PIPELINE_X_MANUAL !== "false",
  /** SEO inventory + cannibalization + verified internal links. Default on. */
  seoEnabled: process.env.PIPELINE_SEO_ENABLED !== "false",
  /** Block generation when near-duplicate intent is detected. Default on. */
  seoCannibalBlock: process.env.PIPELINE_SEO_CANNIBAL_BLOCK !== "false",
  /**
   * Prefer high-score TopicOpportunity rows over topic-bank briefs.
   * Default on when SEO is enabled.
   */
  seoOpportunityPrefer: process.env.PIPELINE_SEO_OPPORTUNITY_PREFER !== "false",
  /** Minimum priority (0-100) to promote an opportunity ahead of the topic bank. */
  seoOpportunityMinPriority: Number(
    process.env.PIPELINE_SEO_OPPORTUNITY_MIN_PRIORITY ?? 75
  ),
  /** Hours after generate before the blog goes live (random in range). */
  blogPublishDelayMinHours: Number(process.env.PIPELINE_BLOG_DELAY_MIN_HOURS ?? 1),
  blogPublishDelayMaxHours: Number(process.env.PIPELINE_BLOG_DELAY_MAX_HOURS ?? 36),
  /** Hours after blog publish before LinkedIn (random in range). */
  linkedinDelayMinHours: Number(process.env.PIPELINE_LINKEDIN_DELAY_MIN_HOURS ?? 1),
  linkedinDelayMaxHours: Number(process.env.PIPELINE_LINKEDIN_DELAY_MAX_HOURS ?? 20),
  /** Relative weights for brief pillar selection (do not need to sum to 100). */
  pillarWeights: {
    build: Number(process.env.PIPELINE_WEIGHT_BUILD ?? 40),
    business: Number(process.env.PIPELINE_WEIGHT_BUSINESS ?? 30),
    timely: Number(process.env.PIPELINE_WEIGHT_TIMELY ?? 20),
    codeCard: Number(process.env.PIPELINE_WEIGHT_CODE_CARD ?? 10),
  },
  criticMinScore: Number(process.env.CRITIC_MIN_SCORE ?? 78),
  coverMode: (process.env.COVER_IMAGE_MODE ?? "ai") as "og" | "ai",
  notifyTo: process.env.PIPELINE_NOTIFY_TO ?? process.env.CONTACT_TO_EMAIL ?? "",
  models: {
    blog: process.env.ANTHROPIC_BLOG_MODEL ?? "claude-sonnet-4-6",
    /**
     * Rotation slots. Different models produce genuinely different prose
     * texture, which no amount of prompt variation reproduces. Weighted in
     * pipeline.variety.modelWeights (default 70 blog / 20 deep / 10 fast).
     * Note the API shapes differ per model - see lib/pipeline/model-capabilities.ts.
     */
    blogDeep: process.env.ANTHROPIC_BLOG_DEEP_MODEL ?? "claude-opus-5-5",
    blogFast: process.env.ANTHROPIC_BLOG_FAST_MODEL ?? "claude-haiku-5-5",
    social: process.env.ANTHROPIC_SOCIAL_MODEL ?? "claude-haiku-4-5",
    image: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image",
    critic: process.env.GEMINI_CRITIC_MODEL ?? "gemini-3.6-flash",
  },
  /** Author timezone. All human-shaped publish hours are drawn in this zone. */
  timezone: process.env.PIPELINE_TIMEZONE ?? "Asia/Karachi",
  /** Pin to reproduce a past run's variety plan. Empty means fresh entropy. */
  varietySeed: process.env.PIPELINE_VARIETY_SEED ?? "",
  /** How many recent posts a dimension must differ from. */
  varietyWindow: Number(process.env.PIPELINE_VARIETY_WINDOW ?? 5),
  variety: {
    /** Week mode weights: quiet | normal | burst. */
    weekModes: process.env.PIPELINE_WEEK_MODE_WEIGHTS ?? "",
    /** Min hours between two pipeline blogs going live. */
    minGapHoursMin: Number(process.env.PIPELINE_MIN_GAP_HOURS_MIN ?? 5),
    minGapHoursMax: Number(process.env.PIPELINE_MIN_GAP_HOURS_MAX ?? 30),
    maxPerDay: Number(process.env.PIPELINE_MAX_PER_DAY ?? 2),
    /** Never allow a silence longer than this, whatever the dice say. */
    maxSilentDays: Number(process.env.PIPELINE_MAX_SILENT_DAYS ?? 6),
    lengthBands: process.env.PIPELINE_LENGTH_BANDS ?? "",
    imageCounts: process.env.PIPELINE_IMAGE_COUNT_WEIGHTS ?? "",
    coverModes: process.env.PIPELINE_COVER_MODE_WEIGHTS ?? "",
    modelWeights: process.env.PIPELINE_MODEL_WEIGHTS ?? "",
    tempMin: Number(process.env.PIPELINE_TEMP_MIN ?? 0.75),
    tempMax: Number(process.env.PIPELINE_TEMP_MAX ?? 1.0),
    secondPassProb: Number(process.env.PIPELINE_SECOND_PASS_PROB ?? 0.25),
    linkedinAttachProb: Number(
      process.env.PIPELINE_LINKEDIN_ATTACH_PROB ?? 0.78
    ),
    /** Posts older than this are eligible for the refresh loop. */
    refreshMinAgeDays: Number(process.env.PIPELINE_REFRESH_MIN_AGE_DAYS ?? 90),
    refreshPerWeek: Number(process.env.PIPELINE_REFRESH_PER_WEEK ?? 2),
  },
  /** IndexNow key file in public/. Empty disables submission. */
  indexNowKey: process.env.INDEXNOW_KEY ?? "",
  linkedin: {
    token: process.env.LINKEDIN_ACCESS_TOKEN ?? "",
    person: process.env.LINKEDIN_PERSON_URN ?? "",
    version: process.env.LINKEDIN_API_VERSION ?? "202601",
  },
  defaults: {
    // A named human with a real photo. Google cross-checks the visible byline
    // against the Person node in lib/seo.ts, and a generated cartoon avatar is
    // the clearest machine-authorship signal a blog can carry.
    author: process.env.PIPELINE_AUTHOR_NAME ?? "Ali Raza",
    authorRole:
      process.env.PIPELINE_AUTHOR_ROLE ??
      "Senior Full Stack Engineer, Twixr Solutions",
    authorImage: process.env.PIPELINE_AUTHOR_IMAGE ?? "/ali-raza.jpg",
  },
};
