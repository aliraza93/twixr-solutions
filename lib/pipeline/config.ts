export const pipeline = {
  enabled: process.env.PIPELINE_ENABLED !== "false",
  criticMinScore: Number(process.env.CRITIC_MIN_SCORE ?? 78),
  coverMode: (process.env.COVER_IMAGE_MODE ?? "og") as "og" | "ai",
  notifyTo: process.env.PIPELINE_NOTIFY_TO ?? process.env.CONTACT_TO_EMAIL ?? "",
  models: {
    blog: process.env.ANTHROPIC_BLOG_MODEL ?? "claude-sonnet-4-6",
    social: process.env.ANTHROPIC_SOCIAL_MODEL ?? "claude-haiku-4-5",
    image: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
    critic: process.env.GEMINI_CRITIC_MODEL ?? "gemini-2.5-flash",
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
