import { industries } from "@/content/industries";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

export function Industries() {
  return (
    <section className="relative overflow-x-hidden bg-surface py-[var(--section-py)]">
      <div className="ds-container">
        <ScrollReveal>
          <header className="max-w-[40rem]">
            <Eyebrow>{industries.eyebrow}</Eyebrow>
            <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
              {industries.line}
            </p>
          </header>
        </ScrollReveal>

        <ul className="mt-10 flex list-none flex-wrap gap-3 p-0">
          {industries.items.map((item) => (
            <li
              key={item}
              className="rounded-pill border border-hairline bg-canvas px-4 py-2 font-mono text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
