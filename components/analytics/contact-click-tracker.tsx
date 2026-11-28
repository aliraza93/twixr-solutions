"use client";

import { useEffect } from "react";
import { track, type AnalyticsEventName } from "@/lib/analytics";

const WHATSAPP = /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\/|^whatsapp:/i;
const BOOKING = /(^|\/\/)(app\.)?cal\.com\/|^\/schedule(\/|$|\?|#)/i;

function classify(href: string): {
  name: AnalyticsEventName;
  params: Record<string, string>;
} | null {
  if (href.startsWith("mailto:")) return { name: "click_email", params: {} };
  if (href.startsWith("tel:")) return { name: "click_phone", params: {} };
  if (WHATSAPP.test(href)) return { name: "click_whatsapp", params: {} };
  if (BOOKING.test(href)) {
    return { name: "book_call", params: { booking_stage: "link_click" } };
  }
  return null;
}

/**
 * One delegated listener for every contact link on the site (footer,
 * contact page, blog CTAs, CMS content). Only the link type and the
 * section it sits in are sent, never the address itself.
 */
export function ContactClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const hit = classify(href);
      if (!hit) return;
      const section =
        anchor.closest("footer")
          ? "footer"
          : anchor.closest("header, nav")
            ? "header"
            : "content";
      track(hit.name, { ...hit.params, link_location: section });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
