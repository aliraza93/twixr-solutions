export type IconAccent = {
  icon: string;
  bg: string;
  border: string;
  glow: string;
};

/** Accent on primary (dark) buttons — matches hero mesh cyan. */
export const ICON_ON_PRIMARY = "text-sky-300";

/** Contact & location accents aligned with blue→violet hero gradient. */
export const ICON_MAIL = "text-blue-600 dark:text-blue-400";
export const ICON_LOCATION = "text-indigo-600 dark:text-indigo-400";

/**
 * Rotating accents — indigo / violet / blue / cyan family only
 * (matches hero gradient, mesh blobs, and slate primary).
 */
export const ICON_ACCENTS: IconAccent[] = [
  {
    icon: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-200/80 dark:border-indigo-500/30",
    glow: "bg-indigo-500",
  },
  {
    icon: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-200/80 dark:border-violet-500/30",
    glow: "bg-violet-500",
  },
  {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-200/80 dark:border-blue-500/30",
    glow: "bg-blue-500",
  },
  {
    icon: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-200/80 dark:border-cyan-500/30",
    glow: "bg-cyan-500",
  },
  {
    icon: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-200/80 dark:border-sky-500/30",
    glow: "bg-sky-500",
  },
  {
    icon: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-200/80 dark:border-purple-500/30",
    glow: "bg-purple-500",
  },
];

export function getIconAccent(index: number): IconAccent {
  return ICON_ACCENTS[index % ICON_ACCENTS.length];
}

/** Named palette for data-driven sections (e.g. approach steps). */
export const NAMED_ICON_ACCENTS: Record<string, IconAccent> = {
  indigo: ICON_ACCENTS[0],
  violet: ICON_ACCENTS[1],
  blue: ICON_ACCENTS[2],
  cyan: ICON_ACCENTS[3],
  sky: ICON_ACCENTS[4],
  purple: ICON_ACCENTS[5],
  // Legacy step color names → nearest brand hue
  fuchsia: ICON_ACCENTS[1],
  emerald: ICON_ACCENTS[3],
  amber: ICON_ACCENTS[4],
  rose: ICON_ACCENTS[0],
};

export function getNamedIconAccent(name: string, fallbackIndex = 0): IconAccent {
  return NAMED_ICON_ACCENTS[name] ?? getIconAccent(fallbackIndex);
}

/** Service & category icons — same indigo/violet/blue/cyan system. */
export const SERVICE_ICON_COLORS = {
  Layers: "text-violet-600 dark:text-violet-400",
  Server: "text-indigo-600 dark:text-indigo-400",
  Monitor: "text-sky-600 dark:text-sky-400",
  Bot: "text-purple-600 dark:text-purple-400",
  Cloud: "text-cyan-600 dark:text-cyan-400",
  Smartphone: "text-blue-600 dark:text-blue-400",
} as const;

export const CATEGORY_ICON_COLORS: Record<string, string> = {
  all: "text-violet-600 dark:text-violet-400",
  product: "text-violet-600 dark:text-violet-400",
  backend: "text-indigo-600 dark:text-indigo-400",
  ai: "text-purple-600 dark:text-purple-400",
  cloud: "text-cyan-600 dark:text-cyan-400",
  mobile: "text-blue-600 dark:text-blue-400",
};
