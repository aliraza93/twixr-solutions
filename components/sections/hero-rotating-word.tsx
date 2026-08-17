"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";

import { hero } from "@/content/hero";

const WORDS = hero.rotatingWords;

const DWELL_MS = 2000;
const TRANSITION_MS = 500;

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

export function HeroRotatingWord() {
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [entered, setEntered] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduce) return;

    let dwellTimer = 0;
    let cancelled = false;

    const schedule = () => {
      window.clearTimeout(dwellTimer);
      dwellTimer = window.setTimeout(() => {
        if (cancelled || document.hidden) return;
        setOutgoing(index);
        setEntered(false);
        setIndex((i) => (i + 1) % WORDS.length);
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
    if (entered) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [entered, index]);

  const stagger = !reduce && outgoing !== null && entered;

  return (
    <span className="hero-cycle" aria-hidden="true">
      <span className="hero-cycle__sizer">
        {WORDS.map((word) => (
          <span key={word} className="hero-cycle__ghost">
            <Chars word={word} />
          </span>
        ))}
      </span>
      <span className="hero-cycle__viewport">
        {WORDS.map((word, i) => {
          const phase = reduce
            ? i === 0
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
