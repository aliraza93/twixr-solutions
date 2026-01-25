"use client";

import { motion } from "framer-motion";
import { footerData } from "@/lib/data";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-100 bg-white pt-24 pb-12 dark:border-slate-800 dark:bg-slate-950">
      <div className="container relative z-10 mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-white">
                <span className="text-lg font-black text-white dark:text-slate-900">A</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Ali Raza</span>
            </div>
            <p className="mb-8 max-w-sm text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              Developer & Trainer — Freelancing, Programming & AI. Top Rated Plus on Upwork with 10+ years of experience.
            </p>
            <div className="space-y-4">
              <a href="mailto:learnwithshajeel@gmail.com" className="flex items-center gap-3 text-slate-600 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500">
                <Icon icon="lucide:mail" className="h-5 w-5" />
                <span className="font-medium">learnwithshajeel@gmail.com</span>
              </a>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Icon icon="lucide:map-pin" className="h-5 w-5" />
                <span className="font-medium">Lahore, Dubai & Remote</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Main Platforms</h4>
              <ul className="space-y-4">
                {footerData.platforms.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-base text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Freelance</h4>
              <ul className="space-y-4">
                {footerData.freelance.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-base text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <h4 className="mt-8 mb-6 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Contact</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-base text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500">WhatsApp</Link></li>
                <li><Link href="#" className="text-base text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500">Email</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Community</h4>
              <ul className="space-y-4">
                {footerData.community.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-base text-slate-500 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-24 border-t border-slate-100 pt-12 dark:border-slate-800">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="max-w-md">
              <h4 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Subscribe to my Newsletter</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Get tips on freelancing, programming & AI directly to your inbox.
              </p>
            </div>
            <div className="flex w-full max-w-md gap-3">
              <Input 
                type="email" 
                placeholder="you@example.com" 
                className="h-12 rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
              <Button className="h-12 rounded-xl bg-teal-600 px-8 font-bold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-slate-100 pt-12 lg:flex-row dark:border-slate-800">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-400">Follow me:</span>
            <div className="flex gap-4">
              {footerData.socials.map((social) => (
                <a 
                  key={social.name} 
                  href={social.href}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-all hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-white"
                >
                  <Icon 
                    icon={social.icon} 
                    className="h-5 w-5 text-slate-400 transition-colors group-hover:text-white dark:group-hover:text-slate-900" 
                  />
                </a>
              ))}
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} Ali Raza. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
