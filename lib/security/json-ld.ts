/**
 * JSON for an inline <script type="application/ld+json">. JSON.stringify
 * alone lets stored or model text close the script ("</script>") or open a
 * comment ("<!--"), so every <, > and & becomes its JSON unicode escape, as
 * do U+2028 and U+2029 (line terminators in older JavaScript parsers). The
 * result is still valid JSON that parses back to the same value.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
