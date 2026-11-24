import { INVOICORA } from "@/lib/pipeline/product/invoicora";
import type { Product } from "@/lib/pipeline/product/types";

/** Karachi is UTC+5 all year (no daylight saving). */
const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Monday 00:00 in Asia/Karachi for the week containing `now`, as a UTC instant. */
export function startOfWeekKarachi(now: Date): Date {
  const local = new Date(now.getTime() + KARACHI_OFFSET_MS);
  const day = local.getUTCDay(); // 0 = Sunday
  const sinceMonday = (day + 6) % 7;
  const mondayLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() - sinceMonday
  );
  return new Date(mondayLocal - KARACHI_OFFSET_MS);
}

/** 00:00 in Asia/Karachi for the day containing `now`, as a UTC instant. */
export function startOfDayKarachi(now: Date): Date {
  const local = new Date(now.getTime() + KARACHI_OFFSET_MS);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnight - KARACHI_OFFSET_MS);
}

/** Day of week in Asia/Karachi, 0 = Sunday. */
export function weekdayKarachi(now: Date): number {
  return new Date(now.getTime() + KARACHI_OFFSET_MS).getUTCDay();
}

/** Due when no product brief has been used since this week's Monday (Karachi). */
export function isProductPostDue(lastUsedAt: Date | null, now: Date): boolean {
  if (!lastUsedAt) return true;
  return lastUsedAt.getTime() < startOfWeekKarachi(now).getTime();
}

/** First bank topic that has never been briefed, in bank order. */
export function nextUnusedTopic(existingTopics: string[], product: Product = INVOICORA) {
  const seen = new Set(existingTopics.map((t) => t.trim().toLowerCase()));
  return product.topics.find((t) => !seen.has(t.topic.toLowerCase()));
}
