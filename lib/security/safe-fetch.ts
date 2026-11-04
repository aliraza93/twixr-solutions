import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicAddress, isPublicHost } from "@/lib/security/public-host";

/**
 * Fetch a URL that a user, Jarvis or a model supplied (source URLs, links in
 * drafts) without letting it reach the site's own network:
 *
 * - only http(s); the name must pass isPublicHost, and every address it
 *   resolves to must pass isPublicAddress (private, loopback, link-local,
 *   CGNAT, metadata, reserved and IPv4-embedding IPv6 are refused);
 * - redirects are never followed blindly: each hop is resolved and checked
 *   again, at most `maxRedirects` (default 3) times;
 * - one timeout covers the lookups and every hop;
 * - bodies are read through readCappedText with a byte cap.
 *
 * The resolver and fetch are parameters so tests use fakes. The check runs
 * just before each request; pinning the connection to the checked address
 * (closing the DNS rebinding window) needs an undici Agent with a checked
 * lookup, which is a listed CONTRACT.md follow-up.
 */

export type HostResolver = (hostname: string) => Promise<string[]>;
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type UnsafeUrlReason =
  | "invalid_url"
  | "not_http"
  | "blocked_host"
  | "unresolved"
  | "too_many_redirects";

export class UnsafeUrlError extends Error {
  constructor(
    readonly reason: UnsafeUrlReason,
    readonly url: string,
    message: string
  ) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export const DEFAULT_MAX_REDIRECTS = 3;

/** All addresses for a name, as the OS resolver returns them. */
export const systemResolver: HostResolver = async (hostname) => {
  const rows = await lookup(hostname, { all: true, verbatim: true });
  return rows.map((r) => r.address);
};

function abortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("The operation was aborted", "AbortError");
}

/** Resolve under the request's signal, so a slow lookup cannot outlive the timeout. */
async function resolveWithin(
  resolver: HostResolver,
  hostname: string,
  signal?: AbortSignal
): Promise<string[]> {
  if (!signal) return resolver(hostname);
  if (signal.aborted) throw abortError(signal);
  return new Promise<string[]>((resolve, reject) => {
    const onAbort = () => reject(abortError(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    resolver(hostname).then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

/**
 * Parse `raw` and refuse it unless it is http(s) on a public name whose every
 * resolved address is public. Returns the parsed URL.
 */
export async function assertPublicUrl(
  raw: string,
  opts: { resolver?: HostResolver; signal?: AbortSignal } = {}
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("invalid_url", raw, "Not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("not_http", raw, "Only http(s) URLs are fetched");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!isPublicHost(host)) {
    throw new UnsafeUrlError("blocked_host", raw, "URL host is not a public address");
  }
  if (isIP(host) !== 0) return url;

  let addresses: string[];
  try {
    addresses = await resolveWithin(opts.resolver ?? systemResolver, host, opts.signal);
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    throw new UnsafeUrlError("unresolved", raw, "URL host did not resolve");
  }
  if (addresses.length === 0) {
    throw new UnsafeUrlError("unresolved", raw, "URL host did not resolve");
  }
  if (!addresses.every(isPublicAddress)) {
    throw new UnsafeUrlError("blocked_host", raw, "URL host resolves to a non-public address");
  }
  return url;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export type SafeFetchOptions = {
  method?: "GET" | "HEAD";
  headers?: Record<string, string>;
  /** Covers the lookups and every hop. */
  timeoutMs?: number;
  /** An outer signal (for example a shared deadline); combined with timeoutMs. */
  signal?: AbortSignal;
  maxRedirects?: number;
  resolver?: HostResolver;
  fetchImpl?: FetchLike;
};

export type SafeFetchResult = {
  response: Response;
  /** The URL of the final hop. */
  url: string;
  redirects: number;
};

/**
 * Fetch with every hop checked. A redirect past `maxRedirects`, or to a URL
 * that fails assertPublicUrl, throws UnsafeUrlError; network errors and
 * timeouts throw as fetch does. The caller reads (or cancels) the body.
 */
export async function safeFetch(raw: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  const signals = [opts.signal, opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined].filter(
    (s): s is AbortSignal => Boolean(s)
  );
  const signal = signals.length > 1 ? AbortSignal.any(signals) : signals[0];

  let current = raw;
  for (let redirects = 0; ; redirects++) {
    const url = await assertPublicUrl(current, { resolver: opts.resolver, signal });
    const response = await fetchImpl(url.href, {
      method: opts.method ?? "GET",
      headers: opts.headers,
      redirect: "manual",
      signal,
    });
    const location = response.headers.get("location");
    if (!REDIRECT_STATUSES.has(response.status) || !location) {
      return { response, url: url.href, redirects };
    }
    await response.body?.cancel().catch(() => undefined);
    if (redirects >= maxRedirects) {
      throw new UnsafeUrlError("too_many_redirects", raw, `More than ${maxRedirects} redirects`);
    }
    try {
      current = new URL(location, url).href;
    } catch {
      throw new UnsafeUrlError("invalid_url", location, "Redirect location is not a valid URL");
    }
  }
}

/**
 * Read a body as UTF-8 text, keeping at most `maxBytes` (the rest is not
 * downloaded). `truncated` says the cap cut it.
 */
export async function readCappedText(
  response: Response,
  maxBytes: number
): Promise<{ text: string; truncated: boolean }> {
  if (!response.body) return { text: "", truncated: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = maxBytes - total;
    if (value.byteLength >= room) {
      chunks.push(value.subarray(0, room));
      total += room;
      // Exactly at the cap is complete only if nothing follows.
      truncated = value.byteLength > room || !(await reader.read()).done;
      if (truncated) await reader.cancel().catch(() => undefined);
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(Buffer.concat(chunks)), truncated };
}
