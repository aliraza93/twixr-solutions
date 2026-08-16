"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Icon } from "@iconify/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Testimonial = {
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  rating: number;
  platform: string;
};

type TestimonialCarouselProps = {
  items: Testimonial[];
  featuredIndex?: number;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function platformTone(icon: string) {
  if (icon.includes("upwork")) return "text-[#14a800]";
  if (icon.includes("fiverr")) return "text-[#1dbf73]";
  if (icon.includes("linkedin")) return "text-[#0a66c2]";
  if (icon.includes("facebook")) return "text-[#1877f2]";
  return "";
}

export function TestimonialCarousel({
  items,
  featuredIndex = 0,
  className,
}: TestimonialCarouselProps) {
  const liveId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [perView, setPerView] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return { max: 0, step: 0 };
    const slide = track.querySelector<HTMLElement>(".carousel__slide");
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const step = slide ? slide.getBoundingClientRect().width + gap : 0;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    return { max, step };
  }, []);

  const syncFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { max, step } = measure();
    const left = track.scrollLeft;
    const nextProgress = max > 0 ? left / max : 0;
    const nextIndex =
      step > 0
        ? Math.min(total - 1, Math.max(0, Math.round(left / step)))
        : 0;
    const visible =
      step > 0 ? Math.max(1, Math.round(track.clientWidth / step)) : 1;
    setProgress(nextProgress);
    setPerView(visible);
    if (nextIndex !== indexRef.current) {
      indexRef.current = nextIndex;
      setIndex(nextIndex);
    }
  }, [measure, total]);

  const goTo = useCallback(
    (next: number, behavior?: ScrollBehavior) => {
      const track = trackRef.current;
      if (!track || total === 0) return;
      const wrapped = ((next % total) + total) % total;
      const { step } = measure();
      const reduce = prefersReducedMotion();
      const crossing =
        total > 2 &&
        ((indexRef.current === total - 1 && wrapped === 0) ||
          (indexRef.current === 0 && wrapped === total - 1));
      track.scrollTo({
        left: wrapped * step,
        behavior: behavior ?? (reduce || crossing ? "auto" : "smooth"),
      });
    },
    [measure, total]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        syncFromScroll();
      });
    };
    let raf = 0;

    track.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      if (track.classList.contains("is-dragging")) return;
      goTo(indexRef.current, "auto");
      syncFromScroll();
    });
    ro.observe(track);
    syncFromScroll();

    return () => {
      track.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [goTo, syncFromScroll]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const down = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      moved = false;
      track.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (!moved && Math.abs(dx) < 8) return;
      if (!moved) {
        moved = true;
        setDragging(true);
        track.classList.add("is-dragging");
      }
      track.scrollLeft = startScroll - dx;
    };

    const up = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      track.classList.remove("is-dragging");
      setDragging(false);
      if (!moved) return;
      const { step } = measure();
      if (step <= 0) return;
      const nearest = Math.round(track.scrollLeft / step);
      goTo(nearest);
    };

    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);

    return () => {
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    };
  }, [goTo, measure]);

  useEffect(() => {
    if (paused || dragging || total < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      goTo(indexRef.current + 1);
    }, 5600);
    return () => window.clearInterval(id);
  }, [dragging, goTo, paused, total]);

  const current = items[index] ?? items[0];
  const liveText = current
    ? `${String(index + 1).padStart(2, "0")} of ${String(total).padStart(2, "0")}: ${current.name}`
    : "";

  return (
    <div
      className={cn("carousel", dragging && "is-dragging", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(indexRef.current + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(indexRef.current - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          goTo(0);
        } else if (event.key === "End") {
          event.preventDefault();
          goTo(total - 1);
        }
      }}
    >
      <p id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveText}
      </p>

      <div className="carousel__toolbar">
        <div
          className="carousel__bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label="Carousel position"
        >
          <span
            className="carousel__bar-fill"
            style={{
              width: `${
                dragging
                  ? Math.max(progress, 1 / Math.max(total, 1)) * 100
                  : ((index + 1) / Math.max(total, 1)) * 100
              }%`,
            }}
          />
        </div>

        <p className="carousel__count" aria-hidden>
          {String(index + 1).padStart(2, "0")}
          <span> / </span>
          {String(total).padStart(2, "0")}
        </p>

        <div className="carousel__nav">
          <button
            type="button"
            className="carousel__btn"
            aria-label="Previous testimonial"
            onClick={() => goTo(indexRef.current - 1)}
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            className="carousel__btn"
            aria-label="Next testimonial"
            onClick={() => goTo(indexRef.current + 1)}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      <div ref={trackRef} className="carousel__track">
        {items.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="carousel__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${total}`}
            aria-hidden={i < index || i >= index + perView}
          >
            <TestimonialCard
              item={item}
              featured={i === featuredIndex}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({
  item,
  featured,
}: {
  item: Testimonial;
  featured: boolean;
}) {
  return (
    <Card
      variant={featured ? "feature" : "base"}
      className={cn(
        "carousel__card relative flex h-full min-h-[280px] flex-col hover:translate-y-0",
        featured && "hover:shadow-none"
      )}
    >
      <Icon
        icon={item.platform}
        aria-hidden
        className={cn(
          "absolute right-8 top-8 h-6 w-6",
          platformTone(item.platform)
        )}
      />

      <div className="mb-5 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
        {Array.from({ length: item.rating }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4 fill-current",
              featured ? "text-lime" : "text-pine"
            )}
            strokeWidth={0}
          />
        ))}
      </div>

      <blockquote
        className={cn(
          "flex-1 pr-10 text-[length:var(--fs-body)] leading-relaxed italic",
          featured ? "text-d-muted" : "text-ink-soft"
        )}
      >
        &ldquo;{item.content}&rdquo;
      </blockquote>

      <footer
        className={cn(
          "mt-8 flex items-center gap-3.5 border-t pt-5",
          featured ? "border-d-hairline" : "border-hairline"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt=""
          width={44}
          height={44}
          className={cn(
            "h-11 w-11 rounded-full border object-cover",
            featured ? "border-d-hairline" : "border-hairline"
          )}
        />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-sora text-sm font-semibold tracking-[-0.02em]",
              featured ? "text-d-text" : "text-ink"
            )}
          >
            {item.name}
          </p>
          <p
            className={cn(
              "truncate font-mono text-[11px] uppercase tracking-[0.08em]",
              featured ? "text-d-muted" : "text-muted"
            )}
          >
            {item.role} · {item.company}
          </p>
        </div>
      </footer>
    </Card>
  );
}
