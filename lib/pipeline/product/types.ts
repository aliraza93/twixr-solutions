/**
 * A product of Ali's that the pipeline writes about on a fixed cadence.
 * Everything the writer may say about it lives in the product's own file;
 * the writer is told never to go beyond the facts listed there.
 */

export type ProductImage = {
  id: string;
  file: string;
  alt: string;
  /** What the picture shows, for the writer to place it next to the right text. */
  shows: string;
};

export type ProductTopic = {
  topic: string;
  targetKeyword: string;
  angle: string;
  /** Image ids: the first is the cover, the rest go inline. */
  screenshots: string[];
};

export type Product = {
  /** Stable key, also the folder under public/products/. */
  key: string;
  name: string;
  /** Brief pillar, always under "Product/". */
  pillar: string;
  url: string;
  links: Record<string, string>;
  facts: string[];
  /**
   * "screenshot": real captures of the live product.
   * "graphic": designed brand cards and diagrams (never passed off as screenshots).
   */
  imageKind: "screenshot" | "graphic";
  screenshots: ProductImage[];
  topics: ProductTopic[];
  /** Extra writer rules for this product, after the shared ones. */
  writerRules?: string[];
  /**
   * When set, each post also gets a short version for the product's LinkedIn
   * company page (channel "linkedin_page"), published only if the page is
   * configured (LINKEDIN_ORG_URN).
   */
  companyPage?: {
    hashtags: string[];
  };
};
