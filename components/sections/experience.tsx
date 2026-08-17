"use client";

import { type CSSProperties, useId, useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Icon } from "@iconify/react";
import { career, experienceStatLine, experiences } from "@/content/experience";
import { Button } from "@/components/ui/button";
import { ConnectorLine } from "@/components/ui/connector-line";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import {
  midStations,
  useConnectorProgress,
} from "@/hooks/use-connector-progress";
import { cn } from "@/lib/utils";

type ExperienceItem = (typeof experiences)[number];

const sortedExperiences = [...experiences].sort((a, b) => {
  if (a.period.includes("Present")) return -1;
  if (b.period.includes("Present")) return 1;
  return 0;
});

const STATS = experienceStatLine();

export function Experience() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const uid = useId();
  const { ref, activeCount } = useConnectorProgress({
    stationCount: sortedExperiences.length,
    durationMs: 2200,
    threshold: 0.35,
    once: true,
    stationAt: midStations,
  });

  return (
    <section
      id="experience"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container grid items-start gap-10 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        <ScrollReveal className="lg:sticky lg:top-[120px] lg:col-span-4 lg:self-start">
          <header>
            <Eyebrow>{career.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              {career.heading} <span className="text-pine">{career.emphasis}</span>
            </h2>
            <p className="mt-5 max-w-[42ch] text-[length:var(--fs-lead)] text-muted">
              {career.lead}
            </p>
            <p className="mt-6 font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.16em] text-muted">
              {STATS}
            </p>
            <Button variant="ghost" asChild className="group mt-7">
              <a href={career.cvHref}>
                {career.cvLabel}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                >
                  →
                </span>
              </a>
            </Button>
          </header>
        </ScrollReveal>

        <div
          ref={ref}
          className="career-path relative lg:col-span-8"
          style={{ "--p": "0%" } as CSSProperties}
        >
          <ConnectorLine />
          <ol className="career-path__list">
            {sortedExperiences.map((exp, index) => (
              <li key={exp.company}>
                <ExperienceCard
                  exp={exp}
                  panelId={`${uid}-panel-${index}`}
                  open={expandedIndex === index}
                  nodeOn={index < activeCount}
                  onToggle={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({
  exp,
  panelId,
  open,
  nodeOn,
  onToggle,
}: {
  exp: ExperienceItem;
  panelId: string;
  open: boolean;
  nodeOn: boolean;
  onToggle: () => void;
}) {
  const current = exp.period.includes("Present");
  const highlights = exp.highlights;

  return (
    <article className="career-path__item">
      <span
        className={cn(
          "career-path__node",
          nodeOn && "is-on",
          current && "is-current"
        )}
        role="img"
        aria-label={
          current
            ? `${exp.company} logo, current role, Present`
            : `${exp.company} logo`
        }
      >
        <Icon icon={exp.logo} className="career-path__logo h-5 w-5" aria-hidden />
      </span>

      <div className={cn("career-card", open && "is-open")}>
        <button
          type="button"
          className="career-card__header"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="career-card__copy">
            <span className="career-card__role">{exp.role}</span>
            <span className="career-card__company">{exp.company}</span>
          </span>

          <span className="career-card__meta">
            {current && (
              <span className="career-card__present">
                <span className="career-card__present-dot" aria-hidden />
                Present
              </span>
            )}
            <span>{exp.period}</span>
            <span>{exp.location}</span>
          </span>

          <span className="career-card__toggle" aria-hidden>
            {open ? (
              <Minus className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={1.75} />
            )}
          </span>
        </button>

        <div
          id={panelId}
          className="career-card__panel"
          aria-hidden={!open}
          {...(!open ? { inert: true } : {})}
        >
          <div className="career-card__panel-inner">
            <div className="career-card__body">
              <div className="career-card__main">
                <p className="career-card__desc">{exp.description}</p>
                <ul className="career-card__tags">
                  {exp.technologies.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                {exp.link !== "#" && (
                  <a
                    href={exp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="career-card__link"
                  >
                    Visit {exp.company}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <aside className="career-card__highlights">
                <p className="career-card__highlights-label">Highlights</p>
                <ul>
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
