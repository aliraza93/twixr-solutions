"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SCROLL_REVEAL_TRANSITION,
  useScrollReveal,
  type ScrollRevealOptions,
} from "@/hooks/use-scroll-reveal";

type ScrollRevealProps = ScrollRevealOptions & {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({
  children,
  className,
  amount,
  distance,
  delay,
  margin,
}: ScrollRevealProps) {
  const reveal = useScrollReveal({ amount, distance, delay, margin });

  if (reveal.reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={reveal.ref}
      className={className}
      initial={reveal.initial}
      animate={reveal.animate}
      transition={reveal.transition}
    >
      {children}
    </motion.div>
  );
}

const StaggerOffsetContext = createContext(28);

type ScrollStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  amount?: number;
  margin?: string;
  distance?: number;
};

export function ScrollStagger({
  children,
  className,
  stagger = 0.06,
  amount = 0.08,
  margin = "0px 0px -6% 0px",
  distance = 24,
}: ScrollStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount,
    margin: margin as `${number}px ${number}px ${number}px ${number}px`,
  });
  const reduceMotion = useReducedMotion();
  const [hiddenY, setHiddenY] = useState(distance);

  const updateHiddenOffset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportMid = window.innerHeight / 2;
    const elementMid = rect.top + rect.height / 2;
    setHiddenY(elementMid > viewportMid ? distance : -distance);
  }, [distance]);

  useEffect(() => {
    updateHiddenOffset();
    if (isInView) return;

    window.addEventListener("scroll", updateHiddenOffset, { passive: true });
    window.addEventListener("resize", updateHiddenOffset);
    return () => {
      window.removeEventListener("scroll", updateHiddenOffset);
      window.removeEventListener("resize", updateHiddenOffset);
    };
  }, [isInView, updateHiddenOffset]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <StaggerOffsetContext.Provider value={hiddenY}>
      <motion.div
        ref={ref}
        className={className}
        initial={false}
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: stagger } },
        }}
      >
        {children}
      </motion.div>
    </StaggerOffsetContext.Provider>
  );
}

type ScrollRevealItemProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealItem({ children, className }: ScrollRevealItemProps) {
  const hiddenY = useContext(StaggerOffsetContext);
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: hiddenY },
        visible: {
          opacity: 1,
          y: 0,
          transition: SCROLL_REVEAL_TRANSITION,
        },
      }}
    >
      {children}
    </motion.div>
  );
}
