"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

function useShellTokens() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("dashboard-shell");
    return () => root.classList.remove("dashboard-shell");
  }, []);
}

function railByDefault() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches;
}

export function AdminShell({
  email,
  children,
}: {
  email?: string | null;
  children: ReactNode;
}) {
  const [defaultOpen] = useState(() => !railByDefault());
  useShellTokens();

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="dashboard-shell admin-app" defaultOpen={defaultOpen}>
        <AdminSidebar email={email} />
        <SidebarInset className="overflow-x-hidden">
          <AdminTopbar />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
