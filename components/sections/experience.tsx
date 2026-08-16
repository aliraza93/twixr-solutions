"use client";

import { useId, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Icon } from "@iconify/react";
import { experiences } from "@/lib/data";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";

type ExperienceItem = (typeof experiences)[number];

const sortedExperiences = [...experiences].sort((a, b) => {
  if (a.period.includes("Present")) return -1;
  if (b.period.includes("Present")) return 1;
  return 0;
});

export function Experience() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const uid = useId();

  return (
    <section
      id="experience"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <ScrollReveal>
          <header className="max-w-[40rem]">
            <Eyebrow>Professional Path</Eyebrow>
            <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              Career{" "}
              <span className="text-pine">Evolution</span>
            </h2>
            <p className="mt-5 max-w-[62ch] text-[length:var(--fs-lead)] text-muted">
              A timeline of my professional growth, from early engineering roles
              to technical leadership and full-stack expertise.
            </p>
          </header>
        </ScrollReveal>

        <ScrollStagger className="list-row-stack mt-12 md:mt-16">
          <div className="list-row-stack__spine" aria-hidden />
          {sortedExperiences.map((exp, index) => (
            <ScrollRevealItem key={exp.company}>
              <ExperienceRow
                exp={exp}
                index={index}
                panelId={`${uid}-panel-${index}`}
                open={expandedIndex === index}
                onToggle={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
              />
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}

function ExperienceRow({
  exp,
  index,
  panelId,
  open,
  onToggle,
}: {
  exp: ExperienceItem;
  index: number;
  panelId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const n = String(index + 1).padStart(2, "0");

  return (
    <article className={cn("list-row", open && "is-open")}>
      <button
        type="button"
        className="list-row__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${exp.role} at ${exp.company}, ${exp.period}`}
        onClick={onToggle}
      >
        <span className="list-row__index" aria-hidden>
          {n}
        </span>

        <span className="list-row__logo" aria-hidden>
          <Icon icon={exp.logo} className="h-5 w-5" />
        </span>

        <span className="list-row__copy">
          <span className="list-row__role">{exp.role}</span>
          <span className="list-row__company">{exp.company}</span>
          <span className="list-row__meta-mobile">
            {exp.period}
            <span aria-hidden> · </span>
            {exp.location}
          </span>
        </span>

        <span className="list-row__meta">
          <span className="list-row__date">{exp.period}</span>
          <span className="list-row__place">{exp.location}</span>
        </span>

        <span className="list-row__ctrl" aria-hidden>
          <Plus className="list-row__plus" strokeWidth={1.75} />
          <ArrowRight className="list-row__arrow" strokeWidth={1.75} />
        </span>
      </button>

      <div
        id={panelId}
        className="list-row__panel"
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
      >
        <div className="list-row__panel-inner">
          <div className="list-row__detail">
            <p className="list-row__body">{exp.description}</p>
            <ul className="list-row__tags">
              {exp.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
            {exp.link !== "#" && (
              <a
                href={exp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="list-row__link"
              >
                Visit {exp.company}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
