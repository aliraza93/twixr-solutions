export const SITE_STATS = [
  { value: "10+", line1: "Years", line2: "Experience" },
  { value: "50+", line1: "Projects", line2: "Delivered" },
  { value: "Top Rated Plus", line1: "on Upwork", line2: null },
  { value: "99.9%", line1: "Client", line2: "Satisfaction" },
] as const;

export type SiteStat = (typeof SITE_STATS)[number];
