import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureLinkedInBlogLink } from "@/lib/pipeline/generate-linkedin";
import {
  bannedPhrases,
  dashCheck,
  hashtagCheck,
  headingLevelCheck,
  titleLengthCheck,
  placeholderCheck,
  faqCompletenessCheck,
  sourcesSectionCheck,
  vagueTitleCheck,
  emptyAltCheck,
  qualityGate,
} from "@/lib/pipeline/validators";
import {
  cloudinaryAsJpeg,
  cloudinaryResponsive,
  cloudinarySrcSet,
} from "@/lib/media/cloudinary-url";
import { aspectRatioFor, inferRender } from "@/lib/pipeline/images";

describe("bannedPhrases", () => {
  it("flags known-bad marketing phrases", () => {
    const text =
      "This is a game-changer that will unlock the power of your stack.";
    const hits = bannedPhrases(text);
    assert.ok(hits.length >= 2);
    assert.ok(hits.some((h) => /game-changer/i.test(h)));
    assert.ok(hits.some((h) => /unlock the power/i.test(h)));
  });

  it("passes clean technical copy", () => {
    const text =
      "We cut the p95 from 900ms to 120ms by fixing the N+1 on the invoice list.";
    assert.deepEqual(bannedPhrases(text), []);
  });
});

describe("dashCheck", () => {
  it("fails on em dash, en dash, minus, and HTML entities", () => {
    assert.ok(dashCheck("future — how it grows").length > 0);
    assert.ok(dashCheck("range – values").length > 0);
    assert.ok(dashCheck("value − 1").length > 0);
    assert.ok(dashCheck("break &mdash; here").length > 0);
    assert.ok(dashCheck("break &ndash; here").length > 0);
  });

  it("allows spaced ASCII hyphen", () => {
    assert.deepEqual(dashCheck("future - how it grows"), []);
  });
});

describe("hashtagCheck", () => {
  // The count is drawn per post now, so with no expectation the check only
  // guards the upper bound; the planned count is what gets enforced.
  it("without an expectation, allows any count up to 6", () => {
    assert.deepEqual(hashtagCheck("Hook\n\nBody\n\n#Laravel #WebDev"), []);
    assert.deepEqual(
      hashtagCheck("Hook\n\nBody text here\n\n#Laravel #NestJS #AWS #WebDev #Upwork"),
      []
    );
    assert.ok(hashtagCheck("Hook\n\nBody\n\n#A #B #C #D #E #F #G").length > 0);
  });

  it("enforces the planned count within a drift of one", () => {
    const four = "Hook\n\nBody\n\n#A #B #C #D";
    assert.deepEqual(hashtagCheck(four, 4), []);
    assert.deepEqual(hashtagCheck(four, 5), []);
    assert.ok(hashtagCheck(four, 2).length > 0);
  });

  it("requires a bare post when the plan asked for no hashtags", () => {
    assert.deepEqual(hashtagCheck("Hook\n\nBody with no tags", 0), []);
    assert.ok(hashtagCheck("Hook\n\nBody\n\n#Laravel", 0).length > 0);
  });
});

describe("ensureLinkedInBlogLink", () => {
  const url = "https://www.twixrsolutions.com/blog/example-post";

  it("inserts the blog URL before the hashtag line", () => {
    const input =
      "Hook\n\nBody text here\n\nWhat do you think?\n\n#Laravel #NestJS #AWS #WebDev #Upwork";
    const out = ensureLinkedInBlogLink(input, url);
    assert.ok(out.includes(`Full write-up: ${url}`));
    assert.ok(out.trimEnd().endsWith("#Laravel #NestJS #AWS #WebDev #Upwork"));
    assert.deepEqual(hashtagCheck(out), []);
  });

  it("does not duplicate when the URL is already present", () => {
    const input = `Hook\n\nFull write-up: ${url}\n\n#Laravel #NestJS #AWS #WebDev #Upwork`;
    const out = ensureLinkedInBlogLink(input, url);
    assert.equal(out.split(url).length - 1, 1);
  });
});

describe("headingLevelCheck", () => {
  it("flags a body that opens with a markdown H1", () => {
    const got = headingLevelCheck("# Queued Jobs vs Scheduled Commands\n\nBody.");
    assert.equal(got.length, 1);
    assert.match(got[0], /opens with a markdown H1/);
  });

  it("flags an H1 further down the body", () => {
    assert.ok(headingLevelCheck("Intro text.\n\n# Later heading\n\nMore.").length > 0);
  });

  it("passes a body that starts at H2", () => {
    assert.deepEqual(headingLevelCheck("## The problem\n\nBody text."), []);
  });

  it("does not mistake a heading for a hashtag or an anchor", () => {
    assert.deepEqual(headingLevelCheck("Use #laravel in the tag.\n\n## Real heading"), []);
    assert.deepEqual(headingLevelCheck("### Deep heading first\n\nBody"), []);
  });
});

