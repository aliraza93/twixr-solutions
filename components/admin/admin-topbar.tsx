"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const LABELS: Record<string, string> = {
  admin: "Studio",
  inquiries: "Inquiries",
  blog: "Blog",
  generate: "Generate",
  content: "Site content",
  hero: "Hero",
  site: "Site settings",
  services: "Services",
  portfolio: "Portfolio",
  testimonials: "Testimonials",
  faqs: "FAQs",
  new: "New",
  x: "X posts",
  review: "Review",
};

function titleFor(segment: string, index: number, parts: string[]) {
  if (LABELS[segment]) return LABELS[segment];
  if (index === parts.length - 1 && parts[index - 1] && LABELS[parts[index - 1]]) {
    return "Edit";
  }
  return segment;
}

export function AdminTopbar() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => ({
    title: titleFor(part, index, parts),
    href: `/${parts.slice(0, index + 1).join("/")}`,
  }));

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-[var(--page-x,1rem)] backdrop-blur-sm">
      <SidebarTrigger className="-ml-1.5 border-0 shadow-none" />
      <Separator orientation="vertical" className="mx-1 hidden h-5 data-[orientation=vertical]:h-5 md:block" />
      <div className="hidden min-w-0 md:block">
        {crumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((item, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <Fragment key={item.href}>
                    <BreadcrumbItem>
                      {last ? (
                        <BreadcrumbPage>{item.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.title}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!last ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}
      </div>
    </header>
  );
}
