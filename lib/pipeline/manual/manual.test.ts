import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeManualTopic } from "@/lib/pipeline/manual/normalize-topic";
import { recommendArticleDepth } from "@/lib/pipeline/seo/depth";

describe("normalizeManualTopic", () => {
  it("requires a topic", () => {
    assert.throws(() => normalizeManualTopic({ topic: "  " }), /required/i);
  });

  it("infers Laravel pillar and news-like Timely", () => {
    const laravel = normalizeManualTopic({
      topic: "Laravel queue race conditions with transactions",
    });
    assert.equal(laravel.pillar, "Build/Laravel");
    assert.equal(laravel.requiresLiveSource, false);

    const news = normalizeManualTopic({
      topic: "Claude released a new coding model",
    });
    assert.equal(news.newsLike, true);
    assert.equal(news.requiresLiveSource, true);
    assert.equal(news.pillar, "Timely");
  });

  it("honors forceEvergreen and format override", () => {
    const evergreen = normalizeManualTopic({
      topic: "Upwork just released a new feature",
      forceEvergreen: true,
      format: "Question-led",
    });
    assert.equal(evergreen.requiresLiveSource, false);
    assert.equal(evergreen.formatHint, "Question-led");
  });
});

describe("recommendArticleDepth format override", () => {
  it("uses admin format override", () => {
    const depth = recommendArticleDepth(
      {
        topic: "Laravel deploy tips",
        angle: "",
        pillar: "Build/Laravel",
        requiresLiveSource: false,
        targetKeyword: "laravel deploy",
      },
      { formatOverride: "Checklist" }
    );
    assert.equal(depth.format, "Checklist");
  });
});
