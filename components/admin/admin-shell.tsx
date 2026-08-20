"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAdmin } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/content", label: "Site content", icon: Settings2 },
  { href: "/admin/services", label: "Services", icon: PanelsTopLeft },
  { href: "/admin/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
];

export function AdminShell({
  email,
  children,
}: {
  email?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="band-dark sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-d-hairline bg-d-bg lg:flex">
        <div className="px-5 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-d-lime">
            Twixr Solutions
          </p>
          <p className="mt-1 font-sora text-lg font-bold text-d-text">Studio</p>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-(--dur-fast)",
                  active
                    ? "bg-white/10 text-d-lime"
                    : "text-d-muted hover:bg-white/5 hover:text-d-text"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-d-hairline p-4">
          <p className="truncate text-xs text-d-muted">{email}</p>
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-d-muted transition-colors hover:text-d-lime"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-canvas/90 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <FileText className="h-4 w-4 text-pine" />
            <span className="font-sora text-sm font-bold">Studio</span>
          </div>
          <nav className="hidden gap-3 overflow-x-auto sm:flex lg:hidden" aria-label="Mobile admin">
            {NAV.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm text-muted hover:text-pine"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-pine hover:text-pine-600"
          >
            View site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </header>
        <div className="flex-1 px-4 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
