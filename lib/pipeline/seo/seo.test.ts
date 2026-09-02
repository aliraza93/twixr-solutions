import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import { assessCannibalization } from "@/lib/pipeline/seo/cannibalization";
import {
  altLooksStuffed,
  sanitizeImageAlt,
  seoImageFilename,
} from "@/lib/pipeline/seo/image-hygiene";
import { buildInternalLinkPlan } from "@/lib/pipeline/seo/internal-links";
import { assessBlogMetadata } from "@/lib/pipeline/seo/metadata";
import {
  detectContentGaps,
  expandTopicOpportunities,
  formatGapReportForPrompt,
} from "@/lib/pipeline/seo/opportunities";
import {
  formatSeoAuditText,
  runSeoLinkAudit,
} from "@/lib/pipeline/seo/audit";
import {
  depthFitWarnings,
  recommendArticleDepth,
} from "@/lib/pipeline/seo/depth";
import { formatNewsGuidanceForPrompt } from "@/lib/pipeline/seo/editorial";
import { pickBlogFormat } from "@/lib/pipeline/seo/formats";
import { buildContentGraph } from "@/lib/pipeline/seo/graph";
import { pickRelatedPosts } from "@/lib/pipeline/seo/related";
import { buildSeoReport } from "@/lib/pipeline/seo/score";
import type { InventoryItem } from "@/lib/pipeline/seo/types";
import {
  normalizeSiteUrl,
  toAbsoluteInventoryUrl,
} from "@/lib/pipeline/seo/types";
import { unknownInternalLinks } from "@/lib/pipeline/validators";

const sampleInventory: InventoryItem[] = [
  {
    type: "blog",
    path: "/blog/queued-jobs-vs-scheduled-commands-laravel",
    url: "https://www.twixrsolutions.com/blog/queued-jobs-vs-scheduled-commands-laravel",
    title: "Queued Jobs vs Scheduled Commands in Laravel",
    description: "When to use queues vs the scheduler.",
    tags: ["Laravel", "Queues"],
  },
  {
    type: "service",
    path: "/services/laravel-development",
    url: "https://www.twixrsolutions.com/services/laravel-development",
    title: "Laravel Development",
    description: "Build Laravel SaaS and APIs.",
    tags: ["Laravel", "SaaS"],
  },
  {
    type: "portfolio",
    path: "/portfolio/ai-content-automation",
    url: "https://www.twixrsolutions.com/portfolio/ai-content-automation",
    title: "AI Content Automation",
    description: "Pipeline for blog and social posts.",
    tags: ["AI", "Automation"],
  },
];

const baseDraft: BlogDraft = {
  slug: "laravel-queue-memory-tips",
  title: "How to Cut Laravel Queue Worker Memory Without Guesswork",
  excerpt:
    "Practical steps to find queue memory leaks, tune workers, and keep Horizon stable in production.",
  category: "Engineering",
  tags: ["Laravel", "Queues", "Horizon"],
  readingTime: "7 min read",
  body: `${"word ".repeat(520)}See [Laravel Development](https://www.twixrsolutions.com/services/laravel-development).`,
  faqs: [
    { question: "Q1?", answer: "A1" },
    { question: "Q2?", answer: "A2" },
    { question: "Q3?", answer: "A3" },
  ],
  coverAlt: "Laravel queue worker and job flow diagram",
  inlineImagePrompts: [
    {
      placeholder: "__INLINE_1__",
      prompt: "diagram",
      alt: "Before and after queue memory chart",
    },
  ],
  sources: [],
  primaryKeyword: "laravel queue memory",
  searchIntent: "Fix queue worker memory issues",
  contentCluster: "Laravel Queues",
};

describe("assessCannibalization", () => {
  it("blocks near-duplicate Laravel queue titles", () => {
    const result = assessCannibalization(
      {
        topic: "Queued Jobs vs Scheduled Commands in Laravel",
        targetKeyword: "laravel queued jobs vs scheduled commands",
        angle: "",
        pillar: "Build/Laravel",
      },
      sampleInventory
    );
    assert.equal(result.blocked, true);
    assert.ok(result.risk >= 0.9);
  });

  it("allows a distinct supporting topic", () => {
    const result = assessCannibalization(
      {
        topic: "Laravel queue race conditions with database transactions",
        targetKeyword: "laravel queue race conditions",
        angle: "transactions dispatching too early",
        pillar: "Build/Laravel",
      },
      sampleInventory
    );
    assert.equal(result.blocked, false);
  });
});

