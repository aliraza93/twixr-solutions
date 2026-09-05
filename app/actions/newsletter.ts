"use server";

import { headers } from "next/headers";
import {
  newsletterSchema,
  type NewsletterActionResult,
} from "@/lib/newsletter/schema";
import { upsertSubscriber } from "@/lib/cms/subscribers";
import { notifyAliOfSignup } from "@/lib/newsletter/notify";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (time) => now - time < WINDOW_MS
  );
  if (recent.length >= MAX_PER_WINDOW) {
    submissionsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return false;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

export async function subscribeNewsletter(
  payload: unknown
): Promise<NewsletterActionResult> {
  const parsed = newsletterSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email." };
  }

  if (parsed.data.website2?.trim()) {
    return { ok: true };
  }

  const ip = await clientIp();
  if (isRateLimited(ip)) {
    return {
      ok: false,
      error: "Too many tries. Please wait a minute and try again.",
    };
  }

  const { subscriber, already } = await upsertSubscriber(parsed.data.email);
  if (!subscriber) {
    return { ok: false, error: "Could not save that email. Try again in a moment." };
  }

  if (!already) {
    await notifyAliOfSignup(parsed.data.email);
  }

  return { ok: true, already };
}
