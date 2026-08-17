"use client";

import { howWeWork } from "@/content/howwework";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProgressTimeline } from "@/components/ui/progress-timeline";
import { TypingTerminal } from "@/components/ui/typing-terminal";

const TIMELINE_NODES = howWeWork.steps.map((step, i) => ({
  index: String(i + 1).padStart(2, "0"),
  title: howWeWork.stepNames[i] ?? step.title,
  description: step.description,
}));

export function Approach() {
  return (
    <section
      id="process"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <header className="max-w-[38rem]">
          <Eyebrow>{howWeWork.eyebrow}</Eyebrow>
          <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            <span className="block">{howWeWork.headingLine1}</span>
            <span className="mt-1 block">
              {howWeWork.headingLine2Before}{" "}
              <span className="text-pine">{howWeWork.headingEmphasis}</span>
            </span>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
            {howWeWork.lead}
          </p>
        </header>

        <ProgressTimeline className="mt-14 md:mt-16" nodes={TIMELINE_NODES} />

        <div className="mt-16 grid items-center gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <TypingTerminal
            className="lg:col-span-6"
            title={howWeWork.terminal.title}
            lines={[...howWeWork.terminal.lines]}
          />
          <div className="lg:col-span-6">
            <Eyebrow>{howWeWork.inPractice.eyebrow}</Eyebrow>
            <h3 className="mt-5 font-sora text-[length:var(--fs-h2)] font-bold leading-[1.12] tracking-[-0.02em] text-ink">
              <span className="block">{howWeWork.inPractice.headingLine1}</span>
              <span className="mt-1 block text-pine">
                {howWeWork.inPractice.headingLine2}
              </span>
            </h3>
            <p className="mt-4 max-w-[48ch] text-[length:var(--fs-lead)] text-muted">
              {howWeWork.inPractice.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
