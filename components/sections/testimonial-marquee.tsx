"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
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

function platformTone(icon: string) {
  if (icon.includes("upwork")) return "text-[#14a800]";
  if (icon.includes("fiverr")) return "text-[#1dbf73]";
  if (icon.includes("linkedin")) return "text-[#0a66c2]";
  if (icon.includes("facebook")) return "text-[#1877f2]";
  return "text-pine";
}

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
    <Card
      variant="base"
      className="relative w-[280px] shrink-0 cursor-default p-5 hover:translate-y-0 sm:w-[300px]"
    >
      <Icon
        icon={testimonial.platform}
        aria-hidden
        className={cn("absolute right-5 top-5 h-5 w-5", platformTone(testimonial.platform))}
      />

      <div className="mb-3 flex gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: testimonial.rating }, (_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-pine text-pine" strokeWidth={0} />
        ))}
      </div>

      <p className="mb-4 line-clamp-4 text-sm leading-relaxed italic text-ink-soft">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      <div className="flex items-center gap-3 border-t border-hairline pt-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={testimonial.image}
          alt=""
          className="h-9 w-9 rounded-full border border-hairline object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-sora text-sm font-semibold text-ink">
            {testimonial.name}
          </p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
    </Card>
  );
}
