"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Cloud,
  Hammer,
  Home,
  KeyRound,
  Lock,
  LogIn,
  Map,
  Rocket,
  Search,
  Server,
  ShieldOff,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { EquationRow } from "@/components/ui/equation-row";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { PageCta } from "@/components/sections/page-cta";
import { cn } from "@/lib/utils";
import {
  statusPages,
  type StatusIcon,
  type StatusVariant,
} from "@/content/status";

const ICONS: Record<StatusIcon, LucideIcon> = {
  search: Search,
  map: Map,
  home: Home,
  server: Server,
  alert: AlertTriangle,
  wrench: Wrench,
  hammer: Hammer,
  cloud: Cloud,
  rocket: Rocket,
  lock: Lock,
  key: KeyRound,
  shield: ShieldOff,
  user: User,
  "log-in": LogIn,
};

function tileIcon(icon: StatusIcon) {
  const Icon = ICONS[icon];
  return <Icon />;
}

type StatusPageClientProps = {
  variant: StatusVariant;
  /** 500 retry - replaces the primary link when set. */
  onRetry?: () => void;
  digest?: string;
  /** Skip fixed-nav padding (global-error has no site chrome). */
  bare?: boolean;
};

export function StatusPageClient({
  variant,
  onRetry,
  digest,
  bare = false,
}: StatusPageClientProps) {
  const copy = statusPages[variant];
  const ref = useRef<HTMLElement>(null);
  const [finale, setFinale] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-inview");
      const frame = requestAnimationFrame(() => setFinale(true));
      return () => cancelAnimationFrame(frame);
    }

    el.classList.add("eq-armed");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-inview");
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("bg-canvas", !bare && "pt-[120px] lg:pt-[140px]")}>
      <section
        ref={ref}
        className="philosophy-band relative overflow-hidden bg-canvas py-[var(--section-py)]"
      >
        <div className="ds-container relative z-10 flex flex-col items-center text-center">
          <Eyebrow className="justify-center">{copy.eyebrow}</Eyebrow>

          <h1 className="mt-5 max-w-[18ch] font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            <span className="block">{copy.headingLine1}</span>
            <span
              className="eq-reveal mt-1 block text-pine"
              style={{ "--i": 0 } as CSSProperties}
            >
              {copy.headingLine2}
            </span>
          </h1>

          <EquationRow
            className="mt-14 md:mt-16"
            durationMs={1800}
            a={{
              icon: tileIcon(copy.tiles[0].icon),
              label: copy.tiles[0].label,
            }}
            b={{
              icon: tileIcon(copy.tiles[1].icon),
              label: copy.tiles[1].label,
            }}
            c={{
              icon: tileIcon(copy.tiles[2].icon),
              label: copy.tiles[2].label,
            }}
            onFinale={() => setFinale(true)}
          />

          <p
            className={cn(
              "eq-mission mt-14 max-w-[42ch] font-sora text-[length:var(--fs-h2)] font-bold leading-[1.2] tracking-[-0.02em] md:mt-16",
              finale && "is-visible"
            )}
          >
            <span className="text-muted">{copy.missionMuted}</span>
            <span className="text-ink">{copy.missionEmphasis}</span>
          </p>

          {digest ? (
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
              Ref {digest}
            </p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {onRetry ? (
              <Button variant="primary" type="button" onClick={onRetry}>
                {copy.primary.label}
              </Button>
            ) : (
              <Button variant="primary" asChild>
                <Link href={copy.primary.href}>
                  {copy.primary.label}
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" asChild>
              <Link href={copy.secondary.href}>{copy.secondary.label}</Link>
            </Button>
          </div>
        </div>
      </section>

      <PageCta
        title={copy.ctaTitle}
        emphasis={copy.ctaEmphasis}
        description={copy.ctaDescription}
        primaryLabel={copy.primary.label}
        primaryHref={onRetry ? "/contact" : copy.primary.href}
        secondaryLabel={copy.secondary.label}
        secondaryHref={copy.secondary.href}
      />
    </div>
  );
}
