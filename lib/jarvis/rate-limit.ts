/**
 * Best-effort in-memory sliding-window limiter, the same approach as the
 * contact and newsletter actions. It is per serverless instance, not shared
 * across replicas, so it slows a brute-force attempt rather than stopping a
 * distributed one; the 32+ character bearer token is the real control.
 */
export type RateLimitDecision = { ok: true } | { ok: false; retryAfterSec: number };

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly maxKeys = 5000
  ) {}

  hit(key: string, nowMs: number): RateLimitDecision {
    const since = nowMs - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      const retryAfterMs = recent[0] + this.windowMs - nowMs;
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }
    recent.push(nowMs);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.prune(since);
    return { ok: true };
  }

  private prune(since: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => t <= since)) this.hits.delete(key);
    }
  }
}

/** First hop of x-forwarded-for (Vercel sets it), else x-real-ip. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
