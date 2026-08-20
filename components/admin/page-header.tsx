import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  /** @deprecated Use `subtitle`. Kept so existing pages keep compiling. */
  description?: string;
  /** @deprecated Studio matches IMEI density — eyebrow is ignored. */
  eyebrow?: string;
  badge?: ReactNode;
  badgePlacement?: "below" | "inline";
  actions?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  description,
  badge,
  badgePlacement = "below",
  actions,
}: Props) {
  const lead = subtitle ?? description;
  const inline = badgePlacement === "inline";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {inline ? badge : null}
        </div>
        {lead ? <p className="text-sm text-muted-foreground">{lead}</p> : null}
        {!inline ? badge : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
