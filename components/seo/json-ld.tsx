import { serializeJsonLd } from "@/lib/security/json-ld";

/**
 * Renders a JSON-LD <script> for structured data.
 * Pass a single schema.org object (already including @context, or an @graph wrapper).
 * The data carries stored and model text (titles, excerpts, FAQs), so it is
 * serialised with every <, > and & escaped; it can never close the script.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
