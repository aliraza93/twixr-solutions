"use client";

import { useEffect } from "react";
import { useConsent } from "@/hooks/use-consent";
import {
  GA_MEASUREMENT_ID,
  markAnalyticsBlocked,
  markAnalyticsReady,
} from "@/lib/analytics";

const SCRIPT_ID = "ga4-gtag";

function bootGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // gtag.js reads the raw arguments object, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  } else {
    window.gtag("consent", "update", { analytics_storage: "granted" });
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
}

/**
 * Loads GA4 only after the visitor allows the Analytics category.
 * Commands pushed to dataLayer before gtag.js finishes downloading are
 * replayed by gtag.js, so queued events are safe to flush immediately.
 */
export function GoogleAnalytics() {
  const { ready, decided, analytics } = useConsent();

  useEffect(() => {
    if (!ready || !GA_MEASUREMENT_ID) return;
    if (analytics) {
      bootGtag();
      markAnalyticsReady();
      return;
    }
    if (decided) {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      markAnalyticsBlocked();
    }
    // Undecided: keep queued events until the visitor chooses.
  }, [ready, decided, analytics]);

  return null;
}
