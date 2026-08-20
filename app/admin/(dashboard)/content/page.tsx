import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { FileText, Sparkles } from "lucide-react";

const CARDS = [
  {
    href: "/admin/content/site",
    title: "Site settings",
    description: "Brand, role, contact methods, nav, and proof stats.",
    icon: FileText,
  },
  {
    href: "/admin/content/hero",
    title: "Hero",
    description: "Headline, rotating words, subheading, and CTAs.",
    icon: Sparkles,
  },
];

export default function ContentHubPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Site copy"
        description="Edit the live homepage and chrome. Other sections stay in the repo."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-lg border border-hairline bg-canvas p-6 shadow-sm transition-colors hover:border-pine"
            >
              <Icon className="h-5 w-5 text-pine" />
              <h2 className="mt-4 font-sora text-xl font-bold text-ink">{card.title}</h2>
              <p className="mt-2 text-sm text-muted">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
