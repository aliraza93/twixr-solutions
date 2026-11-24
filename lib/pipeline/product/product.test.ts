import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  INVOICORA,
  isProductPillar,
  productInstructions,
  productLinkedInNote,
  screenshotsFor,
  screenshotUrl,
} from "./invoicora";
import { isProductPostDue, nextUnusedTopic, startOfWeekKarachi } from "./week";

test("the week starts Monday 00:00 in Karachi", () => {
  // Wed 18 Nov 2026, 13:00 Karachi = 08:00 UTC
  const start = startOfWeekKarachi(new Date("2026-11-18T08:00:00Z"));
  assert.equal(start.toISOString(), "2026-11-15T19:00:00.000Z"); // Mon 16 Nov 00:00 PKT
  // Sunday 23:30 Karachi still belongs to the same week
  const sunday = startOfWeekKarachi(new Date("2026-11-22T18:30:00Z"));
  assert.equal(sunday.toISOString(), "2026-11-15T19:00:00.000Z");
  // Monday 00:30 Karachi starts a new one
  const monday = startOfWeekKarachi(new Date("2026-11-22T19:30:00Z"));
  assert.equal(monday.toISOString(), "2026-11-22T19:00:00.000Z");
});

test("a product post is due once per week", () => {
  const now = new Date("2026-11-18T08:00:00Z");
  assert.equal(isProductPostDue(null, now), true);
  assert.equal(isProductPostDue(new Date("2026-11-16T05:00:00Z"), now), false); // Mon this week
  assert.equal(isProductPostDue(new Date("2026-11-14T05:00:00Z"), now), true); // last Sat
});

test("topics come from the bank in order and never repeat", () => {
  const first = nextUnusedTopic([]);
  assert.equal(first?.topic, INVOICORA.topics[0].topic);
  const second = nextUnusedTopic([INVOICORA.topics[0].topic.toUpperCase()]);
  assert.equal(second?.topic, INVOICORA.topics[1].topic);
  assert.equal(nextUnusedTopic(INVOICORA.topics.map((t) => t.topic)), undefined);
  assert.equal(new Set(INVOICORA.topics.map((t) => t.topic)).size, INVOICORA.topics.length);
});

test("product pillar detection", () => {
  assert.equal(isProductPillar("Product/Invoicora"), true);
  assert.equal(isProductPillar("Build/Laravel"), false);
});

test("every topic has real screenshot files, the cover first", () => {
  for (const t of INVOICORA.topics) {
    const shots = screenshotsFor(t.topic);
    assert.equal(shots.length, t.screenshots.length, t.topic);
    assert.ok(shots.length >= 2, t.topic);
    for (const s of shots) {
      assert.ok(existsSync(join(process.cwd(), "public/products/invoicora", s.file)), s.file);
    }
  }
  assert.equal(
    screenshotUrl(INVOICORA.screenshots[0], "https://www.twixrsolutions.com"),
    "https://www.twixrsolutions.com/products/invoicora/home-hero.jpg"
  );
});

test("writer instructions carry facts, links and one placeholder per inline shot", () => {
  const t = INVOICORA.topics[0];
  const text = productInstructions(t);
  assert.match(text, /https:\/\/www\.invoicora\.com\/create\//);
  assert.match(text, /\$9 a month/);
  assert.match(text, /exactly 2 inline image/);
  assert.match(text, /__INLINE_1__/);
  assert.match(text, /__INLINE_2__/);
  assert.doesNotMatch(text, /__INLINE_3__/);
});

test("no em or en dashes anywhere the writer reads", () => {
  const all = [
    ...INVOICORA.topics.map((t) => productInstructions(t)),
    productLinkedInNote(),
    ...INVOICORA.screenshots.map((s) => s.alt),
  ].join("\n");
  assert.doesNotMatch(all, /[–—]/);
});

// GTA6 Shorts lane
import { GTA6_SHORTS, GTA6_SHORTS_PILLAR } from "./gta6shorts";
import { isGta6PostDue } from "./gta6-lane";
import {
  companyPageText,
  productForPillar,
  productInstructions as instructionsFor,
  productLinkedInNote as linkedInNoteFor,
  screenshotsFor as imagesFor,
} from "./catalog";

test("both products resolve from their pillar", () => {
  assert.equal(productForPillar("Product/Invoicora")?.key, "invoicora");
  assert.equal(productForPillar(GTA6_SHORTS_PILLAR)?.key, "gta6shorts");
  assert.equal(productForPillar("Build/Laravel"), undefined);
});

test("every GTA6 Shorts topic has images that exist on disk", () => {
  for (const t of GTA6_SHORTS.topics) {
    const shots = imagesFor(GTA6_SHORTS_PILLAR, t.topic);
    assert.equal(shots.length, t.screenshots.length, t.topic);
    for (const s of shots) {
      assert.ok(existsSync(join(process.cwd(), "public/products/gta6shorts", s.file)), s.file);
    }
  }
  assert.equal(new Set(GTA6_SHORTS.topics.map((t) => t.topic)).size, GTA6_SHORTS.topics.length);
});

test("the GTA6 Shorts bank opens with the launch post", () => {
  assert.match(nextUnusedTopic([], GTA6_SHORTS)!.topic, /I built a GTA 6 clipping tool/);
});

test("GTA6 lane is due Mon, Wed, Fri (Karachi), once a day", () => {
  const mon = new Date("2026-11-23T06:00:00Z"); // Mon 11:00 PKT
  const tue = new Date("2026-11-24T06:00:00Z");
  const sunNightUtcMonPkt = new Date("2026-11-22T19:30:00Z"); // Mon 00:30 PKT
  assert.equal(isGta6PostDue(null, mon), true);
  assert.equal(isGta6PostDue(null, tue), false);
  assert.equal(isGta6PostDue(null, sunNightUtcMonPkt), true);
  assert.equal(isGta6PostDue(new Date("2026-11-23T02:00:00Z"), mon), false); // already today
  assert.equal(isGta6PostDue(new Date("2026-11-20T06:00:00Z"), mon), true); // last Fri
});

test("GTA6 writer text: graphics wording, rules, links, no dashes", () => {
  const text = instructionsFor(GTA6_SHORTS, GTA6_SHORTS.topics[0]);
  assert.match(text, /designed graphic \(not a screenshot\)/);
  assert.match(text, /Never promise or estimate what a reader will earn/);
  assert.match(text, /https:\/\/www\.gtasixshorts\.com\/register/);
  assert.match(text, /\$14\.99 a month/);
  const all = [
    ...GTA6_SHORTS.topics.map((t) => instructionsFor(GTA6_SHORTS, t)),
    linkedInNoteFor(GTA6_SHORTS_PILLAR),
    ...GTA6_SHORTS.screenshots.map((s) => s.alt),
  ].join("\n");
  assert.doesNotMatch(all, /[–—]/);
});

test("company page text links the blog and the product, no dashes", () => {
  const text = companyPageText(GTA6_SHORTS, {
    title: "A title — with a dash",
    excerpt: "Short excerpt.",
    url: "https://www.twixrsolutions.com/blog/x",
  });
  assert.match(text, /twixrsolutions\.com\/blog\/x/);
  assert.match(text, /gtasixshorts\.com/);
  assert.match(text, /#GTA6/);
  assert.doesNotMatch(text, /[–—]/);
  assert.ok(text.length <= 3000);
});