describe("buildInternalLinkPlan", () => {
  it("prefers relevant service and blog URLs", () => {
    const links = buildInternalLinkPlan(
      {
        topic: "Laravel queue memory usage",
        targetKeyword: "laravel queue memory",
        pillar: "Build/Laravel",
        angle: "worker memory leaks",
      },
      sampleInventory
    );
    assert.ok(links.length >= 1);
    assert.ok(
      links.every((l) => l.url.startsWith("https://www.twixrsolutions.com/"))
    );
  });
});

describe("unknownInternalLinks", () => {
  it("flags invented site paths", () => {
    const allow = new Set(sampleInventory.map((i) => normalizeSiteUrl(i.url)));
    const body =
      "See [fake](https://www.twixrsolutions.com/services/made-up) and [ok](https://www.twixrsolutions.com/services/laravel-development).";
    const reasons = unknownInternalLinks(body, allow);
    assert.ok(reasons.some((r) => /made-up/.test(r)));
    assert.ok(!reasons.some((r) => /laravel-development/.test(r)));
  });

  it("allows absolute inventory URLs", () => {
    const allow = new Set(
      sampleInventory.map((i) =>
        normalizeSiteUrl(toAbsoluteInventoryUrl(i.path))
      )
    );
    const body =
      "Read [Laravel Development](https://www.twixrsolutions.com/services/laravel-development).";
    assert.deepEqual(unknownInternalLinks(body, allow), []);
  });
});

describe("assessBlogMetadata", () => {
  it("passes a clean draft", () => {
    const result = assessBlogMetadata(baseDraft);
    assert.equal(result.ok, true);
    assert.equal(result.hardFails.length, 0);
  });

  it("hard-fails empty slug", () => {
    const result = assessBlogMetadata({ ...baseDraft, slug: "" });
    assert.equal(result.ok, false);
    assert.ok(result.hardFails.some((r) => /Slug is empty/.test(r)));
  });
});

describe("image hygiene", () => {
  it("sanitizes stuffed alts and builds filenames", () => {
    assert.ok(
      altLooksStuffed(
        "laravel seo laravel development laravel developer twixr solutions"
      )
    );
    const clean = sanitizeImageAlt(
      "laravel seo laravel development laravel developer",
      "Queue diagram"
    );
    assert.ok(clean.length <= 120);
    assert.match(
      seoImageFilename("My Post!", "cover"),
      /^my-post-cover-\d+\.png$/
    );
  });
});

describe("buildSeoReport", () => {
  it("returns a soft score out of 100", () => {
    const report = buildSeoReport({
      draft: baseDraft,
      metadata: assessBlogMetadata(baseDraft),
      imageWarnings: [],
      validatorReasons: [],
      recommendedLinks: buildInternalLinkPlan(
        {
          topic: "Laravel queue memory",
          targetKeyword: "laravel queue memory",
          pillar: "Build/Laravel",
          angle: "",
        },
        sampleInventory
      ),
      hasCover: true,
      inlineGenerated: 2,
      cannibalizationRisk: 0.2,
    });
    assert.ok(report.total >= 50 && report.total <= 100);
    assert.equal(report.max, 100);
  });
});

describe("detectContentGaps", () => {
  it("surfaces cluster gaps and commercial hints", () => {
    const gap = detectContentGaps(
      {
        topic: "Laravel queue memory tips",
        targetKeyword: "laravel queue memory",
        pillar: "Build/Laravel",
        angle: "worker RSS spikes",
      },
      sampleInventory
    );
    assert.ok(gap.cluster.length > 0);
    assert.ok(gap.missingSuggestions.length >= 1);
    assert.ok(gap.serviceHints.length >= 1);
    assert.match(formatGapReportForPrompt(gap), /CONTENT GAP CONTEXT/);
  });
});

describe("expandTopicOpportunities", () => {
  it("scores follow-up topics under 100 without inventing URLs", () => {
    const rows = expandTopicOpportunities({
      draft: baseDraft,
      brief: {
        topic: "Laravel queue memory tips",
        pillar: "Build/Laravel",
      },
      inventory: sampleInventory,
      parentSlug: baseDraft.slug,
    });
    assert.ok(rows.length >= 3);
    assert.ok(rows.every((r) => r.priority >= 0 && r.priority <= 100));
    assert.ok(rows.every((r) => r.topic.length > 10));
    assert.ok(rows[0].priority >= rows[rows.length - 1].priority);
  });
});

describe("commercial link preference", () => {
  it("can include a verified service when relevant", () => {
    const links = buildInternalLinkPlan(
      {
        topic: "Laravel SaaS queue architecture",
        targetKeyword: "laravel saas queues",
        pillar: "Build/Laravel",
        angle: "Horizon and workers",
      },
      sampleInventory,
      { preferCommercial: true }
    );
    assert.ok(links.some((l) => l.type === "service" || l.type === "blog"));
    assert.ok(
      links.every((l) =>
        sampleInventory.some((i) => i.url === l.url)
      )
    );
  });
});

