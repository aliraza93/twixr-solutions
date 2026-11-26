import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchSourceExcerpt, MAX_SOURCE_BYTES } from "@/lib/pipeline/manual/source-fetch";
import { deadLinkCheck } from "@/lib/pipeline/validators";
import {
  MIN_CRON_SECRET_LENGTH,
  bearerHeaderMatches,
  cronAuthorized,
  usableSecret,
} from "@/lib/security/bearer";
import { isPublicAddress } from "@/lib/security/public-host";
import {
  UnsafeUrlError,
  assertPublicUrl,
  readCappedText,
  safeFetch,
  type FetchLike,
  type HostResolver,
} from "@/lib/security/safe-fetch";

/* ------------------------------------------------------------------ */
/* Bearer secrets                                                      */
/* ------------------------------------------------------------------ */

const SECRET = "a-cron-secret-of-24-chars";

describe("bearer secrets", () => {
  it("matches only the exact Bearer header for a usable secret", () => {
    assert.equal(bearerHeaderMatches(`Bearer ${SECRET}`, SECRET, 16), true);
    for (const header of [null, "", SECRET, `bearer ${SECRET}`, `Bearer ${SECRET} `, `Bearer ${SECRET}x`, "Bearer "]) {
      assert.equal(bearerHeaderMatches(header, SECRET, 16), false, String(header));
    }
  });

  it("refuses everything when the cron secret is unset or blank", () => {
    for (const secret of [undefined, "", "   "]) {
      assert.equal(usableSecret(secret, MIN_CRON_SECRET_LENGTH), null);
      for (const header of ["Bearer undefined", `Bearer ${secret}`, "Bearer ", "Bearer null", null]) {
        assert.equal(bearerHeaderMatches(header, secret, MIN_CRON_SECRET_LENGTH), false, `${secret} / ${header}`);
      }
    }
    assert.equal(usableSecret("x", MIN_CRON_SECRET_LENGTH), "x");
  });

  it("still honours a longer minimum when one is given", () => {
    assert.equal(usableSecret("x".repeat(15), 16), null);
    assert.equal(bearerHeaderMatches(`Bearer ${"x".repeat(15)}`, "x".repeat(15), 16), false);
  });

  it("cronAuthorized reads CRON_SECRET from the given env", () => {
    const req = (auth?: string) => ({ headers: new Headers(auth ? { authorization: auth } : {}) });
    assert.equal(cronAuthorized(req(`Bearer ${SECRET}`), { CRON_SECRET: SECRET }), true);
    assert.equal(cronAuthorized(req("Bearer wrong-but-long-enough"), { CRON_SECRET: SECRET }), false);
    const originalError = console.error;
    console.error = () => undefined;
    try {
      assert.equal(cronAuthorized(req("Bearer undefined"), {}), false);
      assert.equal(cronAuthorized(req("Bearer "), { CRON_SECRET: "  " }), false);
    } finally {
      console.error = originalError;
    }
    // A short secret is accepted: refusing it would stop scheduled publishing.
    assert.equal(cronAuthorized(req("Bearer short"), { CRON_SECRET: "short" }), true);
    assert.equal(cronAuthorized(req("Bearer shorx"), { CRON_SECRET: "short" }), false);
  });
});

/* ------------------------------------------------------------------ */
/* Resolved address checks                                             */
/* ------------------------------------------------------------------ */

const PUBLIC_V4 = "93.184.215.14";
const PUBLIC_V6 = "2606:4700::1111";

