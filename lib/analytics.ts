/**
 * Google Analytics 4 for the public site.
 *
 * Nothing loads until the visitor allows the Analytics cookie category.
 * Events raised before that (or before gtag has booted) wait in a small
 * in-memory queue and are sent once analytics is ready, so a click that
 * happens in the first second of a visit is not lost. If the visitor turns
 * analytics down, the queue is dropped instead of sent.
 *
 * Never pass anything the visitor typed. Event params are limited to
 * fixed labels and the page path.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-LWM3J2EYVR";

export type AnalyticsEventName =
  | "generate_lead"
  | "book_call"
  | "click_email"
  | "click_whatsapp"
  | "click_phone";

export type AnalyticsParams = Record<string, string | number | boolean>;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const MAX_QUEUE = 50;
const queue: Array<[AnalyticsEventName, AnalyticsParams]> = [];
let ready = false;

function send(name: AnalyticsEventName, params: AnalyticsParams) {
  window.gtag?.("event", name, params);
}

/** Record a conversion event. Safe to call before consent or before gtag loads. */
export function track(name: AnalyticsEventName, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const payload: AnalyticsParams = {
    page_path: window.location.pathname,
    ...params,
  };
  if (ready && typeof window.gtag === "function") {
    send(name, payload);
    return;
  }
  queue.push([name, payload]);
  if (queue.length > MAX_QUEUE) queue.shift();
}

/** Called by the loader once gtag exists and consent allows it. Flushes the queue. */
export function markAnalyticsReady() {
  ready = true;
  while (queue.length) {
    const next = queue.shift();
    if (next) send(next[0], next[1]);
  }
}

/** Called when the visitor declines or withdraws analytics consent. */
export function markAnalyticsBlocked() {
  ready = false;
  queue.length = 0;
}

/** Test helper. */
export function pendingEventCount() {
  return queue.length;
}
