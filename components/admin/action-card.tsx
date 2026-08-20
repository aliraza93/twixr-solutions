import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  tone = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  tone?: "primary" | "default";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
        tone === "primary"
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "primary"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
