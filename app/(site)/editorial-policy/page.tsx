import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  pageMetadata,
} from "@/lib/seo";
import { site } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Editorial policy",
  description:
    "How articles on this site are researched, written, reviewed, and corrected, including where AI assistance is used and where it is not.",
  path: "/editorial-policy",
});

/**
 * Editorial policy.
 *
 * This is the trust half of E-E-A-T, and it describes a process that genuinely
 * exists: the pipeline has a source-verification rule, an automated critic, a
 * validator suite, and a review queue. Disclosing AI assistance plainly is
 * fine with search engines and is worth more than pretending otherwise.
 */
export default function EditorialPolicyPage() {
  const sections: { heading: string; body: string[] }[] = [
    {
      heading: "Who writes here",
      body: [
        `Everything on this blog is published under one byline: ${site.name}, Senior Full Stack Engineer and founder of Twixr Solutions. There is no anonymous staff and no guest-post programme.`,
        "The experience behind the articles is eight years of building and running SaaS products, APIs, and internal tools for clients, mostly on Laravel, NestJS, React, Next.js, and AWS.",
      ],
    },
    {
      heading: "Where the material comes from",
      body: [
        "Technical claims come from work actually done: incidents, migrations, query plans, bills, and the decisions around them. Specifics are drawn from a written record of real projects, with client names and identifying details removed.",
        "No metric, client, date, version, price, or benchmark is published unless it is either verifiable from a cited source or something that genuinely happened on a project. Where a number cannot be verified, the claim is dropped rather than softened.",
      ],
    },
    {
      heading: "How AI is used",
      body: [
        "Drafting is assisted by large language models, and the illustrations are generated. That assistance is disclosed here rather than hidden, because the standard that matters is whether an article is accurate and useful, not which tools produced the draft.",
        "What AI does not do: it does not invent experience. The model is given only verified material to work from and is explicitly prevented from fabricating incidents, clients, or measurements. Anything it cannot ground, it is instructed to leave out.",
        "Every draft passes an automated review before publication: banned-phrase and style checks, a duplicate-topic check, link verification against a allowlist of real pages, a dead-link check on every external URL, and an independent model scoring the draft against a factual-grounding rubric. Drafts that fail are held for manual review instead of being published.",
      ],
    },
    {
      heading: "Updates and corrections",
      body: [
        "Articles are revisited over time. When one is updated the change is reflected in the visible date on the article and in its structured data, so you can tell how current it is.",
        "If something here is wrong, say so and it gets fixed or removed. Corrections to a factual claim are made in the article itself rather than quietly deleted.",
      ],
    },
    {
      heading: "Commercial relationships",
      body: [
        "Twixr Solutions sells engineering services, so articles sometimes link to the relevant service or project page. Those links are not paid placements.",
        "There are no affiliate links, no sponsored posts, and no paid product reviews on this site. When a tool is recommended it is because it was used on real work.",
      ],
    },
  ];

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            "@type": "WebPage",
            name: "Editorial policy",
            url: absoluteUrl("/editorial-policy"),
            description:
              "How articles on this site are researched, written, reviewed, and corrected.",
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Editorial policy", path: "/editorial-policy" },
          ]),
        ])}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
          Editorial policy
        </h1>
        <p className="mt-4 text-muted">
          How the writing on this site is produced, checked, and corrected.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-sora text-xl font-semibold text-ink">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted">
          Questions about any of this, or a correction to raise:{" "}
          <Link href="/contact" className="text-pine hover:underline">
            get in touch
          </Link>
          .
        </p>
      </div>
    </>
  );
}
