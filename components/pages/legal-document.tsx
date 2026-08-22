import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { LEGAL_UPDATED, legalNav, type LegalPage } from "@/content/legal";
import { cn } from "@/lib/utils";

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!match) return <span key={index}>{part}</span>;
        const [, label, href] = match;
        const className =
          "font-medium text-pine underline decoration-pine/30 underline-offset-2 transition-colors hover:decoration-pine";
        if (href.startsWith("mailto:") || href.startsWith("http")) {
          return (
            <a
              key={index}
              href={href}
              className={className}
              {...(href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {label}
            </a>
          );
        }
        return (
          <Link key={index} href={href} className={className}>
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function LegalDocument({
  page,
  action,
}: {
  page: LegalPage;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        align="left"
        eyebrow={page.eyebrow}
        title={page.title}
        emphasis={page.emphasis}
        description={page.description}
      />

      <section className="bg-canvas pb-20 md:pb-24">
        <div className="ds-container">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <aside className="lg:sticky lg:top-28 lg:col-span-4">
              <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-muted-2">
                Updated {LEGAL_UPDATED}
              </p>
              <nav aria-label="Legal pages" className="mt-5 border-y border-hairline">
                {legalNav.map((item) => {
                  const active = item.slug === page.slug;
                  return (
                    <Link
                      key={item.slug}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between border-b border-hairline py-3 text-sm transition-colors last:border-b-0",
                        active
                          ? "font-medium text-ink"
                          : "text-muted hover:text-ink"
                      )}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          active ? "bg-pine" : "bg-transparent"
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>
              {action ? <div className="mt-6">{action}</div> : null}
            </aside>

            <article className="min-w-0 lg:col-span-8">
              <div className="space-y-10">
                {page.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
                      {section.heading}
                    </h2>
                    {section.paragraphs?.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 48)}
                        className="mt-3 text-sm leading-relaxed text-muted sm:text-base"
                      >
                        <LinkedText text={paragraph} />
                      </p>
                    ))}
                    {section.bullets ? (
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
                        {section.bullets.map((item) => (
                          <li key={item.slice(0, 48)}>
                            <LinkedText text={item} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