/** A fake DNS: unknown names fail like ENOTFOUND. */
function resolverFrom(table: Record<string, string[]>): HostResolver & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (host: string) => {
    calls.push(host);
    const hit = table[host];
    if (!hit) throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${host}`), { code: "ENOTFOUND" });
    return hit;
  }) as HostResolver & { calls: string[] };
  fn.calls = calls;
  return fn;
}

type Route = { status: number; headers?: Record<string, string>; body?: string };

/** A fake network keyed by URL; records each request. */
function network(routes: Record<string, Route | ((init: RequestInit) => Route)>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const route = routes[url];
    if (!route) throw new TypeError("fetch failed");
    const r = typeof route === "function" ? route(init) : route;
    const body = init.method === "HEAD" || [204, 304].includes(r.status) ? null : r.body ?? "";
    return new Response(body, { status: r.status, headers: r.headers });
  };
  return { fetchImpl, calls };
}

describe("isPublicAddress", () => {
  it("accepts public v4 and v6 literals only", () => {
    assert.equal(isPublicAddress(PUBLIC_V4), true);
    assert.equal(isPublicAddress(PUBLIC_V6), true);
    assert.equal(isPublicAddress(`[${PUBLIC_V6}]`), true);
    assert.equal(isPublicAddress("example.com"), false);
    // Neighbours of the refused ranges stay public.
    for (const a of ["192.88.98.1", "2001:4860:4860::8888", "2001:1::1", "100:0:0:1::1", "64:ff9c::1"]) {
      assert.equal(isPublicAddress(a), true, a);
    }
  });

  it("refuses private, loopback, link-local, CGNAT, metadata, reserved and IPv4-embedding v6", () => {
    for (const a of [
      "10.0.0.1",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.169.254",
      "172.16.0.1",
      "192.168.1.1",
      "100.64.0.1",
      "198.18.0.1",
      "203.0.113.5",
      "224.0.0.1",
      "240.0.0.1",
      "255.255.255.255",
      "::1",
      "::",
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "::127.0.0.1",
      "64:ff9b::a00:1",
      "2002:a00:1::1",
      "2001:db8::1",
      "fc00::1",
      "fd00:ec2::254",
      "fe80::1",
      "fe80::1%eth0",
      "ff02::1",
      "192.88.99.1",
      "2001::1",
      "2001:0:4136:e378:8000:63bf:3fff:fdd2",
      "::ffff:0:a00:1",
      "::ffff:0:808:808",
      "64:ff9b:1::a00:1",
      "100::1",
      "100::ffff:ffff:ffff:ffff",
    ]) {
      assert.equal(isPublicAddress(a), false, a);
    }
  });
});

describe("assertPublicUrl", () => {
  it("passes a public name whose every address is public", async () => {
    const resolver = resolverFrom({ "laravel.com": [PUBLIC_V4, PUBLIC_V6] });
    const url = await assertPublicUrl("https://laravel.com/docs", { resolver });
    assert.equal(url.href, "https://laravel.com/docs");
    assert.deepEqual(resolver.calls, ["laravel.com"]);
  });

  it("refuses a public name if any resolved address is not public", async () => {
    for (const bad of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "::ffff:192.168.0.1", "fd00::1", "100.100.1.1"]) {
      const resolver = resolverFrom({ "rebind.example": [PUBLIC_V4, bad] });
      await assert.rejects(
        assertPublicUrl("https://rebind.example/", { resolver }),
        (e: unknown) => e instanceof UnsafeUrlError && e.reason === "blocked_host",
        bad
      );
    }
  });

  it("refuses literal private hosts and local names without resolving", async () => {
    const resolver = resolverFrom({});
    for (const raw of ["http://127.0.0.1/", "http://[::1]/", "http://localhost/", "http://metadata.google.internal/", "http://0x7f000001/"]) {
      await assert.rejects(assertPublicUrl(raw, { resolver }), (e: unknown) => e instanceof UnsafeUrlError && e.reason === "blocked_host", raw);
    }
    assert.deepEqual(resolver.calls, []);
  });

  it("allows only the standard ports", async () => {
    const resolver = resolverFrom({ "laravel.com": [PUBLIC_V4] });
    for (const raw of ["https://laravel.com/", "https://laravel.com:443/", "http://laravel.com:80/", "https://laravel.com:80/", "http://laravel.com:443/"]) {
      assert.equal((await assertPublicUrl(raw, { resolver })).hostname, "laravel.com", raw);
    }
    for (const raw of ["https://laravel.com:8443/", "http://laravel.com:8080/", "http://laravel.com:22/", `http://${PUBLIC_V4}:6379/`]) {
      await assert.rejects(assertPublicUrl(raw, { resolver }), (e: unknown) => e instanceof UnsafeUrlError && e.reason === "blocked_port", raw);
    }
  });

  it("does not resolve public literals; refuses non-http, junk and unresolvable names", async () => {
    const resolver = resolverFrom({ "empty.example": [] });
    assert.equal((await assertPublicUrl(`http://${PUBLIC_V4}/x`, { resolver })).hostname, PUBLIC_V4);
    assert.deepEqual(resolver.calls, []);
    const reasons: Array<[string, string]> = [
      ["ftp://laravel.com/", "not_http"],
      ["file:///etc/passwd", "not_http"],
      ["not a url", "invalid_url"],
      ["https://nowhere.example/", "unresolved"],
      ["https://empty.example/", "unresolved"],
    ];
    for (const [raw, reason] of reasons) {
      await assert.rejects(assertPublicUrl(raw, { resolver }), (e: unknown) => e instanceof UnsafeUrlError && e.reason === reason, raw);
    }
  });
});

