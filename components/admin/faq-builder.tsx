"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import type { BlogFaq } from "@/lib/blog/markdown";
import { cn } from "@/lib/utils";

type FaqBuilderProps = {
  name?: string;
  defaultValue?: BlogFaq[];
};

export function FaqBuilder({ name = "faqs", defaultValue = [] }: FaqBuilderProps) {
  const [items, setItems] = useState<BlogFaq[]>(
    defaultValue.length ? defaultValue : []
  );

  const update = (next: BlogFaq[]) => setItems(next);

  return (
    <Field
      label="FAQ"
      htmlFor="faq-builder"
      hint="Structured Q&A shown as an accordion on the post. Also used for FAQPage rich results."
    >
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-hairline bg-white p-3 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
                Q&A {index + 1}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  disabled={index === 0}
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...items];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    update(next);
                  }}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  disabled={index === items.length - 1}
                  onClick={() => {
                    if (index >= items.length - 1) return;
                    const next = [...items];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    update(next);
                  }}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive"
                  aria-label={`Remove FAQ ${index + 1}`}
                  onClick={() => update(items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <input
                id={index === 0 ? "faq-builder" : undefined}
                value={item.question}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...next[index], question: e.target.value };
                  update(next);
                }}
                placeholder="Question"
                className={cn(
                  "h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-pine"
                )}
              />
              <textarea
                value={item.answer}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...next[index], answer: e.target.value };
                  update(next);
                }}
                placeholder="Answer (markdown supported)"
                rows={3}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="w-full border border-dashed border-hairline"
          onClick={() => update([...items, { question: "", answer: "" }])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </div>
    </Field>
  );
}
