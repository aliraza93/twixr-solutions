import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Bearer token auth for the Jarvis control API.
 *
 * The token lives only in the JARVIS_CONTROL_TOKEN env var (set by Ali in
 * Vercel). A missing or too-short value disables the whole API (503), so a
 * half-configured deploy can never be driven with a guessable token.
 * Tokens are compared as SHA-256 digests with timingSafeEqual: equal length,
 * constant time, and the presented value is never logged or echoed.
 */

export const TOKEN_ENV = "JARVIS_CONTROL_TOKEN";
export const MIN_TOKEN_LENGTH = 32;

export type AuthOutcome =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: "disabled" | "unauthorized" };

/** The configured token, or null when the API is disabled. */
export function configuredToken(
  env: Record<string, string | undefined> = process.env
): string | null {
  const raw = env[TOKEN_ENV]?.trim() ?? "";
  return raw.length >= MIN_TOKEN_LENGTH ? raw : null;
}

/** Extract the token from an `Authorization: Bearer <token>` header. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer[ ]+([^\s]+)[ ]*$/i.exec(header);
  return match ? match[1] : null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function tokensMatch(presented: string, expected: string): boolean {
  return timingSafeEqual(digest(presented), digest(expected));
}

export function authorize(
  authorizationHeader: string | null,
  expected: string | null
): AuthOutcome {
  if (!expected) return { ok: false, status: 503, code: "disabled" };
  const presented = bearerToken(authorizationHeader);
  // Always run one comparison so a missing header costs the same as a wrong one.
  const match = tokensMatch(presented ?? "", expected);
  if (!presented || !match) {
    return { ok: false, status: 401, code: "unauthorized" };
  }
  return { ok: true };
}
