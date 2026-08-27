import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureLinkedInBlogLink } from "@/lib/pipeline/generate-linkedin";
import {
  bannedPhrases,
  dashCheck,
  hashtagCheck,
} from "@/lib/pipeline/validators";

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
  it("requires 4-6 hashtags on the last non-empty line", () => {
    const tooFew = "Hook\n\nBody\n\n#Laravel #WebDev";
    assert.ok(hashtagCheck(tooFew).length > 0);

    const tooMany =
      "Hook\n\nBody\n\n#A #B #C #D #E #F #G";
    assert.ok(hashtagCheck(tooMany).length > 0);

    const ok =
      "Hook\n\nBody text here\n\n#Laravel #NestJS #AWS #WebDev #Upwork";
    assert.deepEqual(hashtagCheck(ok), []);
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
