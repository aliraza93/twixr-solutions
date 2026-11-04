import { isIP } from "node:net";

/**
 * Which hosts and addresses the site may fetch on behalf of a user or a model
 * (source URLs, links in drafts). Shared by the Jarvis control API schemas and
 * the pipeline's fetches (lib/security/safe-fetch.ts).
 */

/** Expand an IPv6 literal (optionally ending in a dotted quad) to 8 groups. */
function ipv6Groups(host: string): number[] | null {
  let text = host;
  const dotted = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number);
    text = `${text.slice(0, dotted.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  const parts = [...head, ...Array(Math.max(0, fill)).fill("0"), ...tail];
  if (parts.length !== 8 || !parts.every((p) => /^[0-9a-f]{1,4}$/.test(p))) return null;
  return parts.map((p) => parseInt(p, 16));
}

function isPublicV4(a: number, b: number, c: number): boolean {
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 88 && c === 99) || // 6to4 relay anycast
    (a === 192 && b === 0 && (c === 0 || c === 2)) || // IETF protocol assignments, TEST-NET-1
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    (a === 198 && b === 51 && c === 100) || // TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // TEST-NET-3
    a >= 224 // multicast and reserved
  );
}

/**
 * True when a hostname is not obviously private: loopback, private ranges,
 * link-local, CGNAT, benchmarking, documentation (TEST-NET), cloud metadata,
 * local names, and IPv6 forms that embed or translate IPv4 (::/96, ::ffff:0:0/96,
 * 64:ff9b::/96, 2002::/16). The pipeline fetches source URLs, so these would let
 * a request reach the site's own network. WHATWG URL parsing already turns
 * decimal, octal and hex IPv4 forms into dotted quads. This is the literal
 * check; lib/security/safe-fetch.ts also runs it on every resolved address.
 */
export function isPublicHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) return false;
  if (
    host === "localhost" ||
    /\.(localhost|local|internal|localdomain|home\.arpa)$/.test(host) ||
    host === "metadata" ||
    host === "metadata.google.internal"
  ) {
    return false;
  }
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (v4) return isPublicV4(Number(v4[1]), Number(v4[2]), Number(v4[3]));
  if (host.includes(":")) {
    const g = ipv6Groups(host);
    if (!g) return false;
    if (g.slice(0, 6).every((x) => x === 0)) return false; // ::/96: ::, ::1, IPv4-compatible
    if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
      return isPublicV4(g[6] >> 8, g[6] & 0xff, g[7] >> 8); // IPv4-mapped
    }
    if (g.slice(0, 4).every((x) => x === 0) && g[4] === 0xffff && g[5] === 0) return false; // IPv4-translated ::ffff:0:0:0/96
    if (g[0] === 0x64 && g[1] === 0xff9b) return false; // NAT64: 64:ff9b::/96 and local-use 64:ff9b:1::/48
    if (g[0] === 0x100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return false; // discard-only 100::/64
    if (g[0] === 0x2001 && g[1] === 0) return false; // Teredo 2001::/32
    if (g[0] === 0x2002) return false; // 6to4
    if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // documentation
    if ((g[0] & 0xfe00) === 0xfc00) return false; // unique local
    if ((g[0] & 0xffc0) === 0xfe80) return false; // link-local
    if ((g[0] & 0xff00) === 0xff00) return false; // multicast
    return true;
  }
  return true;
}

/**
 * Only the scheme's standard port: none (the default), 80 or 443. WHATWG URL
 * parsing already drops a default port, so `https://x:443` has port "".
 */
export function isAllowedPort(port: string): boolean {
  return port === "" || port === "80" || port === "443";
}

/** True when `address` is an IP literal (v4 or v6) that passes isPublicHost. */
export function isPublicAddress(address: string): boolean {
  const bare = address.replace(/^\[|\]$/g, "");
  return isIP(bare) !== 0 && isPublicHost(bare);
}
