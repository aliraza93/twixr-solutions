"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AtSign,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HelpCircle,
  Inbox,
  LayoutGrid,
  LogOut,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings,
  Sparkles,
} from "lucide-react";
import { signOutAdmin } from "@/app/admin/login/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
};

const overviewItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutGrid, exact: true },
];

const inboxItems: NavItem[] = [
  { title: "Inquiries", href: "/admin/inquiries", icon: Inbox },
];

const publishingItems: NavItem[] = [
  { title: "Blog", href: "/admin/blog", icon: BookOpen },
  { title: "Generate", href: "/admin/blog/generate", icon: Sparkles },
  { title: "X posts", href: "/admin/x", icon: AtSign },
  { title: "Review", href: "/admin/review", icon: ClipboardCheck },
];

const catalogueItems: NavItem[] = [
  { title: "Services", href: "/admin/services", icon: PanelsTopLeft },
  { title: "Portfolio", href: "/admin/portfolio", icon: Briefcase },
];

const siteItems: NavItem[] = [
  { title: "Site content", href: "/admin/content", icon: Settings },
  { title: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
  { title: "FAQs", href: "/admin/faqs", icon: HelpCircle },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive(pathname, item)}
              tooltip={{ children: item.title }}
            >
              <Link href={item.href} className="cursor-pointer">
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AdminSidebar({ email }: { email?: string | null }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin" className="cursor-pointer">
                <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                  <FileText className="size-4" />
                </span>
                <span className="grid min-w-0 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">Twixr Studio</span>
                  <span className="truncate text-xs text-muted-foreground">CMS</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavSection label="Overview" items={overviewItems} />
        <NavSection label="Inbox" items={inboxItems} />
        <NavSection label="Publishing" items={publishingItems} />
        <NavSection label="Catalogue" items={catalogueItems} />
        <NavSection label="Site" items={siteItems} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: "View site" }}>
              <Link href="/" target="_blank" rel="noreferrer" className="cursor-pointer">
                <ExternalLink />
                <span>View site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAdmin}>
              <SidebarMenuButton type="submit" className="w-full cursor-pointer" tooltip={{ children: "Sign out" }}>
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
        {email ? (
          <p className="truncate px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {email}
          </p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
