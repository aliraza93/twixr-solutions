import type { InventoryItem } from "@/lib/pipeline/seo/types";
import {
  normalizeSiteUrl,
  pathFromUrl,
  toAbsoluteInventoryUrl,
} from "@/lib/pipeline/seo/types";
import { extractUrls } from "@/lib/pipeline/validators";
import { SITE_URL } from "@/lib/seo";

export type GraphEdge = {
  fromPath: string;
  toPath: string;
  fromType: InventoryItem["type"] | "blog";
  toType: InventoryItem["type"];
};

export type ContentGraph = {
  nodes: InventoryItem[];
  edges: GraphEdge[];
  /** Normalized absolute URL -> inbound edge count from blog bodies. */
  inboundByUrl: Map<string, number>;
  /** Path -> inbound count */
  inboundByPath: Map<string, number>;
  overlinkedUrls: string[];
  meanInbound: number;
};

export type BlogBodySource = {
  slug: string;
  body: string;
};

function siteHost(): string {
  return new URL(SITE_URL).hostname.replace(/^www\./, "");
}

function isInternalUrl(raw: string): boolean {
  try {
    const abs = toAbsoluteInventoryUrl(raw);
    const host = new URL(abs).hostname.replace(/^www\./, "");
    return host === siteHost();
  } catch {
    return raw.startsWith("/") && !raw.startsWith("//");
  }
}

/**
 * Build a content graph from inventory nodes + outbound links in blog bodies.
 * Edges are blog -> (service|portfolio|blog|page) only when the target exists.
 */
export function buildContentGraph(
  inventory: InventoryItem[],
  blogBodies: BlogBodySource[]
): ContentGraph {
  const byUrl = new Map<string, InventoryItem>();
  const byPath = new Map<string, InventoryItem>();
  for (const item of inventory) {
    byUrl.set(normalizeSiteUrl(item.url), item);
    byPath.set(item.path, item);
  }

  const inboundByUrl = new Map<string, number>();
  const inboundByPath = new Map<string, number>();
  for (const item of inventory) {
    inboundByUrl.set(normalizeSiteUrl(item.url), 0);
    inboundByPath.set(item.path, 0);
  }

  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();

  for (const blog of blogBodies) {
    const fromPath = `/blog/${blog.slug}`;
    const urls = extractUrls(blog.body);
    for (const raw of urls) {
      if (!isInternalUrl(raw)) continue;
      const abs = normalizeSiteUrl(toAbsoluteInventoryUrl(raw));
      const path = pathFromUrl(abs);
      const target = byUrl.get(abs) || byPath.get(path);
      if (!target) continue;

      const key = `${fromPath}->${target.path}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);

      edges.push({
        fromPath,
        toPath: target.path,
        fromType: "blog",
        toType: target.type,
      });

      inboundByUrl.set(
        normalizeSiteUrl(target.url),
        (inboundByUrl.get(normalizeSiteUrl(target.url)) || 0) + 1
      );
      inboundByPath.set(
        target.path,
        (inboundByPath.get(target.path) || 0) + 1
      );
    }
  }

  const counts = [...inboundByUrl.values()];
  const meanInbound =
    counts.length === 0
      ? 0
      : counts.reduce((a, b) => a + b, 0) / counts.length;

  const overlinkFloor = Math.max(4, Math.ceil(meanInbound * 2.5));
  const overlinkedUrls = [...inboundByUrl.entries()]
    .filter(([, n]) => n >= overlinkFloor)
    .map(([url]) => url);

  return {
    nodes: inventory,
    edges,
    inboundByUrl,
    inboundByPath,
    overlinkedUrls,
    meanInbound: Number(meanInbound.toFixed(2)),
  };
}

/** Soft penalty 0-0.12 for overlinked destinations (content graph balance). */
export function overlinkPenalty(
  url: string,
  graph: ContentGraph | undefined
): number {
  if (!graph) return 0;
  const n = graph.inboundByUrl.get(normalizeSiteUrl(url)) || 0;
  if (n < 4) return 0;
  if (graph.overlinkedUrls.includes(normalizeSiteUrl(url))) return 0.12;
  if (n >= Math.max(3, graph.meanInbound * 2)) return 0.06;
  return 0;
}
