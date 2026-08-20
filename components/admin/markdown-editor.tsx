"use client";

import { parseBody } from "@/content/blog-schema";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function MarkdownEditor({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="min-h-[280px] font-mono text-sm"
      />
      <p className="text-xs text-muted">
        Supports paragraphs, <code>##</code> / <code>###</code> headings, and{" "}
        <code>-</code> lists.
      </p>
    </div>
  );
}

export function MarkdownPreview({ body }: { body: string }) {
  const blocks = parseBody(body || "");
  if (!blocks.length) {
    return <p className="text-sm text-muted">Preview will appear after you save.</p>;
  }

  return (
    <div className="space-y-3 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h3" : "h4";
          return (
            <Tag key={`${block.id}-${index}`} className="font-sora font-bold">
              {block.text}
            </Tag>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
