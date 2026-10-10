import { pipeline } from "@/lib/pipeline/config";
import { SITE_URL } from "@/lib/seo";

/**
 * IndexNow submission.
 *
 * One POST tells Bing (and therefore Copilot, plus several LLM search tools
 * that read the Bing index) that a URL changed, instead of waiting for a
 * crawl. Free, instant, and it is the only push-style indexing signal
 * available for ordinary articles - Google's Indexing API only accepts
 * JobPosting and BroadcastEvent, so there is nothing to submit there.
 *
 * Requires INDEXNOW_KEY plus a matching key file at
 * public/<key>.txt containing the key. Silently disabled without it.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";

export type IndexNowResult = {
  submitted: number;
  status: number | null;
  skipped?: string;
};

export async function submitToIndexNow(
  urls: string[]
): Promise<IndexNowResult> {
  const key = pipeline.indexNowKey.trim();
  if (!key) {
    return { submitted: 0, status: null, skipped: "INDEXNOW_KEY not set" };
  }

  const absolute = [...new Set(urls)]
    .map((u) => (u.startsWith("http") ? u : new URL(u, SITE_URL).toString()))
    .filter((u) => u.startsWith(SITE_URL));

  if (!absolute.length) {
    return { submitted: 0, status: null, skipped: "no eligible URLs" };
  }

  const host = new URL(SITE_URL).hostname;

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: absolute,
      }),
      // Never let a push notification hold up a publish.
      signal: AbortSignal.timeout(8000),
    });
    return { submitted: absolute.length, status: response.status };
  } catch (error) {
    return {
      submitted: 0,
      status: null,
      skipped: error instanceof Error ? error.message : "request failed",
    };
  }
}
