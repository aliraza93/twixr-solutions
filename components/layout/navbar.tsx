"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Terminal, Code2, Cpu, Globe, ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 sm:p-6 pointer-events-none">
      <div className="flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8 rounded-full border border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-2xl shadow-slate-200/20 transition-all pointer-events-auto dark:border-slate-800/50 dark:bg-slate-950/70 dark:shadow-none">
        
        {/* Left: Logo */}
        <Link href="/" className="flex cursor-pointer items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            A
          </div>
          <span className="hidden sm:inline-block">Ali Raza</span>
        </Link>

        {/* Center: Desktop Navigation */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 bg-transparent px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100/50 hover:text-primary focus:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800/50">
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-6 p-6 md:w-[500px] lg:w-[650px] lg:grid-cols-[0.8fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="group/card flex h-full w-full select-none flex-col justify-end rounded-[2rem] bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-8 no-underline outline-none transition-all hover:bg-primary/[0.08] border border-primary/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
                          href="/services"
                        >
                          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-transform group-hover/card:scale-110">
                             <Terminal className="h-7 w-7" />
                          </div>
                          <div className="mb-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                            Strategic <span className="text-primary italic">Dev</span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            Custom software ecosystems engineered for massive scale and market dominance.
                          </p>
                          <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary opacity-0 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-1">
                            Explore Strategy <ArrowRight className="h-3 w-3" />
                          </div>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <div className="flex flex-col gap-1">
                      <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Expertise</p>
                      <ListItem href="/services/laravel-api-backend" title="API Engineering" icon={<ServerIcon className="h-5 w-5" />}>
                        Scalable backends & cloud-native architectures.
                      </ListItem>
                      <ListItem href="/services/nextjs-frontend" title="Interaction Design" icon={<LayoutIcon className="h-5 w-5" />}>
                        Immersive, high-performance user interfaces.
                      </ListItem>
                      <ListItem href="/services/cloud-infrastructure-devops" title="Systems & Cloud" icon={<CloudIcon className="h-5 w-5" />}>
                        Automated, secure, and resilient infrastructure.
                      </ListItem>
                    </div>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/portfolio" className={cn(navigationMenuTriggerStyle(), "h-10 bg-transparent px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100/50 hover:text-primary focus:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}>
                    Portfolio
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/testimonials" className={cn(navigationMenuTriggerStyle(), "h-10 bg-transparent px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100/50 hover:text-primary focus:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}>
                    Results
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
             <Button variant="ghost" className="h-10 cursor-pointer rounded-full px-5 text-sm font-bold text-slate-600 hover:bg-slate-100/50 dark:text-slate-400">
               Sign In
             </Button>
          </div>
          <Button size="sm" className="h-10 cursor-pointer rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95">
            Start a Project
          </Button>

          {/* Mobile Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-full text-slate-900 border border-slate-100 dark:text-white dark:border-slate-800">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="rounded-l-[2rem] border-l-primary/10">
              <div className="flex flex-col gap-6 pt-12">
                <div className="flex flex-col gap-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation</p>
                   <Link href="/" className="cursor-pointer text-xl font-bold hover:text-primary transition-colors">Home</Link>
                   <Link href="/services" className="cursor-pointer text-xl font-bold hover:text-primary transition-colors">Services</Link>
                   <Link href="/portfolio" className="cursor-pointer text-xl font-bold hover:text-primary transition-colors">Portfolio</Link>
                   <Link href="/testimonials" className="cursor-pointer text-xl font-bold hover:text-primary transition-colors">Testimonials</Link>
                </div>
                <div className="mt-8 flex flex-col gap-4">
                   <Button className="h-12 w-full cursor-pointer rounded-2xl bg-primary text-base font-bold shadow-xl shadow-primary/20">Contact Me</Button>
                   <Button variant="outline" className="h-12 w-full cursor-pointer rounded-2xl border-slate-200 text-base font-bold">Sign In</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Laravel & PHP",
    href: "/skills/laravel",
    description: "Enterprise-grade backend solutions using the TALL stack.",
  },
  {
    title: "Next.js & React",
    href: "/skills/nextjs",
    description: "Modern, SEO-friendly frontend applications.",
  },
  {
    title: "E-commerce",
    href: "/skills/ecommerce",
    description: "Stripe integrations and custom checkout flows.",
  },
  {
    title: "SaaS Development",
    href: "/skills/saas",
    description: "Multi-tenant architecture and subscription systems.",
  },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block cursor-pointer select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function ServerIcon({ className }: { className?: string }) { return <Terminal className={cn("h-4 w-4", className)} />; }
function LayoutIcon({ className }: { className?: string }) { return <Code2 className={cn("h-4 w-4", className)} />; }
function CloudIcon({ className }: { className?: string }) { return <Cpu className={cn("h-4 w-4", className)} />; }
