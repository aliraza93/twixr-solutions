import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";

type EmphasisStyle = "color" | "gradient" | "outline";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  emphasis?: string;
  emphasisStyle?: EmphasisStyle;
  description?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  align?: "left" | "center";
};

const emphasisClass: Record<EmphasisStyle, string> = {
  color: "text-pine",
  gradient:
    "bg-[image:var(--grad-emphasis)] bg-clip-text text-transparent",
  outline:
    "text-transparent [-webkit-text-stroke:1.5px_var(--accent)]",
};

function TitleWithEmphasis({
  title,
  emphasis,
  emphasisStyle,
}: {
  title: string;
  emphasis?: string;
  emphasisStyle: EmphasisStyle;
}) {
  if (!emphasis) return <>{title}</>;

  const mark = (word: string) => (
    <span className={emphasisClass[emphasisStyle]}>{word}</span>
  );

  const index = title.indexOf(emphasis);
  if (index === -1) {
    return (
      <>
        {title} {mark(emphasis)}
      </>
    );
  }

  return (
    <>
      {title.slice(0, index)}
      {mark(emphasis)}
      {title.slice(index + emphasis.length)}
    </>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  emphasis,
  emphasisStyle = "color",
  description,
  as: Tag = "h2",
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "flex max-w-[40rem] flex-col gap-5",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag
        className={cn(
          "font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink",
          align === "center" && "text-balance"
        )}
      >
        <TitleWithEmphasis
          title={title}
          emphasis={emphasis}
          emphasisStyle={emphasisStyle}
        />
      </Tag>
      {description && (
        <p className="max-w-[68ch] text-[length:var(--fs-lead)] text-muted">
          {description}
        </p>
      )}
    </header>
  );
}
