"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { consentCopy } from "@/content/consent";
import { MOTION_EASE, DURATION, DURATION_BASE, DURATION_FAST } from "@/lib/motion";
import {
  CONSENT_OPEN_EVENT,
  defaultConsent,
  openCookiePreferences,
  readConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { cn } from "@/lib/utils";

type View = "prompt" | "prefs";

export function CookieBanner() {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    setFunctional(Boolean(existing?.functional));
    setOpen(!existing);
    setReady(true);

    const onOpen = () => {
      const current = readConsent();
      setFunctional(Boolean(current?.functional));
      setView(current ? "prefs" : "prompt");
      setOpen(true);
    };

    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  function close(next: ConsentChoice) {
    writeConsent(next);
    setOpen(false);
    setView("prompt");
  }

  if (!ready) return null;

  const duration = reduce ? DURATION_FAST : DURATION;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="consent"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={descId}
          data-cursor-dark
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration, ease: MOTION_EASE }}
          className="consent-banner pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-[36rem] lg:ml-0 lg:mr-auto">
            <div className="band-dark relative overflow-hidden rounded-xl border border-d-hairline bg-d-bg p-6 shadow-lg sm:p-8">
              <span className="consent-banner__rail" aria-hidden />

              <AnimatePresence mode="wait" initial={false}>
                {view === "prompt" ? (
                  <motion.div
                    key="prompt"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduce ? DURATION_FAST : DURATION_BASE, ease: MOTION_EASE }}
                  >
                    <Eyebrow className="text-d-lime [--eyebrow:#bef03a] [--eyebrow-rule:#bef03a]">
                      {consentCopy.eyebrow}
                    </Eyebrow>
                    <h2
                      id={titleId}
                      className="mt-4 font-sora text-[length:var(--fs-h3)] font-extrabold tracking-[-0.02em] text-d-text"
                    >
                      Cookies stay on{" "}
                      <span className="text-d-lime">{consentCopy.emphasis}</span>.
                    </h2>
                    <p
                      id={descId}
                      className="mt-3 max-w-[42ch] text-sm leading-relaxed text-d-muted"
                    >
                      {consentCopy.body}{" "}
                      <Link
                        href={consentCopy.policyHref}
                        className="font-medium text-d-mint underline decoration-d-hairline underline-offset-2 transition-colors hover:text-d-lime"
                      >
                        {consentCopy.policy}
                      </Link>
                      .
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <Button
                        type="button"
                        variant="primary"
                        className="min-h-11"
                        onClick={() => close(defaultConsent(true))}
                      >
                        {consentCopy.accept}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 border-d-hairline text-d-text hover:border-d-text hover:bg-d-bg-2"
                        arrow={false}
                        onClick={() => close(defaultConsent(false))}
                      >
                        {consentCopy.reject}
                      </Button>
                      <button
                        type="button"
                        className="group inline-flex min-h-11 cursor-pointer items-center justify-center font-semibold text-d-mint transition-colors hover:text-d-lime"
                        onClick={() => setView("prefs")}
                      >
                        {consentCopy.preferences}
                        <span
                          aria-hidden
                          className="ml-1 inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="prefs"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduce ? DURATION_FAST : DURATION_BASE, ease: MOTION_EASE }}
                  >
                    <Eyebrow className="text-d-lime [--eyebrow:#bef03a] [--eyebrow-rule:#bef03a]">
                      {consentCopy.preferences}
                    </Eyebrow>
                    <h2
                      id={titleId}
                      className="mt-4 font-sora text-[length:var(--fs-h3)] font-extrabold tracking-[-0.02em] text-d-text"
                    >
                      Choose what this browser stores.
                    </h2>
                    <p id={descId} className="sr-only">
                      Toggle optional cookie categories, then save.
                    </p>

                    <ul className="mt-6 divide-y divide-d-hairline border-y border-d-hairline">
                      {consentCopy.categories.map((category) => {
                        const on =
                          category.id === "essential" ? true : functional;
                        return (
                          <li
                            key={category.id}
                            className="flex items-start justify-between gap-4 py-4"
                          >
                            <div className="min-w-0">
                              <p className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-d-lime">
                                {category.index}
                              </p>
                              <p className="mt-1 font-sora text-base font-bold tracking-[-0.02em] text-d-text">
                                {category.label}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-d-muted">
                                {category.detail}
                              </p>
                            </div>
                            <Switch
                              checked={on}
                              disabled={category.locked}
                              onCheckedChange={(checked) => {
                                if (category.id === "functional") {
                                  setFunctional(checked);
                                }
                              }}
                              className="mt-1 shrink-0"
                              aria-label={category.label}
                            />
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        variant="primary"
                        className="min-h-11"
                        onClick={() => close(defaultConsent(functional))}
                      >
                        {consentCopy.save}
                      </Button>
                      <button
                        type="button"
                        className="group inline-flex min-h-11 cursor-pointer items-center font-semibold text-d-mint transition-colors hover:text-d-lime"
                        onClick={() => setView("prompt")}
                      >
                        {consentCopy.closePrefs}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ManageCookiesButton({
  className,
  variant = "text",
}: {
  className?: string;
  variant?: "text" | "ghost";
}) {
  if (variant === "ghost") {
    return (
      <Button
        type="button"
        variant="ghost"
        arrow={false}
        className={cn("min-h-11", className)}
        onClick={openCookiePreferences}
      >
        {consentCopy.manage}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={cn(
        "cursor-pointer text-sm text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-ink",
        className
      )}
    >
      {consentCopy.manage}
    </button>
  );
}