describe("safeFetch", () => {
  const resolver = resolverFrom({
    "a.example": [PUBLIC_V4],
    "b.example": [PUBLIC_V6],
    "evil.example": ["10.0.0.5"],
  });

  it("fetches a public URL with redirect manual and the given method and headers", async () => {
    const net = network({ "https://a.example/page": { status: 200, body: "hello" } });
    const r = await safeFetch("https://a.example/page", {
      resolver,
      fetchImpl: net.fetchImpl,
      headers: { Accept: "text/html" },
    });
    assert.equal(r.response.status, 200);
    assert.equal(r.redirects, 0);
    assert.equal(net.calls[0].init.redirect, "manual");
    assert.equal(net.calls[0].init.method, "GET");
    assert.deepEqual(net.calls[0].init.headers, { Accept: "text/html" });
    assert.ok(net.calls[0].init.signal === undefined || net.calls[0].init.signal instanceof AbortSignal);
  });

  it("follows up to 3 redirects, re-checking each hop (relative locations too)", async () => {
    const net = network({
      "http://a.example/1": { status: 301, headers: { location: "https://a.example/2" } },
      "https://a.example/2": { status: 302, headers: { location: "https://b.example/3" } },
      "https://b.example/3": { status: 307, headers: { location: "/4" } },
      "https://b.example/4": { status: 200, body: "done" },
    });
    const r = await safeFetch("http://a.example/1", { resolver, fetchImpl: net.fetchImpl });
    assert.equal(r.url, "https://b.example/4");
    assert.equal(r.redirects, 3);
    assert.equal(await r.response.text(), "done");
    assert.ok(net.calls.every((c) => c.init.redirect === "manual"));
  });

  it("refuses a fourth redirect", async () => {
    const net = network({
      "https://a.example/1": { status: 301, headers: { location: "/2" } },
      "https://a.example/2": { status: 301, headers: { location: "/3" } },
      "https://a.example/3": { status: 301, headers: { location: "/4" } },
      "https://a.example/4": { status: 301, headers: { location: "/5" } },
      "https://a.example/5": { status: 200 },
    });
    await assert.rejects(
      safeFetch("https://a.example/1", { resolver, fetchImpl: net.fetchImpl }),
      (e: unknown) => e instanceof UnsafeUrlError && e.reason === "too_many_redirects"
    );
    assert.equal(net.calls.length, 4);
  });

  it("never requests a redirect target that is private by name, literal or resolution", async () => {
    for (const location of ["http://127.0.0.1/admin", "http://[::ffff:169.254.169.254]/", "https://evil.example/", "http://localhost/"]) {
      const net = network({ "https://a.example/go": { status: 302, headers: { location } } });
      await assert.rejects(
        safeFetch("https://a.example/go", { resolver, fetchImpl: net.fetchImpl }),
        (e: unknown) => e instanceof UnsafeUrlError && e.reason === "blocked_host",
        location
      );
      assert.equal(net.calls.length, 1, location);
    }
  });

  it("refuses a private first hop before any request", async () => {
    const net = network({});
    await assert.rejects(safeFetch("https://evil.example/", { resolver, fetchImpl: net.fetchImpl }), UnsafeUrlError);
    assert.equal(net.calls.length, 0);
  });

  it("returns a 3xx without a location as is", async () => {
    const net = network({ "https://a.example/nm": { status: 304 } });
    const r = await safeFetch("https://a.example/nm", { resolver, fetchImpl: net.fetchImpl });
    assert.equal(r.response.status, 304);
  });

  it("always runs under a deadline: 10 s by default, or the caller's signal", async () => {
    const seen: Array<AbortSignal | null | undefined> = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      seen.push(init.signal);
      return new Response("ok");
    };
    await safeFetch("https://a.example/", { resolver, fetchImpl });
    assert.ok(seen[0] instanceof AbortSignal && !seen[0].aborted, "a default timeout signal");
    const outer = new AbortController();
    await safeFetch("https://a.example/", { resolver, fetchImpl, signal: outer.signal });
    assert.equal(seen[1], outer.signal, "the caller's signal alone, no extra timeout");
  });

  it("refuses a redirect to a non-standard port before requesting it", async () => {
    const net = network({ "https://a.example/go": { status: 302, headers: { location: "https://a.example:8443/admin" } } });
    await assert.rejects(
      safeFetch("https://a.example/go", { resolver, fetchImpl: net.fetchImpl }),
      (e: unknown) => e instanceof UnsafeUrlError && e.reason === "blocked_port"
    );
    assert.equal(net.calls.length, 1);
  });

  it("times out a slow lookup", async () => {
    const slow: HostResolver = () => new Promise(() => undefined);
    const net = network({});
    // AbortSignal.timeout timers are unref'd: hold the event loop open so the
    // runner does not exit before the timeout fires.
    const keepAlive = setTimeout(() => undefined, 5000);
    try {
      await assert.rejects(safeFetch("https://slow.example/", { resolver: slow, fetchImpl: net.fetchImpl, timeoutMs: 20 }), (e: unknown) =>
        e instanceof Error && /timeout|abort/i.test(`${e.name} ${e.message}`)
      );
    } finally {
      clearTimeout(keepAlive);
    }
    assert.equal(net.calls.length, 0);
  });
});

