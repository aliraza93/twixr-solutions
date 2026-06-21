"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  rating: number;
  platform: string;
};

type TestimonialMarqueeProps = {
  items: TestimonialItem[];
  rows?: 1 | 2;
  className?: string;
};

export function TestimonialMarquee({ items, rows = 2, className }: TestimonialMarqueeProps) {
  if (items.length === 0) return null;

  if (rows === 1) {
    return (
      <div className={cn("flex flex-col", className)}>
        <MarqueeRow items={items} direction="left" speed={45} />
      </div>
    );
  }

  const middleIndex = Math.ceil(items.length / 2);
  const row1 = items.slice(0, middleIndex);
  const row2 = items.slice(middleIndex);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <MarqueeRow items={row1.length ? row1 : items} direction="left" speed={42} />
      <MarqueeRow items={row2.length ? row2 : items} direction="right" speed={50} />
    </div>
  );
}

function MarqueeRow({
  items,
  direction = "left",
  speed = 40,
}: {
  items: TestimonialItem[];
  direction?: "left" | "right";
  speed?: number;
}) {
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <motion.div
        animate={{
          x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex gap-4 px-2"
      >
        {duplicatedItems.map((item, idx) => (
          <TestimonialFloatCard key={`${item.name}-${idx}`} testimonial={item} />
        ))}
      </motion.div>
    </div>
  );
}

function TestimonialFloatCard({ testimonial }: { testimonial: TestimonialItem }) {
  return (
    <div className="group relative w-[280px] shrink-0 cursor-default overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/30 dark:hover:shadow-none sm:w-[300px]">
      <div className="absolute right-4 top-4">
        <Icon
          icon={testimonial.platform}
          className={cn(
            "h-5 w-5",
            testimonial.platform.includes("upwork") && "scale-[1.2] text-[#14a800]",
            testimonial.platform.includes("fiverr") && "scale-[1.4] text-[#1dbf73]",
            testimonial.platform.includes("linkedin") && "text-[#0a66c2]",
            testimonial.platform.includes("facebook") && "text-[#1877f2]"
          )}
        />
      </div>

      <div className="mb-3 flex gap-0.5">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Icon key={i} icon="material-symbols:star" className="h-3.5 w-3.5 text-amber-400" />
        ))}
      </div>

      <p className="mb-4 line-clamp-4 text-sm leading-normal text-slate-600 italic dark:text-slate-400">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="h-9 w-9 rounded-full border border-slate-100 object-cover dark:border-slate-700"
        />
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{testimonial.name}</h4>
          <p className="truncate text-[10px] font-medium text-slate-400">
            {testimonial.role} @ {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  );
}
