"use client";

import { BookOpen, Briefcase, Inbox, PanelsTopLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
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
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: KpiIcon;
  index?: number;
  tone?: "pine" | "lime";
  prefix?: string;
  suffix?: string;
}) {
  const numeric = typeof value === "number";
  const animated = useCountUp(numeric ? value : 0);
  const Icon = icon ? ICONS[icon] : null;

  return (
    <Card className="gap-0 py-5 shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon ? (
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {numeric ? (
            <>
              {prefix}
              {Math.round(animated)}
              {suffix}
            </>
          ) : (
            value
          )}
        </p>
        {hint ? (
          <p className={cn("text-xs text-muted-foreground")}>{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
