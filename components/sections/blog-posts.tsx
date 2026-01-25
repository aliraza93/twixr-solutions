"use client";

import { motion } from "framer-motion";
import { blogPosts } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BlogPosts() {
  return (
    <section className="relative overflow-hidden bg-slate-50/30 py-24 dark:bg-slate-900/10">
      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="mb-4 inline-block rounded-full bg-blue-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:bg-blue-500/20"
            >
              Latest Insights
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
            >
              Recent Blog <span className="text-blue-600">Posts</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-lg text-slate-600 dark:text-slate-400"
            >
              Sharing my discoveries, technical deep-dives, and life experiences in software engineering.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <Button asChild variant="outline" className="rounded-xl px-6 py-5 font-bold transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900">
              <Link href="/blog" className="flex items-center gap-2">
                View All Posts
                <Icon icon="lucide:arrow-right" className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, idx) => (
            <BlogCard key={post.slug} post={post} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogCard({ post, index }: { post: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white transition-all duration-500 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30"
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
        <h3 className="mb-4 text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {post.title}
        </h3>
        <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {post.excerpt}
        </p>
        
        {/* Footer Link */}
        <Link 
          href={`/blog/${post.slug}`}
          className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-slate-900 transition-all hover:gap-3 dark:text-white"
        >
          Read full story
          <Icon icon="lucide:arrow-right" className="h-4 w-4 text-blue-600" />
        </Link>
      </div>

      {/* Decorative Brand Glow on Hover */}
      <div className="absolute -bottom-20 -right-20 -z-10 h-40 w-40 rounded-full bg-blue-600/5 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
}
