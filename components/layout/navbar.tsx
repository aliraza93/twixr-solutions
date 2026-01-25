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
import { Menu, Terminal, Code2, Cpu, Globe } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex cursor-pointer items-center gap-2 font-bold text-xl text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            A
          </div>
          <span>Ali R.</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-slate-600 hover:text-slate-900 focus:text-slate-900">Services</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-br from-primary/5 to-primary/10 p-6 no-underline outline-none transition-shadow hover:shadow-md border border-primary/10"
                          href="/"
                        >
                          <div className="mb-2 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                             <Terminal className="h-5 w-5 text-primary" />
                          </div>
                          <div className="mb-2 mt-4 text-lg font-bold text-slate-900">
                            Full Stack Dev
                          </div>
                          <p className="text-sm leading-tight text-slate-600">
                            End-to-end development for scalable web applications.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/services/backend" title="Backend Engineering" icon={<ServerIcon className="text-blue-500" />}>
                      High-performance APIs and database architecture.
                    </ListItem>
                    <ListItem href="/services/frontend" title="Frontend & UI/UX" icon={<LayoutIcon className="text-pink-500" />}>
                      Pixel-perfect interfaces with React & Tailwind.
                    </ListItem>
                    <ListItem href="/services/devops" title="DevOps & Cloud" icon={<CloudIcon className="text-blue-500" />}>
                      AWS, Docker, and CI/CD pipelines.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-slate-600 hover:text-slate-900 focus:text-slate-900">Expertise</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {components.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/portfolio" className={cn(navigationMenuTriggerStyle(), "bg-transparent text-slate-600 hover:text-slate-900 focus:text-slate-900")}>
                    Portfolio
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CTA Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" className="cursor-pointer text-slate-600 hover:text-primary">
            Sign In
          </Button>
          <Button className="cursor-pointer rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
            Contact Me
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-slate-900">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-6 pt-10">
              <Link href="/" className="cursor-pointer font-semibold">Home</Link>
              <Link href="/services" className="cursor-pointer font-semibold">Services</Link>
              <Link href="/portfolio" className="cursor-pointer font-semibold">Portfolio</Link>
              <Button className="w-full rounded-full bg-primary text-primary-foreground cursor-pointer">Contact Me</Button>
            </div>
          </SheetContent>
        </Sheet>
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