describe("titleLengthCheck", () => {
  it("flags a title over 60 characters", () => {
    assert.ok(titleLengthCheck("x".repeat(61)).length > 0);
  });

  it("passes a title at the limit", () => {
    assert.deepEqual(titleLengthCheck("x".repeat(60)), []);
  });
});

describe("quality gate", () => {
  it("blocks the placeholder that shipped on 2026-10-16", () => {
    const hits = placeholderCheck(
      "## Sources\nAdd the exact URLs of any vendor post you cite before publishing."
    );
    assert.ok(hits.length >= 1);
  });

  it("ignores TODO inside code samples but catches fake identifiers", () => {
    assert.deepEqual(placeholderCheck("```ts\n// TODO: remove after migration\n```"), []);
    assert.equal(placeholderCheck("model: `pinned-model-id-from-your-lock`").length, 1);
  });

  it("does not flag ordinary prose", () => {
    assert.deepEqual(
      placeholderCheck("Run the tests before you deploy. Add links between related docs. Pin the version in your lockfile."),
      []
    );
  });

  it("flags unanswered FAQs in the list and in the body", () => {
    const body = [
      "## Frequently asked questions",
      "### Is it free?",
      "Yes, it is free for every account on every plan today.",
      "### How do I set it up?",
      "### Does it work offline?",
    ].join("\n");
    const hits = faqCompletenessCheck(
      [
        { question: "Is it free?", answer: "Yes, it is free for every account on every plan today, with limits." },
        { question: "How do I set it up?", answer: "" },
      ],
      body
    );
    assert.equal(hits.filter((h) => h.startsWith("Body FAQ")).length, 2);
    assert.equal(hits.filter((h) => h.startsWith("FAQ answer")).length, 1);
  });

  it("requires a link inside a Sources section", () => {
    assert.equal(sourcesSectionCheck("## Sources\nVendor blog post.\n").length, 1);
    assert.deepEqual(sourcesSectionCheck("## Sources\n- https://laravel.com/docs\n"), []);
  });

  it("flags templated titles and empty alts", () => {
    assert.equal(vagueTitleCheck("Hype vs Reality on Whatever Everyone Is Posting").length, 1);
    assert.deepEqual(vagueTitleCheck("Laravel 13 queues: the one change worth upgrading for"), []);
    assert.equal(emptyAltCheck("![](https://x.test/a.webp)").length, 1);
  });

  it("passes a finished draft", () => {
    const hits = qualityGate(
      {
        title: "Fixing N+1 queries in a Laravel admin panel",
        excerpt: "A real fix.",
        body: "## The fix\nEager load the relation.\n\n![Engineer at a desk](https://x.test/a.webp)",
        faqs: [{ question: "Does eager loading always help?", answer: "No. It helps when you read the relation for most rows, and costs memory otherwise." }],
        sources: [],
      },
      { requiresLiveSource: false }
    );
    assert.deepEqual(hits, []);
  });
});

describe("image helpers", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/v1787601222/twixr-studio/cover.png";

  it("adds delivery transforms to Cloudinary URLs only", () => {
    assert.ok(cloudinaryResponsive(url, 1024).includes("/upload/f_auto,q_auto:good,c_limit,w_1024/v1787601222/"));
    assert.equal(cloudinaryResponsive("/og-image.png", 1024), "/og-image.png");
    assert.equal(cloudinarySrcSet("/og-image.png"), undefined);
    assert.ok(cloudinaryAsJpeg(url).includes("/upload/f_jpg,q_auto:good/"));
  });

  it("does not double-transform", () => {
    const once = cloudinaryAsJpeg(url);
    assert.equal(cloudinaryResponsive(once, 800), once);
  });

  it("maps sizes to supported aspect ratios", () => {
    assert.equal(aspectRatioFor("1280x720"), "16:9");
    assert.equal(aspectRatioFor("1200x630"), "16:9");
    assert.equal(aspectRatioFor("1080x1080"), "1:1");
    assert.equal(aspectRatioFor("1200x900"), "4:3");
    assert.equal(aspectRatioFor(undefined), undefined);
  });

  it("infers photo vs diagram from a prompt", () => {
    assert.equal(inferRender("Photo of a whiteboard with a sequence diagram"), "photo");
    assert.equal(inferRender("Sequence diagram of a webhook retry"), "diagram");
    assert.equal(inferRender("An engineer reviewing logs at night"), "photo");
  });
});
