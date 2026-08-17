"use client";

import Link from "next/link";
import Image from "next/image";
import { footer } from "@/content/footer";

function FooterLogo() {
  return (
    <Link
      href="/"
      aria-label="Twixr Solutions"
      className="inline-flex items-center"
    >
      <Image
        src="/logo-wordmark-dark.svg"
        alt="Twixr Solutions"
        width={168}
        height={52}
        unoptimized
        className="h-14 w-auto max-w-none"
      />
    </Link>
  );
}

function FooterLink({
  item,
}: {
  item: { label: string; href: string; external?: boolean };
}) {
  const className =
    "text-sm text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-ink";

  if (item.href.startsWith("mailto:")) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="band-dark">
      <div className="ds-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <FooterLogo />
            <p className="mt-5 max-w-[32ch] text-sm leading-relaxed text-muted">
              {footer.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <h2 className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-lime">
                  {column.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink item={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">{footer.legal}</p>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-2">
            {footer.note}
          </p>
        </div>
      </div>
    </footer>
  );
}
