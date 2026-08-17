"use client";

import { Icon } from "@iconify/react";
import { techStack } from "@/content/tech-stack";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

const tools = techStack.tools;
type Tool = (typeof tools)[number];

const split = Math.ceil(tools.length / 2);
const row1 = tools.slice(0, split);
const row2 = tools.slice(split);

function LogoTile({
  name,
  icon,
}: {
  name: string;
  icon: string;
}) {
  return (
    <div
      title={name}
      className="group/tile flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-hairline bg-canvas transition-[transform,opacity,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5"
    >
      <Icon
        icon={icon}
        className="h-7 w-7 opacity-70 grayscale transition-[opacity,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover/tile:opacity-100 group-hover/tile:grayscale-0"
      />
      <span className="sr-only">{name}</span>
    </div>
  );
}

function LogoSet({
  items,
  hidden,
}: {
  items: readonly Tool[];
  hidden?: boolean;
}) {
  return (
    <div
      className="tech-marquee__set"
      aria-hidden={hidden || undefined}
    >
      {items.map((tool) => (
        <LogoTile key={tool.name} name={tool.name} icon={tool.icon} />
      ))}
    </div>
  );
}

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: readonly Tool[];
  reverse?: boolean;
}) {
  return (
    <div className="tech-marquee">
      <div
        className={cn(
          "tech-marquee__track",
          reverse && "tech-marquee__track--reverse"
        )}
      >
        <LogoSet items={items} />
        <LogoSet items={items} hidden />
      </div>
    </div>
  );
}

export function TechStack() {
  return (
    <section className="relative overflow-x-hidden bg-surface py-[var(--section-py)]">
      <div className="ds-container">
        <header className="max-w-[38rem]">
          <Eyebrow>{techStack.eyebrow}</Eyebrow>
          <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            {techStack.headingBefore}{" "}
            <span className="text-pine">{techStack.headingEmphasis}</span>{" "}
            {techStack.headingAfter}
          </h2>
          <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
            {techStack.lead}
          </p>
        </header>
      </div>

      <div className="tech-marquee-stack mt-12 md:mt-14">
        <MarqueeRow items={row1} />
        <MarqueeRow items={row2} reverse />
      </div>

      <div className="tech-grid ds-container mt-12">
        {tools.map((tool) => (
          <LogoTile key={tool.name} name={tool.name} icon={tool.icon} />
        ))}
      </div>
    </section>
  );
}