describe("content graph + audit", () => {
  it("counts inbound edges and flags broken inventory misses", () => {
    const bodies = [
      {
        slug: "queued-jobs-vs-scheduled-commands-laravel",
        body: "See [Laravel Development](https://www.twixrsolutions.com/services/laravel-development) and [fake](https://www.twixrsolutions.com/services/does-not-exist).",
      },
    ];
    const graph = buildContentGraph(sampleInventory, bodies);
    assert.ok((graph.inboundByPath.get("/services/laravel-development") || 0) >= 1);
    assert.ok(graph.edges.length >= 1);

    const audit = runSeoLinkAudit({
      inventory: sampleInventory,
      graph,
      blogBodies: bodies,
    });
    assert.ok(audit.brokenCount >= 1);
    assert.ok(audit.orphanCount >= 1);
    assert.match(formatSeoAuditText(audit), /SEO audit:/);
  });
});

describe("pickRelatedPosts", () => {
  it("prefers same cluster and shared tags over unrelated", () => {
    const current = {
      slug: "a",
      title: "Laravel queue race conditions",
      excerpt: "Fix races around dispatch",
      category: "Engineering",
      tags: ["Laravel", "Queues"],
      contentCluster: "Laravel Queues",
    };
    const all = [
      {
        slug: "b",
        title: "Horizon metrics in production",
        excerpt: "Watch queue wait time",
        category: "Engineering",
        tags: ["Laravel", "Horizon"],
        contentCluster: "Laravel Queues",
        date: "2026-01-02",
        image: "",
        readingTime: "5 min read",
      },
      {
        slug: "c",
        title: "Upwork proposal templates",
        excerpt: "Freelance tips",
        category: "Business",
        tags: ["Upwork"],
        contentCluster: "Freelance",
        date: "2026-01-03",
        image: "",
        readingTime: "4 min read",
      },
    ];
    const related = pickRelatedPosts(current, all, 2);
    assert.equal(related[0]?.slug, "b");
  });
});

describe("recommendArticleDepth", () => {
  it("keeps news and code cards as short-take", () => {
    const news = recommendArticleDepth({
      topic: "New Claude model for coding",
      angle: "builder take",
      pillar: "Timely",
      requiresLiveSource: true,
      targetKeyword: "claude coding model",
    });
    assert.equal(news.level, "short-take");
    assert.equal(news.format, "Short Take");

    const deep = recommendArticleDepth({
      topic: "Laravel queue race conditions with database transactions",
      angle: "idempotency and Horizon",
      pillar: "Build/Laravel",
      requiresLiveSource: false,
      targetKeyword: "laravel queue race conditions",
    });
    assert.equal(deep.level, "deep-dive");
    assert.ok(deep.targetWordsMax >= deep.targetWordsMin);
  });

  it("flags padded bodies as soft warnings only", () => {
    const depth = recommendArticleDepth({
      topic: "Upwork profile tips",
      angle: "positioning",
      pillar: "Business/Upwork",
      requiresLiveSource: false,
      targetKeyword: "upwork profile",
    });
    const padded = "word ".repeat(depth.targetWordsMax + 400);
    const warnings = depthFitWarnings(padded, depth);
    assert.ok(warnings.some((w) => /padded/i.test(w)));
  });
});

describe("pickBlogFormat", () => {
  it("maps checklist language to Checklist format", () => {
    assert.equal(
      pickBlogFormat({
        topic: "Laravel deploy checklist",
        angle: "production steps",
        pillar: "Build/Laravel",
      }),
      "Checklist"
    );
  });
});

describe("news editorial guidance", () => {
  it("returns empty when not live-source", () => {
    assert.equal(
      formatNewsGuidanceForPrompt({
        requiresLiveSource: false,
        evergreenLinks: [],
      }),
      ""
    );
  });

  it("lists evergreen links for timely briefs", () => {
    const text = formatNewsGuidanceForPrompt({
      requiresLiveSource: true,
      evergreenLinks: [
        {
          url: "https://www.twixrsolutions.com/services/laravel-development",
          path: "/services/laravel-development",
          title: "Laravel Development",
          type: "service",
          suggestedAnchor: "Laravel Development",
          score: 0.5,
        },
      ],
    });
    assert.match(text, /NEWS \/ TIMELY/);
    assert.match(text, /Laravel Development/);
  });
});