describe("readCappedText", () => {
  it("reads a small body whole and caps a large one", async () => {
    assert.deepEqual(await readCappedText(new Response("abc"), 10), { text: "abc", truncated: false });
    assert.deepEqual(await readCappedText(new Response("abcdefghij"), 10), { text: "abcdefghij", truncated: false });
    const big = await readCappedText(new Response("x".repeat(5000)), 1000);
    assert.equal(big.text.length, 1000);
    assert.equal(big.truncated, true);
  });

  it("stops reading a stream at the cap", async () => {
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        if (pulls > 1000) controller.close();
        else controller.enqueue(new Uint8Array(1024).fill(97));
      },
    });
    const r = await readCappedText(new Response(stream), 4096);
    assert.equal(r.text.length, 4096);
    assert.equal(r.truncated, true);
    assert.ok(pulls < 20, `pulled ${pulls} chunks`);
  });
});

/* ------------------------------------------------------------------ */
/* The pipeline's fetches                                              */
/* ------------------------------------------------------------------ */

const HTML = `<html><head><title>Laravel 13 released</title></head><body><script>var x=1;</script><p>${"Laravel 13 ships queue improvements and a new starter kit. ".repeat(5)}</p></body></html>`;

describe("fetchSourceExcerpt", () => {
  const resolver = resolverFrom({ "laravel-news.com": [PUBLIC_V4], "internal.example": ["192.168.0.10"] });

  it("extracts a public page as before", async () => {
    const net = network({ "https://laravel-news.com/13": { status: 200, headers: { "content-type": "text/html" }, body: HTML } });
    const r = await fetchSourceExcerpt(" https://laravel-news.com/13 ", { resolver, fetchImpl: net.fetchImpl });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.url, "https://laravel-news.com/13");
    assert.equal(r.title, "Laravel 13 released");
    assert.match(r.excerpt, /Laravel 13 ships queue improvements/);
    assert.doesNotMatch(r.excerpt, /var x/);
    assert.equal(net.calls[0].init.redirect, "manual");
    assert.match(String((net.calls[0].init.headers as Record<string, string>)["User-Agent"]), /TwixrPipelineBot/);
  });

  it("follows a public redirect and refuses a private one", async () => {
    const ok = network({
      "https://laravel-news.com/old": { status: 301, headers: { location: "/13" } },
      "https://laravel-news.com/13": { status: 200, headers: { "content-type": "text/html" }, body: HTML },
    });
    assert.equal((await fetchSourceExcerpt("https://laravel-news.com/old", { resolver, fetchImpl: ok.fetchImpl })).ok, true);

    const bad = network({ "https://laravel-news.com/go": { status: 302, headers: { location: "https://internal.example/secrets" } } });
    const r = await fetchSourceExcerpt("https://laravel-news.com/go", { resolver, fetchImpl: bad.fetchImpl });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /^Source URL refused/);
    assert.equal(bad.calls.length, 1);
  });

  it("refuses a name that resolves privately without fetching", async () => {
    const net = network({});
    const r = await fetchSourceExcerpt("https://internal.example/", { resolver, fetchImpl: net.fetchImpl });
    assert.equal(r.ok, false);
    assert.equal(net.calls.length, 0);
  });

  it("keeps the old errors for non-http and HTTP failures, and caps the body", async () => {
    const r1 = await fetchSourceExcerpt("ftp://laravel-news.com/");
    assert.deepEqual(r1, { ok: false, url: "ftp://laravel-news.com/", error: "Source URL must be http(s)" });
    const net = network({
      "https://laravel-news.com/404": { status: 404 },
      "https://laravel-news.com/huge": { status: 200, headers: { "content-type": "text/plain" }, body: "word ".repeat(MAX_SOURCE_BYTES) },
    });
    const r2 = await fetchSourceExcerpt("https://laravel-news.com/404", { resolver, fetchImpl: net.fetchImpl });
    assert.deepEqual(r2, { ok: false, url: "https://laravel-news.com/404", error: "Fetch failed with HTTP 404" });
    const r3 = await fetchSourceExcerpt("https://laravel-news.com/huge", { resolver, fetchImpl: net.fetchImpl });
    assert.equal(r3.ok, true);
    if (r3.ok) assert.equal(r3.excerpt.length, 12000);
  });
});

