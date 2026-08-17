"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

export type ConnectorStationAt = (index: number, count: number) => number;

/** First station at 0, last at 1 — How We Work timeline. */
export const edgeStations: ConnectorStationAt = (i, n) =>
  n <= 1 ? 1 : i / (n - 1);

/** Stations at midpoints so nothing is pre-lit — Philosophy equation. */
export const midStations: ConnectorStationAt = (i, n) =>
  n <= 0 ? 1 : (i + 0.5) / n;

type UseConnectorProgressOptions = {
  stationCount: number;
  durationMs?: number;
  threshold?: number;
  autoPlayOnEnter?: boolean;
  once?: boolean;
  stationAt?: ConnectorStationAt;
  onFinale?: () => void;
};

export function useConnectorProgress<T extends HTMLElement = HTMLDivElement>({
  stationCount,
  durationMs = 2500,
  threshold = 0.35,
  autoPlayOnEnter = true,
  once = true,
  stationAt = edgeStations,
  onFinale,
}: UseConnectorProgressOptions) {
  const ref = useRef<T>(null);
  const activeRef = useRef(0);
  const finaleRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const onFinaleRef = useRef(onFinale);
  onFinaleRef.current = onFinale;

  const [progress, setProgress] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [finale, setFinale] = useState(false);

  const apply = useCallback(
    (raw: number) => {
      const el = ref.current;
      const p = Math.min(1, Math.max(0, raw));
      if (el) el.style.setProperty("--p", `${p * 100}%`);
      setProgress(p);

      let count = 0;
      for (let i = 0; i < stationCount; i++) {
        if (p + 0.001 >= stationAt(i, stationCount)) count += 1;
      }
      if (count !== activeRef.current) {
        activeRef.current = count;
        setActiveCount(count);
      }

      const done = count >= stationCount;
      if (done !== finaleRef.current) {
        finaleRef.current = done;
        setFinale(done);
        if (done) onFinaleRef.current?.();
      }
    },
    [stationCount, stationAt]
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1);
      return;
    }

    apply(0);

    const play = () => {
      tweenRef.current?.kill();
      finaleRef.current = false;
      activeRef.current = 0;
      setFinale(false);
      setActiveCount(0);
      const state = { p: 0 };
      apply(0);
      tweenRef.current = gsap.to(state, {
        p: 1,
        duration: durationMs / 1000,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => apply(state.p),
      });
    };

    if (!autoPlayOnEnter) {
      apply(1);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        play();
        if (once) observer.disconnect();
      },
      { threshold }
    );

    observer.observe(root);
    return () => {
      observer.disconnect();
      tweenRef.current?.kill();
    };
  }, [apply, autoPlayOnEnter, durationMs, once, threshold]);

  return { ref, progress, activeCount, finale };
}
