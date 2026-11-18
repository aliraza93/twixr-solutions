/**
 * Keeps a blog body's standalone images inside the article.
 *
 * The generator sometimes drops image placeholders, and the old fallback
 * appended them to the end of the body, so posts ended with a stack of
 * images after the last section. This moves any image that is misplaced
 * (at the very start, after the last text, inside a takeaways or summary
 * section, or directly next to another image) to an evenly spread spot in
 * the body: after a paragraph, with more text after it. Images that are
 * already well placed stay where the writer put them.
 *
 * Pure and idempotent, so it runs both when a draft is stored and when a
 * post is rendered (which fixes posts published before this existed).
 */

type BlockKind = "heading" | "image" | "text";

type Block = {
  kind: BlockKind;
  text: string;
  /** Index of the "## " section this block belongs to (-1 before the first). */
  section: number;
};

const IMAGE_LINE = /^!\[[^\]\n]*\]\([^)\n]+\)$/;
const H2 = /^##\s+/;
const LIST_OR_INDENT = /^(\s*([-*+]|\d+[.)])\s|\s{2,}\S)/;
const SKIP_SECTION = /takeaway|tl;?dr|summary|key points|faq|frequently asked/i;

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let buffer: string[] = [];
  let fence: string | null = null;
  let section = -1;

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n");
    buffer = [];
    const trimmed = text.trim();
    let kind: BlockKind = "text";
    if (/^#{1,6}\s/.test(trimmed) && !trimmed.includes("\n")) kind = "heading";
    else if (IMAGE_LINE.test(trimmed)) kind = "image";
    if (kind === "heading" && H2.test(trimmed)) section++;
    blocks.push({ kind, text: kind === "text" ? text : trimmed, section });
  };

  for (const line of lines) {
    const marker = line.trim().match(/^(```+|~~~+)/)?.[1];
    if (fence) {
      buffer.push(line);
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
        flush();
      }
      continue;
    }
    if (marker) {
      flush();
      fence = marker;
      buffer.push(line);
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    // A heading or a lone image line is always its own block.
    if (/^#{1,6}\s/.test(line.trim()) || IMAGE_LINE.test(line.trim())) {
      flush();
      buffer.push(line);
      flush();
      continue;
    }
    buffer.push(line);
  }
  flush();
  return blocks;
}

function sectionTitles(blocks: Block[]): Map<number, string> {
  const titles = new Map<number, string>();
  for (const b of blocks) {
    if (b.kind === "heading" && H2.test(b.text)) titles.set(b.section, b.text);
  }
  return titles;
}

export function arrangeBodyImages(body: string): string {
  if (!body || !body.includes("![")) return body;
  const blocks = parse(body);
  if (!blocks.some((b) => b.kind === "image")) return body;

  const titles = sectionTitles(blocks);
  const skipped = (section: number) =>
    SKIP_SECTION.test(titles.get(section) ?? "");

  const lastTextIndex = blocks.reduce(
    (last, b, i) => (b.kind === "text" ? i : last),
    -1
  );

  // Pass 1: keep well-placed images, pull out the rest (in their order).
  const kept: Block[] = [];
  const moved: Block[] = [];
  blocks.forEach((block, i) => {
    if (block.kind !== "image") {
      kept.push(block);
      return;
    }
    const prev = kept[kept.length - 1];
    const next = blocks[i + 1];
    const hasTextBefore = kept.some((b) => b.kind === "text");
    const ok =
      hasTextBefore &&
      prev !== undefined &&
      prev.kind !== "image" &&
      next !== undefined &&
      next.kind !== "image" &&
      i < lastTextIndex &&
      !skipped(block.section);
    (ok ? kept : moved).push(block);
  });

  if (moved.length === 0) return body;

  // Pass 2: candidate slots are "after this text block", where more text
  // follows and no image is already next to it.
  const lastText = kept.reduce(
    (last, b, i) => (b.kind === "text" ? i : last),
    -1
  );
  const candidates: number[] = [];
  kept.forEach((b, i) => {
    if (b.kind !== "text" || i >= lastText) return;
    if (skipped(b.section)) return;
    const next = kept[i + 1];
    if (!next || next.kind === "image") return;
    // Never split a loose list or an indented continuation.
    if (next.kind === "text" && LIST_OR_INDENT.test(next.text)) return;
    if (b.section < 0 && titles.size > 0) return; // keep the intro clean
    candidates.push(i);
  });

  const withImage = new Set(
    kept.filter((b) => b.kind === "image").map((b) => b.section)
  );
  // Prefer the first paragraph of a section that has no image yet.
  const firstOfSection: number[] = [];
  const seen = new Set<number>();
  for (const i of candidates) {
    const s = kept[i].section;
    if (seen.has(s)) continue;
    seen.add(s);
    if (!withImage.has(s)) firstOfSection.push(i);
  }
  const pool = firstOfSection.length >= moved.length ? firstOfSection : candidates;

  const chosen: number[] = [];
  if (pool.length > 0) {
    const k = Math.min(moved.length, pool.length);
    for (let j = 0; j < k; j++) {
      chosen.push(pool[Math.floor(((j + 0.5) * pool.length) / k)]);
    }
  }

  // Images with no slot (a body with almost no text) stay at the end.
  const leftover = moved.slice(chosen.length);
  const insertAfter = new Map<number, Block>();
  chosen.forEach((index, j) => insertAfter.set(index, moved[j]));

  const out: Block[] = [];
  kept.forEach((b, i) => {
    out.push(b);
    const img = insertAfter.get(i);
    if (img) out.push(img);
  });
  out.push(...leftover);

  return `${out.map((b) => b.text).join("\n\n")}\n`;
}
