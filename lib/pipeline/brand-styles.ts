import { randomInt } from "node:crypto";

/** Visual presets for covers / inline / LinkedIn images. One picked at random per asset. */

export type BrandStyleId =
  | "dark-grid"
  | "pine-wash"
  | "lime-slash"
  | "navy-cream"
  | "slate-amber"
  | "paper-coral"
  | "dusk-sky"
  | "charcoal-violet"
  | "stone-teal"
  | "midnight-rose"
  | "fog-indigo"
  | "sand-ink";

export type BrandStyle = {
  id: BrandStyleId;
  label: string;
  /** Short brief for Gemini prompts */
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
      "Dark charcoal (#0D0D0D) canvas with a subtle dotted grid, lime (#BEF03A) accents, white type energy, Twixr technical brand look. No logos of other companies. No tiny unreadable text.",
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
      "Deep pine green (#0B3D28) atmospheric wash, soft lime (#BEF03A) highlights, editorial technical mood, generous negative space. No stock-photo people. No third-party logos.",
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
      "Bold lime (#BEF03A) diagonal slash on near-black ink (#0B0F0D), high-contrast modern agency poster, sharp edges, minimal. No clutter. No fake UI chrome with unreadably small text.",
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
    id: "navy-cream",
    label: "Navy cream",
    aiPrompt:
      "Deep navy (#0B1B3A) field with warm cream (#F5EDE0) type and soft gold (#E8C547) accents, editorial magazine cover, calm technical metaphor. No third-party logos.",
    og: {
      background: "#0B1B3A",
      ink: "#F5EDE0",
      muted: "#A8B4C8",
      accent: "#E8C547",
      panel: "#132548",
      pattern: "none",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "slate-amber",
    label: "Slate amber",
    aiPrompt:
      "Cool slate (#1C2430) background, bright amber (#F59E0B) accents, crisp white labels, modern SaaS diagram energy. Abstract systems only. No stock people.",
    og: {
      background: "#1C2430",
      ink: "#F8FAFC",
      muted: "#94A3B8",
      accent: "#F59E0B",
      panel: "#273244",
      pattern: "lines",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "paper-coral",
    label: "Paper coral",
    aiPrompt:
      "Warm paper (#F7F1E8) canvas, deep charcoal (#1A1A1A) ink, coral (#E85D4C) accent blocks, clean print-poster layout for a technical blog. Generous whitespace. No logos.",
    og: {
      background: "#F7F1E8",
      ink: "#1A1A1A",
      muted: "#6B6560",
      accent: "#E85D4C",
      panel: "#EDE4D8",
      pattern: "dots",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "dusk-sky",
    label: "Dusk sky",
    aiPrompt:
      "Dusk purple-blue (#1E1535) atmosphere with sky (#38BDF8) highlights and soft lilac mist, cinematic technical cover, one clear focal metaphor. No watermark spam.",
    og: {
      background: "#1E1535",
      ink: "#F0F4FF",
      muted: "#A5B0D0",
      accent: "#38BDF8",
      panel: "#2A1F4A",
      pattern: "mesh",
      titleAlign: "center",
      showMark: true,
    },
  },
  {
    id: "charcoal-violet",
    label: "Charcoal violet",
    aiPrompt:
      "Charcoal (#141218) base with electric violet (#A78BFA) accents and soft white type, abstract architecture nodes, premium dark product aesthetic. No third-party brands.",
    og: {
      background: "#141218",
      ink: "#F5F3FF",
      muted: "#9CA3AF",
      accent: "#A78BFA",
      panel: "#1F1B28",
      pattern: "dots",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "stone-teal",
    label: "Stone teal",
    aiPrompt:
      "Warm stone (#E8E4DC) background, deep teal (#0F766E) accents, dark ink (#1C1917) type, calm engineering notebook feel with clear shapes. No clutter.",
    og: {
      background: "#E8E4DC",
      ink: "#1C1917",
      muted: "#78716C",
      accent: "#0F766E",
      panel: "#D6D1C7",
      pattern: "lines",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "midnight-rose",
    label: "Midnight rose",
    aiPrompt:
      "Midnight (#0C0A0F) canvas with rose (#FB7185) accents and cool gray muted lines, bold geometric focal shape, modern agency poster. Short labels only.",
    og: {
      background: "#0C0A0F",
      ink: "#FAFAFA",
      muted: "#A1A1AA",
      accent: "#FB7185",
      panel: "#1A1520",
      pattern: "none",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "fog-indigo",
    label: "Fog indigo",
    aiPrompt:
      "Soft fog gray (#EEF1F6) field, indigo (#4338CA) accent bars, near-black type, airy technical illustration with light grid. Clean and readable at phone size.",
    og: {
      background: "#EEF1F6",
      ink: "#111827",
      muted: "#6B7280",
      accent: "#4338CA",
      panel: "#E0E5EE",
      pattern: "dots",
      titleAlign: "left",
      showMark: true,
    },
  },
  {
    id: "sand-ink",
    label: "Sand ink",
    aiPrompt:
      "Desert sand (#E7D9C4) background, deep ink (#0F172A) shapes, burnt orange (#EA580C) callouts, architectural blueprint energy without real product logos.",
    og: {
      background: "#E7D9C4",
      ink: "#0F172A",
      muted: "#78716C",
      accent: "#EA580C",
      panel: "#D6C5AB",
      pattern: "lines",
      titleAlign: "left",
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
