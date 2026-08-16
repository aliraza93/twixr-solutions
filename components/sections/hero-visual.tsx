"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Activity, Globe, Zap } from "lucide-react";

const MAX_TILT = 6;

export type HeroVisualImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

function canTilt() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

function BrowserChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-surface px-3 py-2.5">
      <span className="h-2 w-2 rounded-full bg-danger/80" />
      <span className="h-2 w-2 rounded-full bg-warning/80" />
      <span className="h-2 w-2 rounded-full bg-lime-deep" />
      <span className="ml-2 truncate rounded-sm bg-canvas px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-2">
        {title}
      </span>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="bg-canvas">
      <BrowserChrome title="app.twixrsolutions.com/ops" />
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">
              Production
            </p>
            <p className="mt-0.5 font-sora text-sm font-semibold text-ink">Delivery dashboard</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-pine-tint px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-pine">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Uptime", value: "99.99%", icon: Activity },
            { label: "Latency", value: "42ms", icon: Zap },
            { label: "Deploys", value: "12", icon: Globe },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-md border border-hairline bg-surface px-2.5 py-2"
            >
              <stat.icon className="mb-1.5 h-3 w-3 text-pine" aria-hidden />
              <p className="font-sora text-sm font-bold leading-none tracking-[-0.02em] text-ink sm:text-base">
                {stat.value}
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-hairline bg-surface px-3 py-3">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Requests
            </p>
            <p className="font-mono text-[10px] text-pine">2.4M · +12%</p>
          </div>
          <svg
            viewBox="0 0 240 64"
            className="h-14 w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F5132" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#BEF03A" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="hero-chart-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0F5132" />
                <stop offset="100%" stopColor="#7A9A00" />
              </linearGradient>
            </defs>
            <path
              d="M0 48 C 20 46, 32 40, 48 38 C 72 34, 88 44, 110 28 C 128 16, 148 22, 168 18 C 188 14, 208 26, 240 8 L 240 64 L 0 64 Z"
              fill="url(#hero-chart-fill)"
            />
            <path
              d="M0 48 C 20 46, 32 40, 48 38 C 72 34, 88 44, 110 28 C 128 16, 148 22, 168 18 C 188 14, 208 26, 240 8"
              fill="none"
              stroke="url(#hero-chart-stroke)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="240" cy="8" r="3.5" fill="#BEF03A" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function CodeCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-md">
      <div className="flex items-center gap-2 border-b border-hairline bg-surface px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
        <span className="font-mono text-[10px] tracking-wide text-muted-2">
          deployment-script.ts
        </span>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-5 text-ink sm:text-[12px] sm:leading-6">
        <span className="text-pine">const</span> deploy ={" "}
        <span className="text-pine">async</span> () =&gt; {"{"}
        {"\n"}
        {"  "}
        <span className="text-pine">await</span> cloud.scale({"{"}
        {"\n"}
        {"    "}mode: <span className="text-lime-ink">&quot;global&quot;</span>,
        {"\n"}
        {"    "}uptime: <span className="text-pine">99.99</span>
        {"\n"}
        {"  "}
        {"}"});
        <span
          aria-hidden
          className="hero-caret ml-0.5 inline-block h-[0.95em] w-[5px] translate-y-[2px] bg-lime-deep align-middle"
        />
        {"\n"}
        {"}"}
      </pre>
    </div>
  );
}

export function HeroVisual({ image }: { image?: HeroVisualImage }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const badgeARef = useRef<HTMLDivElement>(null);
  const badgeBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const tilt = tiltRef.current;
    const dash = dashRef.current;
    const code = codeRef.current;
    const badgeA = badgeARef.current;
    const badgeB = badgeBRef.current;
    if (!stage || !tilt || !dash || !code || !badgeA || !badgeB) return;
    if (!canTilt()) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;

    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      tilt.style.transform = `rotateX(${current.y}deg) rotateY(${current.x}deg)`;
      dash.style.transform = `translate3d(${current.x * 0.6}px, ${-current.y * 0.4}px, 0)`;
      code.style.setProperty("--px", `${current.x * 2.4}px`);
      code.style.setProperty("--py", `${-current.y * 2}px`);
      badgeA.style.setProperty("--px", `${current.x * 3.2}px`);
      badgeA.style.setProperty("--py", `${-current.y * 2.4}px`);
      badgeB.style.setProperty("--px", `${-current.x * 2.2}px`);
      badgeB.style.setProperty("--py", `${current.y * 2.6}px`);
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      target.x = nx * MAX_TILT * 2;
      target.y = -ny * MAX_TILT * 2;
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const imgW = image?.width ?? 960;
  const imgH = image?.height ?? 720;

  return (
    <div
      ref={stageRef}
      className="relative mx-auto w-full max-w-[560px] lg:max-w-none lg:justify-self-stretch"
      style={{ perspective: "1200px" }}
    >
      <div
        ref={tiltRef}
        className="relative will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          ref={dashRef}
          className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-lg"
        >
          {image ? (
            <>
              <BrowserChrome title="twixrsolutions.com" />
              <Image
                src={image.src}
                alt={image.alt}
                width={imgW}
                height={imgH}
                priority
                className="h-auto w-full"
                sizes="(max-width: 1023px) 90vw, 520px"
              />
            </>
          ) : (
            <DashboardMock />
          )}
        </div>

        <div
          ref={codeRef}
          className="hero-float absolute bottom-[-1.5rem] left-3 z-10 w-[min(100%-1.5rem,280px)] sm:bottom-[-2rem] sm:w-[70%]"
          style={{ animationDelay: "-0.4s" }}
        >
          <CodeCard />
        </div>

        <div
          ref={badgeARef}
          className="hero-float absolute right-2 top-8 z-20 flex items-center gap-2 rounded-pill border border-hairline bg-canvas px-3 py-1.5 shadow-md sm:top-10"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-lime-deep opacity-40 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-deep" />
          </span>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink">
            System Operational
          </span>
        </div>

        <div
          ref={badgeBRef}
          className="hero-float absolute right-2 bottom-16 z-20 flex items-center gap-2 rounded-pill border border-hairline bg-canvas px-3 py-1.5 shadow-md sm:bottom-20"
          style={{ animationDelay: "-1.8s" }}
        >
          <Globe className="h-3 w-3 text-pine" aria-hidden />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink">
            Global CDN Active
          </span>
        </div>
      </div>
    </div>
  );
}
