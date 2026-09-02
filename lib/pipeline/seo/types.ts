import { SITE_URL, absoluteUrl } from "@/lib/seo";

export type InventoryPageType = "service" | "portfolio" | "blog" | "page";

export type InventoryItem = {
  type: InventoryPageType;
  url: string;
  path: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  topics?: string[];
};

export type RecommendedInternalLink = {
  url: string;
  path: string;
  title: string;
  type: InventoryPageType;
  suggestedAnchor: string;
  score: number;
};

export type SeoPlan = {
  primaryKeyword: string;
  searchIntent: string;
  contentCluster: string;
  cannibalizationRisk: number;
  recommendedInternalLinks: RecommendedInternalLink[];
  inventoryCount: number;
};

export function normalizeSiteUrl(url: string): string {
  try {
    const u = new URL(url, SITE_URL);
    u.hash = "";
    // Drop trailing slash except root
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url.trim();
  }
}

export function pathFromUrl(url: string): string {
  try {
    return new URL(url, SITE_URL).pathname;
  } catch {
    return url;
  }
}

export function toAbsoluteInventoryUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return normalizeSiteUrl(pathOrUrl);
  return absoluteUrl(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`);
}

/** Tokenize for overlap scoring (lowercase alphanumerics). */
export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s/+.-]/g, " ")
      .split(/[\s/+._-]+/)
      .filter((t) => t.length >= 3)
  );
}

export function overlapScore(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  return hit / Math.sqrt(a.size * b.size);
}
