export const pipeline = {
  enabled: process.env.PIPELINE_ENABLED !== "false",
  /** When true (default), publish blog + schedule LinkedIn without needs_review. */
  autoPublish: process.env.PIPELINE_AUTO_PUBLISH !== "false",
  /** Soft weekly cadence (random days). Default 3-4 posts/week. */
  postsPerWeekMin: Number(process.env.PIPELINE_POSTS_PER_WEEK_MIN ?? 3),
  postsPerWeekMax: Number(process.env.PIPELINE_POSTS_PER_WEEK_MAX ?? 4),
  /** Generate X drafts for manual posting in admin (no X API). Default on. */
  xManualDrafts: process.env.PIPELINE_X_MANUAL !== "false",
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
    social: process.env.ANTHROPIC_SOCIAL_MODEL ?? "claude-haiku-4-5",
    image: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image",
    critic: process.env.GEMINI_CRITIC_MODEL ?? "gemini-3.6-flash",
  },
  linkedin: {
    token: process.env.LINKEDIN_ACCESS_TOKEN ?? "",
    person: process.env.LINKEDIN_PERSON_URN ?? "",
    version: process.env.LINKEDIN_API_VERSION ?? "202601",
  },
  defaults: {
    author: "Twixr Solutions",
    authorRole: "Senior Full Stack Engineer",
    authorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
  },
};
