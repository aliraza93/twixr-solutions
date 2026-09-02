import type { ContentGraph } from "@/lib/pipeline/seo/graph";
import type { InventoryItem } from "@/lib/pipeline/seo/types";
import {
  normalizeSiteUrl,
  pathFromUrl,
  toAbsoluteInventoryUrl,
} from "@/lib/pipeline/seo/types";
import { extractUrls } from "@/lib/pipeline/validators";
import { SITE_URL } from "@/lib/seo";

export type OrphanFinding = {
  path: string;
  url: string;
  type: InventoryItem["type"];
  title: string;
  inbound: number;
  suggestion: string;
};

export type BrokenLinkFinding = {
  fromSlug: string;
  href: string;
  reason: string;
};

export type SeoAuditReport = {
  orphanCount: number;
  brokenCount: number;
  overlinkedCount: number;
  orphans: OrphanFinding[];
  broken: BrokenLinkFinding[];
  overlinked: Array<{ url: string; inbound: number }>;
  notes: string[];
};

function siteHost(): string {
  return new URL(SITE_URL).hostname.replace(/^www\./, "");
}

/**
 * Orphan / overlink / broken-internal audit (log-only; does not rewrite content).
 * Orphans: service/portfolio/blog with zero inbound links from published blog bodies.
 * Broken: internal hrefs in blog bodies that are not in the inventory allowlist.
 */
export function runSeoLinkAudit(input: {
  inventory: InventoryItem[];
  graph: ContentGraph;
  blogBodies: Array<{ slug: string; body: string }>;
}): SeoAuditReport {
  const { inventory, graph, blogBodies } = input;
  const allow = new Set(inventory.map((i) => normalizeSiteUrl(i.url)));
  const pathAllow = new Set(inventory.map((i) => i.path));

  const orphans: OrphanFinding[] = [];
  for (const item of inventory) {
    if (item.type === "page") continue; // hub pages are expected entry points
    const inbound = graph.inboundByPath.get(item.path) || 0;
    if (inbound > 0) continue;
    orphans.push({
      path: item.path,
      url: item.url,
      type: item.type,
      title: item.title,
      inbound,
      suggestion:
        item.type === "service"
          ? `Consider linking this service from a relevant blog when the reader would benefit.`
          : item.type === "portfolio"
            ? `Weak internal discovery. Link from a related technical article when evidence fits.`
            : `Blog has no inbound links from other posts yet. Prefer it in future related/internal plans when relevant.`,
    });
  }

  const broken: BrokenLinkFinding[] = [];
  for (const blog of blogBodies) {
    for (const raw of extractUrls(blog.body)) {
      let abs: string;
      try {
        abs = toAbsoluteInventoryUrl(raw);
      } catch {
        continue;
      }
      let host = "";
      try {
        host = new URL(abs).hostname.replace(/^www\./, "");
      } catch {
        if (raw.startsWith("/") && !raw.startsWith("//")) {
          // relative internal
        } else {
          continue;
        }
      }
      if (host && host !== siteHost()) continue;
      if (!host && !(raw.startsWith("/") && !raw.startsWith("//"))) continue;

      const normalized = normalizeSiteUrl(abs);
      const path = pathFromUrl(normalized);
      if (allow.has(normalized) || pathAllow.has(path)) continue;

      broken.push({
        fromSlug: blog.slug,
        href: raw,
        reason: "Internal URL not in published inventory (missing, draft, or invented)",
      });
    }
  }

  const overlinked = graph.overlinkedUrls.map((url) => ({
    url,
    inbound: graph.inboundByUrl.get(url) || 0,
  }));

  const notes = [
    `Inventory nodes: ${inventory.length}`,
    `Graph edges (blog outbound): ${graph.edges.length}`,
    `Mean inbound: ${graph.meanInbound}`,
    `Orphans (service/portfolio/blog): ${orphans.length}`,
    `Broken internal hrefs: ${broken.length}`,
    `Overlinked URLs: ${overlinked.length}`,
  ];

  return {
    orphanCount: orphans.length,
    brokenCount: broken.length,
    overlinkedCount: overlinked.length,
    orphans: orphans.slice(0, 25),
    broken: broken.slice(0, 40),
    overlinked: overlinked.slice(0, 15),
    notes,
  };
}

export function formatSeoAuditText(report: SeoAuditReport): string {
  return [
    `SEO audit: ${report.orphanCount} orphan(s), ${report.brokenCount} broken internal, ${report.overlinkedCount} overlinked`,
    ...report.notes,
    report.orphans[0]
      ? `Top orphan: [${report.orphans[0].type}] ${report.orphans[0].title} (${report.orphans[0].path})`
      : "Top orphan: none",
    report.broken[0]
      ? `Sample broken: /blog/${report.broken[0].fromSlug} -> ${report.broken[0].href}`
      : "Sample broken: none",
  ].join("\n");
}
