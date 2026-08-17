import { work } from "@/content/work";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

export function SelectedWork() {
  return (
    <section
      id="work"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <ScrollReveal>
          <header className="max-w-[40rem]">
            <Eyebrow>{work.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              {work.heading}
            </h2>
          </header>
        </ScrollReveal>

        <ScrollStagger className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3">
          {work.items.map((item) => (
            <ScrollRevealItem key={item.title} className="h-full">
              <Card variant="base" className="flex h-full flex-col">
                <h3 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {item.outcome}
                </p>
                <ul className="mt-6 flex list-none flex-wrap gap-2 p-0">
                  {item.tech.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-pill border border-hairline px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </Card>
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
