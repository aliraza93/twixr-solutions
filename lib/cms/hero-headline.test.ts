import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  headlinePlainText,
  headlineToText,
  parseHeadline,
} from "@/lib/cms/hero-headline";

describe("parseHeadline", () => {
  it("marks the asterisked run as emphasis and leaves the rest plain", () => {
    const got = parseHeadline("Shipping is the easy part. **Staying up is mine.**");
    assert.equal(got.length, 1);
    const kinds = got[0].map((w) => w.kind);
    assert.deepEqual(kinds, [
      "plain", "plain", "plain", "plain", "plain",
      "emphasis", "emphasis", "emphasis", "emphasis",
    ]);
    assert.equal(got[0][5].text, "Staying");
    assert.equal(got[0][8].text, "mine.");
  });

  it("strips the markers from the word text", () => {
    const got = parseHeadline("plain **bold**").flat();
    assert.deepEqual(got.map((w) => w.text), ["plain", "bold"]);
  });

  it("handles a single emphasised word", () => {
    const got = parseHeadline("one **two** three").flat();
    assert.deepEqual(got.map((w) => w.kind), ["plain", "emphasis", "plain"]);
  });

  it("treats an unclosed marker as emphasis to the end", () => {
    const got = parseHeadline("one **two three").flat();
    assert.deepEqual(got.map((w) => w.kind), ["plain", "emphasis", "emphasis"]);
  });

  it("collapses extra whitespace and returns nothing for empty input", () => {
    assert.deepEqual(parseHeadline("  a   b  ").flat().map((w) => w.text), ["a", "b"]);
    assert.deepEqual(parseHeadline(""), []);
    assert.deepEqual(parseHeadline("   "), []);
  });
});

describe("headlineToText", () => {
  it("round-trips through parseHeadline", () => {
    const text = "Shipping is the easy part. **Staying up is mine.**";
    assert.equal(headlineToText(parseHeadline(text)), text);
  });

  it("round-trips an emphasis in the middle", () => {
    const text = "one **two three** four";
    assert.equal(headlineToText(parseHeadline(text)), text);
  });

  it("round-trips with no emphasis at all", () => {
    const text = "just plain words";
    assert.equal(headlineToText(parseHeadline(text)), text);
  });

  it("drops a retired rotating-word slot from a stored row", () => {
    const stored = [
      [
        { text: "Build", kind: "plain" as const },
        { kind: "cycle" as const, text: "" },
        { text: "Apps", kind: "plain" as const },
      ],
    ];
    assert.equal(headlineToText(stored), "Build Apps");
  });
});

describe("headlinePlainText", () => {
  it("returns the heading with no markers, for metadata", () => {
    const got = headlinePlainText(
      parseHeadline("Shipping is the easy part. **Staying up is mine.**")
    );
    assert.equal(got, "Shipping is the easy part. Staying up is mine.");
    assert.ok(!got.includes("*"));
  });
});
