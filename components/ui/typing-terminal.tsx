"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TerminalLine = {
  text: string;
  kind?: "cmd" | "ok" | "run";
};

type TypingTerminalProps = {
  title?: string;
  lines: TerminalLine[];
  className?: string;
};

const CHAR_MS = 18;

export function TypingTerminal({
  title = "twixr · deployment",
  lines,
  className,
}: TypingTerminalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(reduced);
    if (reduced) {
      setStarted(true);
      setLineIndex(lines.length);
      setCharIndex(0);
      return;
    }

    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lines.length]);

  useEffect(() => {
    if (!started || reduce) return;
    if (lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const lineMs = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--type-line-ms") ||
        "320",
      10
    );

    if (charIndex < line.text.length) {
      const id = window.setTimeout(() => setCharIndex((c) => c + 1), CHAR_MS);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setLineIndex((i) => i + 1);
      setCharIndex(0);
    }, Number.isFinite(lineMs) ? lineMs : 320);
    return () => window.clearTimeout(id);
  }, [started, reduce, lineIndex, charIndex, lines]);

  const done = reduce || lineIndex >= lines.length;

  return (
    <div
      ref={rootRef}
      className={cn(
        "overflow-hidden rounded-xl bg-ink text-d-text shadow-lg",
        className
      )}
      data-cursor-dark
      aria-label={title}
    >
      <div className="flex items-center gap-2 border-b border-d-hairline bg-d-bg-2 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-lime-deep" aria-hidden />
        <span className="font-mono text-[11px] tracking-wide text-d-muted">{title}</span>
      </div>
      <pre className="min-h-[220px] overflow-x-auto p-4 font-mono text-[12px] leading-7 sm:text-[13px] sm:leading-7">
        {!started && !reduce ? (
          <span
            aria-hidden
            className="hero-caret inline-block h-[0.95em] w-[7px] translate-y-[2px] bg-lime-deep align-middle"
          />
        ) : (
          lines.map((line, i) => {
          const isCurrent = i === lineIndex;
          const isPast = reduce || i < lineIndex;
          const isFuture = !reduce && i > lineIndex;
          if (isFuture) return null;

          const typed = isPast
            ? line.text
            : isCurrent
              ? line.text.slice(0, charIndex)
              : "";
          const caretHere = !done ? isCurrent : i === lines.length - 1;

          return (
            <span key={`${line.text}-${i}`} className="block">
              {line.kind === "ok" && (
                <span className="text-lime-deep">✓ </span>
              )}
              {line.kind === "run" && (
                <span className="text-lime-deep">─→ </span>
              )}
              <span
                className={
                  line.kind === "cmd" || line.kind === "run"
                    ? "text-d-muted"
                    : "text-d-text"
                }
              >
                {typed}
              </span>
              {caretHere && (
                <span
                  aria-hidden
                  className={cn(
                    "ml-0.5 inline-block h-[0.95em] w-[7px] translate-y-[2px] bg-lime-deep align-middle",
                    reduce ? "opacity-100" : "hero-caret"
                  )}
                />
              )}
            </span>
          );
        })
        )}
      </pre>
    </div>
  );
}
