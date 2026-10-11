import type { HeroWord } from "@/lib/cms/types";

/**
 * Hero headline <-> plain text.
 *
 * The headline is stored as word objects so each word can carry the entrance
 * stagger and the pine emphasis. Editors should not have to hand-write that,
 * so the admin edits one plain string and marks the emphasised run with
 * **double asterisks**:
 *
 *   "Shipping is the easy part. **Staying up is mine.**"
 */

export function parseHeadline(text: string): HeroWord[][] {
  const words: HeroWord[] = [];
  let emphasis = false;

  for (const raw of text.split(/\s+/)) {
    if (!raw) continue;
    let token = raw;
    let opens = false;
    let closes = false;

    if (token.startsWith("**")) {
      opens = true;
      token = token.slice(2);
    }
    if (token.endsWith("**")) {
      closes = true;
      token = token.slice(0, -2);
    }
    if (opens) emphasis = true;

    if (token) {
      words.push({ text: token, kind: emphasis ? "emphasis" : "plain" });
    }
    if (closes) emphasis = false;
  }

  // One logical line; the heading wraps on its own measure.
  return words.length ? [words] : [];
}

export function headlineToText(lines: HeroWord[][]): string {
  const parts: string[] = [];
  let emphasis = false;

  for (const line of lines) {
    for (const word of line) {
      if (word.kind === "cycle" || !word.text) continue;
      const isEmphasis = word.kind === "emphasis";
      let token = word.text;
      if (isEmphasis && !emphasis) {
        token = `**${token}`;
        emphasis = true;
      }
      parts.push(token);
      if (!isEmphasis && emphasis) {
        // Close on the previous word.
        const prev = parts.length - 2;
        if (prev >= 0) parts[prev] = `${parts[prev]}**`;
        emphasis = false;
      }
    }
  }

  if (emphasis && parts.length) {
    parts[parts.length - 1] = `${parts[parts.length - 1]}**`;
  }

  return parts.join(" ");
}

/** Plain text with no markers, for the document title and metadata. */
export function headlinePlainText(lines: HeroWord[][]): string {
  return lines
    .flat()
    .filter((w) => w.kind !== "cycle" && w.text)
    .map((w) => w.text)
    .join(" ");
}
