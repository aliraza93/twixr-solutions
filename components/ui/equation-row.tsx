"use client";

import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { ConnectorLine } from "@/components/ui/connector-line";
import { EquationTile, type EquationTileVariant } from "@/components/ui/equation-tile";
import { IconNode } from "@/components/ui/icon-node";
import {
  useConnectorProgress,
  type ConnectorStationAt,
} from "@/hooks/use-connector-progress";

type TrackAxis = "x" | "y";

type TrackBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  axis: TrackAxis;
};

function readTrack(row: HTMLElement): TrackBox | null {
  const faces = row.querySelectorAll<HTMLElement>(".eq-tile__face");
  if (faces.length < 2) return null;

  const rowRect = row.getBoundingClientRect();
  const first = faces[0].getBoundingClientRect();
  const last = faces[faces.length - 1].getBoundingClientRect();
  const horizontal = last.left - first.right > 8;

  if (horizontal) {
    return {
      left: first.right - rowRect.left,
      top: first.top + first.height / 2 - rowRect.top - 1,
      width: Math.max(0, last.left - first.right),
      height: 2,
      axis: "x",
    };
  }

  return {
    left: first.left + first.width / 2 - rowRect.left - 1,
    top: first.bottom - rowRect.top,
    width: 2,
    height: Math.max(0, last.top - first.bottom),
    axis: "y",
  };
}

export type EquationItem = {
  icon: ReactNode;
  label: string;
  sublabel?: string;
};

type EquationRowProps = {
  a: EquationItem;
  b: EquationItem;
  c: EquationItem;
  shape?: "square" | "circle";
  className?: string;
  durationMs?: number;
  once?: boolean;
  onFinale?: () => void;
};

const STATIONS = 5;

const playStations: ConnectorStationAt = (i, n) => {
  if (n <= 0) return 1;
  if (i === n - 1) return 1;
  return (i + 0.5) / n;
};

function Operator({
  glyph,
  index,
  circled,
  active,
}: {
  glyph: "+" | "=";
  index: number;
  circled?: boolean;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "eq-op-wrap relative z-[1] flex h-8 items-center justify-center",
        circled ? "eq-reveal md:h-24" : "md:h-[132px]",
        active && "is-active"
      )}
      style={{ "--i": index } as CSSProperties}
      aria-hidden
    >
      <span
        className={cn(
          "eq-op font-sora font-bold leading-none text-muted",
          circled ? "eq-op--node text-base" : "text-[length:var(--fs-h2)]"
        )}
      >
        {glyph}
      </span>
    </span>
  );
}

function SquareNode({
  item,
  variant,
  active,
  shine,
}: {
  item: EquationItem;
  variant: EquationTileVariant;
  active: boolean;
  shine: boolean;
}) {
  return (
    <EquationTile
      label={item.label}
      variant={variant}
      active={active}
      shine={shine}
    >
      {item.icon}
    </EquationTile>
  );
}

function CircleNode({
  item,
  variant,
  index,
}: {
  item: EquationItem;
  variant: EquationTileVariant;
  index: number;
}) {
  return (
    <div
      className={cn(
        "eq-reveal relative z-[1]",
        variant !== "result" && "md:pt-3"
      )}
      style={{ "--i": index } as CSSProperties}
      {...(variant === "result" ? { "data-eq-result": true } : {})}
    >
      <IconNode
        label={item.label}
        sublabel={item.sublabel}
        accent={variant === "result" ? "lime" : "pine"}
        size={variant === "result" ? "lg" : "md"}
      >
        {item.icon}
      </IconNode>
    </div>
  );
}

function PlayEquationRow({
  a,
  b,
  c,
  className,
  durationMs = 1800,
  once = true,
  onFinale,
}: Omit<EquationRowProps, "shape">) {
  const { ref, activeCount, finale } = useConnectorProgress({
    stationCount: STATIONS,
    durationMs,
    threshold: 0.4,
    once,
    stationAt: playStations,
    onFinale,
  });
  const [track, setTrack] = useState<TrackBox | null>(null);

  const measure = useCallback(() => {
    const row = ref.current;
    if (!row) return;
    const next = readTrack(row);
    if (!next || (next.axis === "x" ? next.width : next.height) <= 0) return;
    setTrack(next);
  }, [ref]);

  useLayoutEffect(() => {
    measure();
    const row = ref.current;
    if (!row) return;

    let cancelled = false;
    const snap = () => {
      if (!cancelled) measure();
    };

    const ro = new ResizeObserver(snap);
    ro.observe(row);
    row.querySelectorAll(".eq-tile__face").forEach((face) => ro.observe(face));

    window.addEventListener("resize", snap);
    void document.fonts?.ready.then(snap);

    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", snap);
    };
  }, [measure, ref]);

  return (
    <div
      ref={ref}
      className={cn(
        "eq-row eq-row--play relative flex w-full flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-[clamp(56px,8vw,104px)]",
        className
      )}
      data-eq-axis={track?.axis ?? "y"}
      style={{ "--p": "0%" } as CSSProperties}
      role="group"
      aria-label={`${a.label} plus ${b.label} equals ${c.label}`}
    >
      {track ? (
        <div
          className="eq-row__track"
          style={{
            left: track.left,
            top: track.top,
            width: track.width,
            height: track.height,
          }}
          aria-hidden
        >
          <ConnectorLine detachDot />
        </div>
      ) : null}
      <SquareNode
        item={a}
        variant="default"
        active={activeCount >= 1}
        shine={false}
      />
      <Operator glyph="+" index={2} active={activeCount >= 2} />
      <SquareNode
        item={b}
        variant="default"
        active={activeCount >= 3}
        shine={false}
      />
      <Operator glyph="=" index={4} active={activeCount >= 4} />
      <SquareNode
        item={c}
        variant="result"
        active={activeCount >= 5}
        shine={finale}
      />
    </div>
  );
}

export function EquationRow({
  a,
  b,
  c,
  shape = "square",
  className,
  durationMs = 1800,
  once = true,
  onFinale,
}: EquationRowProps) {
  if (shape === "circle") {
    return (
      <div
        className={cn(
          "eq-row eq-row--circle relative flex w-full flex-col items-center gap-5 md:flex-row md:items-start md:justify-center md:gap-[clamp(16px,3vw,40px)]",
          className
        )}
        role="group"
        aria-label={`${a.label} plus ${b.label} equals ${c.label}`}
      >
        <span className="eq-row__rail" aria-hidden />
        <CircleNode item={a} variant="default" index={1} />
        <Operator glyph="+" index={2} circled />
        <CircleNode item={b} variant="result" index={3} />
        <Operator glyph="=" index={4} circled />
        <CircleNode item={c} variant="default" index={5} />
      </div>
    );
  }

  return (
    <PlayEquationRow
      a={a}
      b={b}
      c={c}
      className={className}
      durationMs={durationMs}
      once={once}
      onFinale={onFinale}
    />
  );
}
