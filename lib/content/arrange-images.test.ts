import assert from "node:assert/strict";
import { test } from "node:test";
import { arrangeBodyImages } from "./arrange-images";

const img = (n: number) => `![Visual ${n}](https://res.cloudinary.com/x/image/upload/v1/p${n}.png)`;

/** One letter per block: H heading, I image, T text. */
function shape(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (b.startsWith("#") ? "H" : b.startsWith("![") ? "I" : "T"))
    .join("");
}

const article = (tail: string) =>
  [
    "Intro paragraph.",
    "## Key takeaways",
    "- one\n- two",
    "## First section",
    "Para 1a.",
    "Para 1b.",
    "## Second section",
    "Para 2a.",
    "```bash\naws rds describe-db-instances \\\n\n  --query x\n```",
    "Para 2b.",
    "## Third section",
    "Para 3a.",
    "Para 3b.",
    "## Last section",
    "Closing paragraph.",
    tail,
  ].join("\n\n");

test("images stuck after the last section move into the body", () => {
  const out = arrangeBodyImages(article(`${img(1)}\n\n${img(2)}`));
  const s = shape(out);
  assert.ok(!s.endsWith("I"), `ends with an image: ${s}`);
  assert.ok(!s.includes("II"), `stacked images: ${s}`);
  assert.equal((s.match(/I/g) ?? []).length, 2);
  // Never inside the takeaways section (the 2nd block group).
  assert.ok(s.startsWith("THTH"), s);
});

test("a stack of images is spread out, one stays", () => {
  const body = [
    "Intro.",
    "## A",
    "Text a1.",
    img(1),
    img(2),
    img(3),
    img(4),
    "Text a2.",
    "## B",
    "Text b1.",
    "Text b2.",
    "## C",
    "Text c1.",
    "Text c2.",
    "## D",
    "Text d1.",
    "Text d2.",
  ].join("\n\n");
  const s = shape(arrangeBodyImages(body));
  assert.ok(!s.includes("II"), s);
  assert.equal((s.match(/I/g) ?? []).length, 4);
});

test("well placed images stay exactly where they are", () => {
  const body = article("").replace("Para 1a.", `Para 1a.\n\n${img(1)}`);
  assert.equal(arrangeBodyImages(body), body);
});

test("code fences and lists are never split", () => {
  const body = [
    "Intro.",
    "## A",
    "Lead in.",
    "- item one",
    "- item two",
    "```js\nconst a = 1;\n\nconst b = 2;\n```",
    "Text after.",
    "More text.",
    img(1),
  ].join("\n\n");
  const out = arrangeBodyImages(body);
  assert.ok(out.includes("```js\nconst a = 1;\n\nconst b = 2;\n```"));
  assert.ok(!/item one\n\n!\[/.test(out));
  assert.ok(!out.trim().endsWith(")"), out);
});

test("idempotent, and a body without images is untouched", () => {
  const once = arrangeBodyImages(article(`${img(1)}\n\n${img(2)}\n\n${img(3)}`));
  assert.equal(arrangeBodyImages(once), once);
  const plain = article("");
  assert.equal(arrangeBodyImages(plain), plain);
});

test("inline images inside a sentence are left alone", () => {
  const body = `Intro.\n\n## A\n\nSee ${img(1)} here.\n\nEnd.`;
  assert.equal(arrangeBodyImages(body), body);
});
