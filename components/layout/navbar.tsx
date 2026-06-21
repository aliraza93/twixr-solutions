"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

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
                <NavigationMenuLink asChild>
                  <Link href="/services" className={cn(navigationMenuTriggerStyle(), "h-10 bg-transparent px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100/50 hover:text-primary focus:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}>
                    Services
                  </Link>
                </NavigationMenuLink>
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
