/**
 * Markup that has no place in a title, excerpt or FAQ: a script tag (opening
 * or closing), an event handler attribute inside a tag (<img onerror=...>),
 * or a javascript: URL in a URL position (an href or src value, or a markdown
 * link target). Ordinary prose that merely mentions "JavaScript:" or
 * "onClick=" outside a tag is fine. Rendering escapes these anyway (lib/security/json-ld.ts
 * and React's text escaping); this refuses them at the door as well. The body
 * is not checked here: code samples legitimately contain such text, and
 * markdown is rendered without raw HTML.
 */
const UNSAFE_MARKUP: RegExp[] = [
  /<\s*\/?\s*script\b/i,
  /<[^>]*\bon[a-z]+\s*=/i,
  /\b(?:href|src)\s*=\s*["']?\s*javascript\s*:/i,
  /\]\(\s*<?\s*javascript\s*:/i,
];

export function hasUnsafeMarkup(text: string): boolean {
  return UNSAFE_MARKUP.some((re) => re.test(text));
}

export const UNSAFE_MARKUP_MESSAGE = "Must not contain script tags, event handler attributes or javascript: URLs";
