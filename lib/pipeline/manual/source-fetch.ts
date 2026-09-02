const MAX_CHARS = 12000;

export type SourceFetchResult =
  | { ok: true; url: string; title: string; excerpt: string }
  | { ok: false; url: string; error: string };

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripHtml(m[1]).slice(0, 200) : "";
}

/**
 * Fetch and extract plain-text facts from an optional Source URL.
 */
export async function fetchSourceExcerpt(
  sourceUrl: string
): Promise<SourceFetchResult> {
  const url = sourceUrl.trim();
  if (!url) {
    return { ok: false, url: "", error: "Source URL is empty" };
  }
  if (!isHttpUrl(url)) {
    return { ok: false, url, error: "Source URL must be http(s)" };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "TwixrPipelineBot/1.0 (+https://www.twixrsolutions.com)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      return {
        ok: false,
        url,
        error: `Fetch failed with HTTP ${res.status}`,
      };
    }
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();
    if (
      contentType.includes("text/html") ||
      contentType.includes("xhtml") ||
      raw.includes("<html")
    ) {
      const title = extractTitle(raw);
      const excerpt = stripHtml(raw).slice(0, MAX_CHARS);
      if (excerpt.length < 80) {
        return {
          ok: false,
          url,
          error: "Source page had too little readable text",
        };
      }
      return { ok: true, url, title, excerpt };
    }
    const excerpt = raw.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    if (excerpt.length < 40) {
      return { ok: false, url, error: "Source body too short" };
    }
    return { ok: true, url, title: "", excerpt };
  } catch (error) {
    return {
      ok: false,
      url,
      error: error instanceof Error ? error.message : "Source fetch failed",
    };
  }
}
