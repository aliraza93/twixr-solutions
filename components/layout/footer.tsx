"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { footer } from "@/content/footer";
import { site } from "@/content/site";

function FooterLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-sora text-base font-semibold tracking-[-0.02em] text-ink"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime font-sora text-sm font-bold text-d-bg">
        T
      </span>
      {site.name}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="band-dark">
      <div className="ds-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <FooterLogo />
            <p className="mt-5 max-w-[32ch] text-sm leading-relaxed text-muted">
              {footer.tagline}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {footer.socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      social.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    aria-label={social.name}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-ink-soft transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-lime hover:text-lime"
                  >
                    <Icon icon={social.icon} className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {footer.columns.map((column) => (
              <div key={column.label}>
                <h2 className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-lime">
                  {column.label}
                </h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => {
                    const external =
                      link.href.startsWith("http") || link.href.startsWith("mailto");
                    const className =
                      "text-sm text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-ink";
                    return (
                      <li key={link.name}>
                        {external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={className}
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">
            © {year} {site.name}. {footer.legal}
          </p>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-2">
            {footer.shipped}
          </p>
        </div>
      </div>
    </footer>
  );
}
