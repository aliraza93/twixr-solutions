"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Briefcase, Inbox, PanelsTopLeft } from "lucide-react";
import { MOTION_EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ICONS = {
  inbox: Inbox,
  posts: BookOpen,
  services: PanelsTopLeft,
  portfolio: Briefcase,
} as const;

export type KpiIcon = keyof typeof ICONS;

export function KpiCard({
  label,
  value,
  hint,
  icon,
  index = 0,
  tone = "pine",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: KpiIcon;
  index?: number;
  tone?: "pine" | "lime";
}) {
  const reduce = useReducedMotion();
  const Icon = ICONS[icon];

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * STAGGER, ease: MOTION_EASE }}
      className="rounded-lg border border-hairline bg-canvas p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md",
            tone === "lime" ? "bg-lime/30 text-lime-ink" : "bg-pine-tint text-pine"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-sora text-3xl font-extrabold tracking-[-0.03em] text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </motion.article>
  );
}
