/**
 * Em/en dashes are a common LLM fingerprint in published copy.
 * Strip them from stored + rendered public content (not CSS-hidden).
 * ASCII hyphens and markdown `---` rules are left alone.
 */

const DASH_CHARS = /[\u2014\u2013\u2212]/; // — – −
const DASH_ENTITIES = /&mdash;|&#8212;|&#x2014;|&ndash;|&#8211;|&#x2013;/gi;

export function stripEmDashes(input: string): string {
  if (!input) return input;
  if (!DASH_CHARS.test(input) && !DASH_ENTITIES.test(input)) return input;
  // Reset sticky /g lastIndex from .test above
  DASH_ENTITIES.lastIndex = 0;

  return input
    .replace(DASH_ENTITIES, " - ")
    .replace(/\s*[\u2014\u2013\u2212]\s*/g, " - ")
    .replace(/ {2,}/g, " ");
}

/** Recursively normalize every string in plain objects / arrays (CMS JSON payloads). */
export function stripEmDashesDeep<T>(value: T): T {
  if (typeof value === "string") return stripEmDashes(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => stripEmDashesDeep(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripEmDashesDeep(child);
    }
    return out as T;
  }
  return value;
}
