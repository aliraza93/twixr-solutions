import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Shared secret checks for bearer-protected routes (the cron routes and the
 * Jarvis control API). Values are compared as SHA-256 digests with
 * timingSafeEqual: equal length, constant time, and nothing is logged.
 */

export const CRON_SECRET_ENV = "CRON_SECRET";
/** A shorter (or unset) CRON_SECRET refuses every cron call. */
export const MIN_CRON_SECRET_LENGTH = 16;

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time string compare (digests, so lengths never leak). */
export function secretsMatch(presented: string, expected: string): boolean {
  return timingSafeEqual(digest(presented), digest(expected));
}

/** The secret when it is set and at least `minLength` characters, else null. */
export function usableSecret(raw: string | undefined, minLength: number): string | null {
  if (typeof raw !== "string") return null;
  return raw.trim().length >= minLength ? raw : null;
}

/**
 * True only when `header` is exactly `Bearer <secret>` and the secret is
 * usable. An unset secret can never match, so "Bearer undefined" is refused.
 * One comparison always runs, so a missing secret or header costs the same.
 */
export function bearerHeaderMatches(
  header: string | null,
  secret: string | undefined,
  minLength: number
): boolean {
  const usable = usableSecret(secret, minLength);
  const expected = `Bearer ${usable ?? ""}`;
  const match = secretsMatch(header ?? "", expected);
  return usable !== null && header !== null && match;
}

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export function cronAuthorized(
  req: Pick<Request, "headers">,
  env: Record<string, string | undefined> = process.env
): boolean {
  const secret = env[CRON_SECRET_ENV];
  const ok = bearerHeaderMatches(req.headers.get("authorization"), secret, MIN_CRON_SECRET_LENGTH);
  if (!ok && usableSecret(secret, MIN_CRON_SECRET_LENGTH) === null) {
    console.error(`cron: ${CRON_SECRET_ENV} is unset or shorter than ${MIN_CRON_SECRET_LENGTH} characters; refusing`);
  }
  return ok;
}
