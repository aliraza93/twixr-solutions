/**
 * Markup that has no place in a title, excerpt or FAQ: a script tag (opening
 * or closing), an inline event handler attribute (onload=, onerror=, ...) or
 * a javascript: URL. Rendering escapes these anyway (lib/security/json-ld.ts
 * and React's text escaping); this refuses them at the door as well. The body
 * is not checked here: code samples legitimately contain such text, and
 * markdown is rendered without raw HTML.
 */
const UNSAFE_MARKUP = /<\s*\/?\s*script\b|\bon[a-z]+\s*=|javascript\s*:/i;

export function hasUnsafeMarkup(text: string): boolean {
  return UNSAFE_MARKUP.test(text);
}

export const UNSAFE_MARKUP_MESSAGE = "Must not contain script tags, event handler attributes or javascript: URLs";
