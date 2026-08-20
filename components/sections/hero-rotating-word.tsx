"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { hero } from "@/content/hero";

const DWELL_MS = 2000;
const TRANSITION_MS = 400;

type Phase = "in" | "enter" | "exit" | "hidden";

function wordPhase(
  i: number,
  index: number,
  outgoing: number | null,
  entered: boolean
): Phase {
  if (i === index) return entered ? "in" : "enter";
  if (i === outgoing) return "exit";
  return "hidden";
}

function Chars({ word }: { word: string }) {
  return (
    <>
      {Array.from(word).map((ch, i) => (
        <span
          key={`${word}-${i}`}
          className="hero-cycle__char"
          style={{ "--c": i } as CSSProperties}
        >
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </>
  );
}

export function HeroRotatingWord({ words }: { words?: readonly string[] }) {
  const WORDS = words?.length ? words : hero.rotatingWords;
  const slotRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(false);
  const reduceRef = useRef(false);
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [entered, setEntered] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const [widthReady, setWidthReady] = useState(false);

  indexRef.current = index;
  reduceRef.current = reduce;

  const readWidth = useCallback((i: number) => {
    const ghost = measureRef.current?.querySelector<HTMLElement>(
      `[data-word="${i}"]`
    );
    if (!ghost) return 0;
    return ghost.getBoundingClientRect().width;
  }, []);

  const setSlotWidth = useCallback((px: number, animate: boolean) => {
    const slot = slotRef.current;
    const motion = animate && readyRef.current && !reduceRef.current;

    if (slot && !motion) {
      slot.style.transition = "none";
      slot.style.width = `${px}px`;
      void slot.offsetWidth;
      slot.style.removeProperty("transition");
    }

    setWidth(px);

    if (!readyRef.current) {
      readyRef.current = true;
      setWidthReady(true);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    const px = readWidth(index);
    if (px > 0) setSlotWidth(px, true);
  }, [index, readWidth, setSlotWidth]);

  useEffect(() => {
    let cancelled = false;
    const snap = () => {
      if (cancelled) return;
      const px = readWidth(indexRef.current);
      if (px > 0) setSlotWidth(px, false);
    };

    void document.fonts?.ready.then(snap);
    window.addEventListener("resize", snap);
    document.fonts?.addEventListener("loadingdone", snap);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", snap);
      document.fonts?.removeEventListener("loadingdone", snap);
    };
  }, [readWidth, setSlotWidth]);

  useEffect(() => {
    let dwellTimer = 0;
    let cancelled = false;

    const schedule = () => {
      window.clearTimeout(dwellTimer);
      dwellTimer = window.setTimeout(() => {
        if (cancelled || document.hidden) return;
        const next = (index + 1) % WORDS.length;
        if (reduce) {
          setOutgoing(null);
          setEntered(true);
          setIndex(next);
          return;
        }
        setOutgoing(index);
        setEntered(false);
        setIndex(next);
      }, DWELL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(dwellTimer);
        return;
      }
      schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearTimeout(dwellTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [index, reduce]);

  useEffect(() => {
    if (outgoing === null) return;
    const id = window.setTimeout(() => setOutgoing(null), TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [outgoing]);

  useLayoutEffect(() => {
    if (entered || reduce) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [entered, index, reduce]);

  const stagger = !reduce && outgoing !== null && entered;
  const slotStyle =
    width != null ? ({ width: `${width}px` } as CSSProperties) : undefined;

  return (
    <span
      ref={slotRef}
      className={`hero-cycle${widthReady && !reduce ? " is-ready" : ""}`}
      style={slotStyle}
      aria-hidden="true"
    >
      <span className="hero-cycle__sizer">
        <Chars word={WORDS[index]} />
      </span>
      <span ref={measureRef} className="hero-cycle__measure">
        {WORDS.map((word, i) => (
          <span key={word} data-word={i} className="hero-cycle__ghost">
            <Chars word={word} />
          </span>
        ))}
      </span>
      <span className="hero-cycle__viewport">
        {WORDS.map((word, i) => {
          const phase = reduce
            ? i === index
              ? "in"
              : "hidden"
            : wordPhase(i, index, outgoing, entered);
          return (
            <span
              key={word}
              className={`hero-cycle__word is-${phase}${
                stagger && phase === "in" ? " is-stagger" : ""
              }`}
            >
              <Chars word={word} />
            </span>
          );
        })}
      </span>
    </span>
  );
}
