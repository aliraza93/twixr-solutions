import { GTA6_SHORTS } from "@/lib/pipeline/product/gta6shorts";
import { INVOICORA } from "@/lib/pipeline/product/invoicora";
import type { Product, ProductImage, ProductTopic } from "@/lib/pipeline/product/types";

export const PRODUCT_PILLAR_PREFIX = "Product/";

/**
 * Every product the pipeline writes about. A function, not a constant, so the
 * product files can import these helpers without a load-order cycle.
 */
export function allProducts(): Product[] {
  return [INVOICORA, GTA6_SHORTS];
}

export function isProductPillar(pillar: string): boolean {
  return pillar.trim().toLowerCase().startsWith(PRODUCT_PILLAR_PREFIX.toLowerCase());
}

export function productForPillar(pillar: string): Product | undefined {
  const key = pillar.trim().toLowerCase();
  return allProducts().find((p) => p.pillar.toLowerCase() === key);
}

export function topicFor(product: Product, topic: string): ProductTopic | undefined {
  const key = topic.trim().toLowerCase();
  return product.topics.find((t) => t.topic.toLowerCase() === key);
}

/**
 * The images for a product post: the topic's own list, else the product's
 * first two. Empty when the pillar is not a product.
 */
export function screenshotsFor(pillar: string, topic: string): ProductImage[] {
  const product = productForPillar(pillar);
  if (!product) return [];
  const ids =
    topicFor(product, topic)?.screenshots ??
    product.screenshots.slice(0, 2).map((s) => s.id);
  return ids
    .map((id) => product.screenshots.find((s) => s.id === id))
    .filter((s): s is ProductImage => Boolean(s));
}

export function screenshotUrl(product: Product, shot: ProductImage, siteUrl: string): string {
  return new URL(`/products/${product.key}/${shot.file}`, siteUrl).toString();
}

/** Short fact sheet the critic treats as grounded, so true prices are not marked "unverifiable". */
export function productFactSheet(pillar: string): string {
  const product = productForPillar(pillar);
  if (!product) return "";
  return [
    `VERIFIED PRODUCT FACTS (${product.name}, the author's own product, from ${product.url}):`,
    ...product.facts.map((f) => `- ${f}`),
  ].join("\n");
}

function imageWord(product: Product): string {
  return product.imageKind === "screenshot"
    ? "a real screenshot of"
    : "a designed graphic (not a screenshot) showing";
}

/**
 * The brief's extra instructions for a product post. Stored on the brief,
 * so the writer gets them through the normal admin-instructions block.
 */
export function productInstructions(product: Product, topic: ProductTopic): string {
  const inline = topic.screenshots.slice(1);
  const shots = inline
    .map((id, i) => {
      const s = product.screenshots.find((x) => x.id === id);
      return s ? `  __INLINE_${i + 1}__ is ${imageWord(product)} ${s.shows}.` : "";
    })
    .filter(Boolean);
  const replacedWith =
    product.imageKind === "screenshot"
      ? "real product screenshots"
      : `designed ${product.name} graphics`;
  return [
    `PRODUCT POST: this post is about ${product.name}, Ali's own product.`,
    "Write something genuinely useful to the reader first; the product is the worked example, not an advert.",
    `Say in your own voice that you built ${product.name}. No hype, no banned phrases, no fake testimonials, users, revenue or metrics.`,
    `Use ONLY the product facts below for anything about ${product.name}. If a fact is not listed, do not claim it.`,
    productFactSheet(product.pillar),
    ...(product.writerRules?.length ? ["", ...product.writerRules] : []),
    "",
    `LINKS (required): link to ${product.name} 2 to 4 times with descriptive anchor text, never 'click here'. Use these exact URLs:`,
    ...Object.entries(product.links).map(([k, v]) => `- ${k}: ${v}`),
    "Include the home page once, and end with one short, plain call to try it free.",
    "",
    shots.length
      ? [
          `IMAGES: use exactly ${shots.length} inline image placeholder(s). They will be replaced with ${replacedWith}, so place each next to the paragraph it illustrates, never at the end:`,
          ...shots,
          "Write each alt as what that image shows.",
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Extra LinkedIn instructions for a product post. */
export function productLinkedInNote(pillar: string): string {
  const product = productForPillar(pillar);
  if (!product) return "";
  return [
    `PRODUCT: this post is about ${product.name}, a product you built. Say so plainly, once.`,
    "Lead with the reader's problem; the product is the answer, not the headline.",
    `Put ${product.url} on its own line once, before the "Full write-up" line.`,
    "Use only these facts about the product; claim nothing else:",
    ...product.facts.map((f) => `- ${f}`),
    ...(product.writerRules?.length ? product.writerRules : []),
  ].join("\n");
}

/**
 * The short company-page version of a product post. Built from the published
 * blog, so it needs no extra model call and cannot drift from the facts. The
 * page speaks as the product, so there is no "I built".
 */
export function companyPageText(
  product: Product,
  post: { title: string; excerpt: string; url: string }
): string {
  const tags = (product.companyPage?.hashtags ?? []).map((t) =>
    t.startsWith("#") ? t : `#${t}`
  );
  const excerpt = post.excerpt.replace(/\s+/g, " ").trim();
  const parts = [
    `New guide: ${post.title}`,
    excerpt,
    `Read it here: ${post.url}`,
    `Try ${product.name} free: ${product.url}`,
    tags.join(" "),
  ].filter(Boolean);
  return parts.join("\n\n").replace(/[–—]/g, ",").slice(0, 3000);
}
