"use client";

import { approachSteps } from "@/lib/data";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProgressTimeline } from "@/components/ui/progress-timeline";
import { TypingTerminal, type TerminalLine } from "@/components/ui/typing-terminal";

const STEP_NAMES = ["Discover", "Architect", "Build", "Test", "Deploy"] as const;

const TIMELINE_NODES = approachSteps.map((step, i) => ({
  index: String(i + 1).padStart(2, "0"),
  title: STEP_NAMES[i] ?? step.title,
  description: step.description,
}));

const TERMINAL_LINES: TerminalLine[] = [
  { kind: "cmd", text: "$ twixr deployment" },
  { kind: "ok", text: "Tests passing" },
  { kind: "ok", text: "Docker image built" },
  { kind: "ok", text: "Migrations run" },
  { kind: "ok", text: "SSL & CDN configured" },
  { kind: "run", text: "Deploying to production…" },
];

export function Approach() {
  return (
    <section
      id="process"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <header className="max-w-[38rem]">
          <Eyebrow>How we work</Eyebrow>
          <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            <span className="block">From a messy brief</span>
            <span className="mt-1 block">
              to a process that{" "}
              <span className="bg-[image:var(--grad-emphasis)] bg-clip-text text-transparent">
                ships.
              </span>
            </span>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
            I follow a structured, results-driven process designed to transform
            complex challenges into scalable, high-performing solutions.
          </p>
        </header>

        <ProgressTimeline className="mt-14 md:mt-16" nodes={TIMELINE_NODES} />

        <div className="mt-16 grid items-center gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <TypingTerminal
            className="lg:col-span-6"
            title="twixr · deployment"
            lines={TERMINAL_LINES}
          />
          <div className="lg:col-span-6">
            <Eyebrow>In practice</Eyebrow>
            <h3 className="mt-5 font-sora text-[length:var(--fs-h2)] font-bold leading-[1.12] tracking-[-0.02em] text-ink">
              <span className="block">From whiteboard to</span>
              <span className="mt-1 block text-pine">production.</span>
            </h3>
            <p className="mt-4 max-w-[48ch] text-[length:var(--fs-lead)] text-muted">
              The same five steps run on every engagement — discovery notes become
              architecture, architecture becomes a pipeline, and the pipeline is
              what ships. No theatre, no mystery phase after “done.”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
