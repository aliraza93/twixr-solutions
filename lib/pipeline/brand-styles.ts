import { randomInt } from "node:crypto";

/** Twixr brand visual presets. One is chosen at random per asset. */

export type BrandStyleId =
  | "dark-grid"
  | "pine-wash"
  | "lime-slash"
  | "terminal"
  | "blueprint"
  | "spotlight";

export type BrandStyle = {
  id: BrandStyleId;
  label: string;
  /** Short brief for Gemini / Nano Banana prompts */
  aiPrompt: string;
  /** Colors for Satori OG covers */
  og: {
    background: string;
    ink: string;
    muted: string;
    accent: string;
    panel: string;
    pattern: "dots" | "lines" | "none" | "mesh";
    titleAlign: "left" | "center";
    showMark: boolean;
  };
};

export const BRAND_STYLES: BrandStyle[] = [
  {
    id: "dark-grid",
    label: "Dark grid",
    aiPrompt:
      "Dark charcoal (#0D0D0D) canvas with a subtle dotted grid, lime (#bef03a) accents, white type energy, Twixr technical brand look. No logos of other companies. No tiny unreadable text.",
    og: {
      background: "#0D0D0D",
      ink: "#FFFFFF",
      muted: "#A3A8A4",
      accent: "#BEF03A",
      panel: "#161A17",
      pattern: "dots",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "pine-wash",
    label: "Pine wash",
    aiPrompt:
      "Deep pine green (#0f5132) atmospheric wash, soft lime highlights, editorial technical mood, generous negative space, premium SaaS blog cover feel. No stock-photo people. No third-party logos.",
    og: {
      background: "#0B3D28",
      ink: "#F4FFF0",
      muted: "#B7D4C4",
      accent: "#BEF03A",
      panel: "#0F5132",
      pattern: "none",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "lime-slash",
    label: "Lime slash",
    aiPrompt:
      "Bold lime (#bef03a) diagonal slash or geometric block on near-black ink (#0b0f0d), high-contrast modern agency poster, sharp edges, minimal. No clutter. No fake UI chrome with unreadably small text.",
    og: {
      background: "#0B0F0D",
      ink: "#FFFFFF",
      muted: "#9AA39C",
      accent: "#BEF03A",
      panel: "#121812",
      pattern: "none",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "terminal",
    label: "Terminal",
    aiPrompt:
      "Developer terminal / IDE aesthetic, dark (#0d1117), monospace vibe, soft lime cursor accents, abstract code shapes (not real proprietary logos). Clean, readable composition for a technical blog.",
    og: {
      background: "#0D1117",
      ink: "#E6EDF3",
      muted: "#8B949E",
      accent: "#BEF03A",
      panel: "#161B22",
      pattern: "lines",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "blueprint",
    label: "Blueprint",
    aiPrompt:
      "Technical blueprint style: muted pine lines on dark ink, schematic / architecture diagram energy, lime callout nodes, engineering notebook feel. Abstract systems, not real product logos.",
    og: {
      background: "#0A1A14",
      ink: "#E8FFF4",
      muted: "#7FA892",
      accent: "#BEF03A",
      panel: "#0F2A20",
      pattern: "lines",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "spotlight",
    label: "Spotlight",
    aiPrompt:
      "Dark stage with a soft lime-green spotlight glow behind the subject, cinematic technical blog cover, one clear focal metaphor for the topic, premium and sparse. No watermark spam. No third-party brands.",
    og: {
      background: "#080A09",
      ink: "#FFFFFF",
      muted: "#9CA39E",
      accent: "#BEF03A",
      panel: "#121512",
      pattern: "mesh",
      titleAlign: "center",
      showMark: true,
    },
  },
];

export function pickBrandStyle(seed?: string): BrandStyle {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return BRAND_STYLES[hash % BRAND_STYLES.length];
  }
  return BRAND_STYLES[randomInt(BRAND_STYLES.length)];
}

export function brandStyleById(id: string | undefined): BrandStyle {
  return BRAND_STYLES.find((s) => s.id === id) ?? BRAND_STYLES[0];
}
