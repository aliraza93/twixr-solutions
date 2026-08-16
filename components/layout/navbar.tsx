"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Results" },
] as const;

const OVERLAY_LINKS = [{ href: "/", label: "Home" }, ...LINKS] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Logo({ onClick, inverted = false }: { onClick?: () => void; inverted?: boolean }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 font-sora text-base font-semibold tracking-[-0.02em]",
        inverted ? "text-d-text" : "text-ink"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-sora text-sm font-bold",
          inverted ? "bg-lime text-ink" : "bg-pine text-canvas"
        )}
      >
        A
      </span>
      Ali Raza
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center px-3 py-2 font-inter text-sm font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                active ? "text-pine" : "text-ink-soft hover:text-pine"
              )}
            >
              {link.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-pine transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]",
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

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
            <NavLinks pathname={pathname} />
          </nav>

          <div className="site-nav__actions">
            <Button
              variant="ghost"
              className="hidden h-10 px-5 py-2 text-sm xl:inline-flex"
              asChild
            >
              <Link href="/schedule">Start a Project</Link>
            </Button>
            <Button
              variant="primary"
              className="hidden h-10 px-5 py-2 text-sm lg:inline-flex"
              asChild
            >
              <Link href="/schedule">
                Schedule a Call
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
                      {OVERLAY_LINKS.map((link, i) => {
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
                      <Link href="/schedule" onClick={() => setOpen(false)}>
                        Start a Project
                        <span
                          aria-hidden
                          className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </Link>
                    </Button>
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
