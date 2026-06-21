"use client";

import { blogPosts } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

export function BlogPosts() {
  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950">
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeader
          badge="Latest Insights"
          titlePrefix=""
          titleHighlight="Latest"
          titleSuffix="Insights"
          description="Sharing my discoveries, technical deep-dives, and life experiences in software engineering."
        />

        <ScrollStagger className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <ScrollRevealItem key={post.slug}>
              <BlogCard post={post} />
            </ScrollRevealItem>
          ))}
        </ScrollStagger>

        {/* Action Button */}
        <ScrollReveal className="mt-20 text-center">
          <Button asChild variant="outline" size="lg" className="cursor-pointer rounded-full px-8 py-6 text-base font-bold transition-all hover:bg-primary hover:text-primary-foreground">
            <Link href="/blog" className="flex items-center gap-2">
              View All Posts
              <Icon icon="lucide:arrow-right" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

function BlogCard({ post }: { post: (typeof blogPosts)[number] }) {
  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/30"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={post.image} 
          alt={post.title} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Category Tag */}
        <div className="absolute left-6 top-6">
          <div className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900 backdrop-blur-md dark:bg-slate-900/90 dark:text-white">
            {post.category}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col p-8">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {post.date}
        </p>
        <h3 className="mb-3 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {post.excerpt}
        </p>
        
        {/* Footer Link */}
        <Link 
          href={`/blog/${post.slug}`}
          className="mt-auto inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-900 transition-all hover:gap-3 dark:text-white"
        >
          Read full story
          <Icon icon="lucide:arrow-right" className="h-4 w-4 text-primary" />
        </Link>
      </div>

      {/* Decorative Brand Glow on Hover */}
      <div className="absolute -bottom-20 -right-20 -z-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
    </div>
  );
}
