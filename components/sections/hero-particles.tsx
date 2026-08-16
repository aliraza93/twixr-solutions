"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  depth: number;
  kind: 0 | 1 | 2;
};

const MUTED = "rgba(153, 160, 156, 0.22)";
const PINE = "rgba(15, 81, 50, 0.32)";
const LIME = "rgba(122, 154, 0, 0.28)";
const LINE = "rgba(11, 15, 13, 0.055)";
const LINK_DIST = 92;

function shouldRun() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  if (window.matchMedia("(hover: none)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  return true;
}

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldRun()) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let running = true;
    let inView = true;
    const pointer = { x: 0.5, y: 0.5 };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(52, Math.max(28, Math.floor((width * height) / 22000)));
      particles = Array.from({ length: count }, () => {
        const roll = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1 + Math.random() * 1.4,
          depth: 0.35 + Math.random() * 0.65,
          kind: roll > 0.92 ? 2 : roll > 0.84 ? 1 : 0,
        };
      });
    };

    const draw = () => {
      if (!running) return;
      if (inView) {
        ctx.clearRect(0, 0, width, height);
        const ox = (pointer.x - 0.5) * 28;
        const oy = (pointer.y - 0.5) * 20;

        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < -12) a.x = width + 12;
          if (a.x > width + 12) a.x = -12;
          if (a.y < -12) a.y = height + 12;
          if (a.y > height + 12) a.y = -12;

          const ax = a.x + ox * (1 - a.depth);
          const ay = a.y + oy * (1 - a.depth);

          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist > LINK_DIST) continue;
            ctx.strokeStyle = LINE;
            ctx.lineWidth = 1;
            ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.9;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(b.x + ox * (1 - b.depth), b.y + oy * (1 - b.depth));
            ctx.stroke();
          }

          ctx.globalAlpha = 1;
          ctx.fillStyle = a.kind === 2 ? LIME : a.kind === 1 ? PINE : MUTED;
          ctx.beginPath();
          ctx.arc(ax, ay, a.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(parent);

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    window.addEventListener("pointermove", onPointer, { passive: true });
    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