describe("deadLinkCheck", () => {
  const resolver = resolverFrom({
    "ok.example": [PUBLIC_V4],
    "nohead.example": [PUBLIC_V4],
    "gone.example": [PUBLIC_V4],
    "moved.example": [PUBLIC_V4],
    "rebind.example": ["127.0.0.1"],
    "hops.example": [PUBLIC_V4],
    "nowhere-hop.example": [PUBLIC_V4],
  });
  const net = network({
    "https://ok.example/": { status: 200 },
    "https://nohead.example/": (init) => (init.method === "HEAD" ? { status: 405 } : { status: 206, body: "x" }),
    "https://gone.example/": { status: 404 },
    "https://moved.example/a": { status: 301, headers: { location: "https://ok.example/" } },
    "https://moved.example/b": { status: 301, headers: { location: "http://169.254.169.254/latest/meta-data" } },
    "https://hops.example/1": { status: 301, headers: { location: "/2" } },
    "https://hops.example/2": { status: 301, headers: { location: "/3" } },
    "https://hops.example/3": { status: 301, headers: { location: "/4" } },
    "https://hops.example/4": { status: 301, headers: { location: "/5" } },
    "https://nowhere-hop.example/": { status: 302, headers: { location: "https://unknown-name.example/" } },
  });

  it("passes live public links (HEAD, GET fallback, public redirects)", async () => {
    const reasons = await deadLinkCheck(["https://ok.example/", "https://nohead.example/", "https://moved.example/a"], {
      resolver,
      fetchImpl: net.fetchImpl,
    });
    assert.deepEqual(reasons, []);
    const getFallback = net.calls.find((c) => c.url === "https://nohead.example/" && c.init.method === "GET");
    assert.deepEqual(getFallback?.init.headers, { Range: "bytes=0-0" });
  });

  it("counts a chain of 4 public hops as alive without following past the limit", async () => {
    const before = net.calls.length;
    assert.deepEqual(await deadLinkCheck(["https://hops.example/1"], { resolver, fetchImpl: net.fetchImpl }), []);
    const requested = net.calls.slice(before).map((c) => c.url);
    assert.deepEqual(requested, ["https://hops.example/1", "https://hops.example/2", "https://hops.example/3", "https://hops.example/4"]);
  });

  it("still flags a redirect to a name that does not resolve", async () => {
    assert.deepEqual(await deadLinkCheck(["https://nowhere-hop.example/"], { resolver, fetchImpl: net.fetchImpl }), [
      "Dead or unreachable link: https://nowhere-hop.example/",
    ]);
  });

  it("flags dead links, private resolutions and private redirects with the same reason", async () => {
    const before = net.calls.length;
    const reasons = await deadLinkCheck(
      ["https://gone.example/", "https://rebind.example/", "https://moved.example/b", "http://10.0.0.1/"],
      { resolver, fetchImpl: net.fetchImpl }
    );
    assert.deepEqual(reasons.sort(), [
      "Dead or unreachable link: http://10.0.0.1/",
      "Dead or unreachable link: https://gone.example/",
      "Dead or unreachable link: https://moved.example/b",
      "Dead or unreachable link: https://rebind.example/",
    ]);
    const requested = net.calls.slice(before).map((c) => c.url);
    assert.ok(!requested.some((u) => /169\.254|10\.0\.0\.1|rebind/.test(u)), requested.join(", "));
  });
});

