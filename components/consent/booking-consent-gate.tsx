"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { consentCopy } from "@/content/consent";
import { defaultConsent, writeConsent } from "@/lib/consent";
import { DURATION, MOTION_EASE } from "@/lib/motion";

export function BookingConsentGate() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.2 : DURATION, ease: MOTION_EASE }}
      className="flex min-h-[420px] flex-col items-start justify-center p-6 sm:p-10"
    >
      <Eyebrow>{consentCopy.bookingGate.eyebrow}</Eyebrow>
      <h2 className="mt-4 max-w-[16ch] font-sora text-[length:var(--fs-h2)] font-extrabold tracking-[-0.02em] text-ink">
        The calendar needs{" "}
        <span className="text-pine">booking cookies</span>.
      </h2>
      <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted sm:text-base">
        {consentCopy.bookingGate.body}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          onClick={() => writeConsent(defaultConsent(true))}
        >
          {consentCopy.bookingGate.allow}
        </Button>
        <Button variant="text" asChild>
          <Link href={consentCopy.policyHref}>{consentCopy.bookingGate.policy}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
