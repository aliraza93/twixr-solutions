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