describe("JSON-LD output cannot break out of its script tag", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { JsonLd } = await import("@/components/seo/json-ld");
  const { serializeJsonLd } = await import("@/lib/security/json-ld");
  const { articleNode, breadcrumbNode, faqPageNode, jsonLdGraph } = await import("@/lib/seo");

  const evil = "</script><script>alert(1)</script><!-- & \u2028\u2029";

  it("escapes <, >, & and U+2028/2029 and still parses back to the same value", () => {
    const data = { name: evil, nested: [{ text: evil }] };
    const out = serializeJsonLd(data);
    assert.doesNotMatch(out, /[<>&\u2028\u2029]/);
    assert.match(out, /\\u003c\/script\\u003e/);
    assert.deepEqual(JSON.parse(out), data);
  });

  it("a blog page graph with a </script> title and FAQ question renders one inert script", () => {
    const data = jsonLdGraph([
      articleNode({ slug: "x", title: evil, excerpt: evil, date: "2026-11-04", image: "", body: "body" }),
      breadcrumbNode([{ name: evil, path: "/blog/x" }]),
      faqPageNode([{ question: evil, answer: `${evil} answer` }]),
    ]);
    const html = renderToStaticMarkup(createElement(JsonLd, { data }));
    assert.equal(html.match(/<script/g)?.length, 1, "only the JSON-LD script tag");
    assert.equal(html.match(/<\/script>/g)?.length, 1, "only its own closing tag");
    assert.doesNotMatch(html, /<!--/);
    const json = html.replace(/^<script type="application\/ld\+json">/, "").replace(/<\/script>$/, "");
    const parsed = JSON.parse(json) as { "@graph": Array<Record<string, unknown>> };
    assert.equal(parsed["@graph"][0].headline ?? parsed["@graph"][0].name, evil);
  });
});

describe("unsafe markup in titles, excerpts and FAQs", async () => {
  const { hasUnsafeMarkup } = await import("@/lib/security/unsafe-markup");

  it("flags script tags, handlers and javascript: URLs, not ordinary prose", () => {
    for (const bad of [
      "<script>x</script>",
      "a </script> b",
      "< SCRIPT src=x>",
      '<img src=x onerror="a()">',
      "<body onload = y>",
      '<a href="javascript:alert(1)">x</a>',
      "<iframe src=javascript:alert(1)>",
      "[click](javascript:alert(1))",
      "[click]( <JavaScript:alert(1)>)",
    ]) {
      assert.equal(hasUnsafeMarkup(bad), true, bad);
    }
    for (const ok of [
      "Why JavaScript bundles grow",
      "Laravel queues: retries",
      "Run it on Monday",
      "a < b and c > d",
      "json=true in the config",
      "JavaScript: The Good Parts",
      "Why JavaScript: a practical guide",
      "Use onclick= sparingly",
      "How do I set onChange= in React?",
      "Option one = cheaper",
    ]) {
      assert.equal(hasUnsafeMarkup(ok), false, ok);
    }
  });
});
