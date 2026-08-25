"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";
import type { NavLink, SiteCta } from "@/lib/cms/types";

type NavbarProps = {
  nav?: readonly NavLink[];
  primaryCta?: SiteCta;
};

const GITHUB_URL = site.contact.github;

/** Filled GitHub mark - denser than Lucide's outline stroke. */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Logo({ onClick, inverted = false }: { onClick?: () => void; inverted?: boolean }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Twixr Solutions"
      className="inline-flex shrink-0 items-center overflow-visible"
    >
      <Image
        src={inverted ? "/logo-wordmark-dark.svg" : "/logo-wordmark-light.svg"}
        alt="Twixr Solutions"
        width={168}
        height={52}
        priority
        unoptimized
        className="h-[52px] w-auto max-w-none"
      />
    </Link>
  );
}

function NavLinks({
  pathname,
  links,
  onNavigate,
  compact = false,
}: {
  pathname: string;
  links: readonly NavLink[];
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <ul className="hidden items-center lg:flex">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center py-2 font-inter font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                compact ? "px-2 text-[13px]" : "px-2.5 text-sm xl:px-3",
                active ? "text-pine" : "text-ink-soft hover:text-pine"
              )}
            >
              {link.label}
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-0.5 h-px origin-left bg-pine transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  compact ? "inset-x-2" : "inset-x-2.5 xl:inset-x-3",
                  active ? "scale-x-100" : "scale-x-0"
                )}
              />
              {active && (
                <span
                  aria-hidden
                  className="absolute -bottom-[5px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-pine"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Navbar({ nav, primaryCta }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = nav ?? site.nav;
  const cta = primaryCta ?? site.primaryCta;
  const overlayLinks = [{ href: "/", label: "Home" }, ...links];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    let raf = 0;
    let last = false;

    const read = () => {
      raf = 0;
      const next = window.scrollY > 80;
      if (next === last) return;
      last = next;
      setScrolled(next);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(read);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    read();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className={cn("site-nav", scrolled && "is-scrolled")}>
      <div className="site-nav__bar">
        <div className="site-nav__inner">
          <div className="site-nav__brand">
            <Logo />
          </div>

          <nav className="site-nav__links" aria-label="Primary">
            <NavLinks pathname={pathname} links={links} compact={scrolled} />
          </nav>

          <div className="site-nav__actions">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className={cn(
                "inline-flex items-center justify-center rounded-full text-ink transition-colors duration-[var(--dur-fast)] hover:bg-surface hover:text-pine",
                scrolled ? "h-9 w-9" : "h-10 w-10"
              )}
            >
              <GitHubIcon className={scrolled ? "h-[18px] w-[18px]" : "h-5 w-5"} />
            </a>

            <Button
              variant="primary"
              className={cn(
                "hidden lg:inline-flex",
                scrolled ? "h-9 px-4 py-2 text-[13px]" : "h-10 px-5 py-2 text-sm"
              )}
              asChild
            >
              <Link href={cta.href}>
                {cta.label}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                >
                  →
                </span>
              </Link>
            </Button>

            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="site-nav__menu inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface lg:hidden"
                  aria-label={open ? "Close menu" : "Open menu"}
                  aria-expanded={open}
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink" />
                <Dialog.Content
                  className="nav-overlay fixed inset-0 z-[91] flex flex-col bg-ink text-d-text outline-none"
                  data-cursor-dark
                  aria-describedby={undefined}
                >
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title>

                  <div className="flex items-center justify-between px-[clamp(20px,5vw,40px)] py-5">
                    <Logo inverted onClick={() => setOpen(false)} />
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-d-text transition-colors hover:bg-white/10"
                        aria-label="Close menu"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <nav
                    aria-label="Mobile"
                    className="flex flex-1 flex-col justify-center px-[clamp(20px,5vw,40px)]"
                  >
                    <ul className="flex flex-col gap-1">
                      {overlayLinks.map((link, i) => {
                        const active = isActive(pathname, link.href);
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={() => setOpen(false)}
                              aria-current={active ? "page" : undefined}
                              style={{ "--i": i } as CSSProperties}
                              className={cn(
                                "nav-overlay__link group flex items-center gap-3 py-2 font-sora text-[clamp(2rem,8vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.02em] transition-colors",
                                active ? "text-d-lime" : "text-d-text hover:text-d-lime"
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "h-2 w-2 shrink-0 rounded-full bg-d-lime transition-opacity",
                                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                                )}
                              />
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>

                  <div className="px-[clamp(20px,5vw,40px)] pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
                    <Button variant="primary" className="h-12 w-full text-base" asChild>
                      <Link href={cta.href} onClick={() => setOpen(false)}>
                        {cta.label}
                        <span
                          aria-hidden
                          className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </Link>
                    </Button>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="mt-4 flex items-center justify-center gap-2 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-d-text transition-colors hover:text-d-lime"
                    >
                      <GitHubIcon className="h-4 w-4" />
                      github.com/aliraza93
                    </a>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </header>
  );
}
