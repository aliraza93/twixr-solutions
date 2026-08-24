"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "@/lib/utils";
import { stripEmDashes } from "@/lib/content/strip-em-dashes";

const sanitizeSchema = {
  ...defaultSchema,
  // CMS markdown is trusted — keep rehype-slug ids as-is so TOC/anchors match
  // (`#for-clients`). Default clobberPrefix (`user-content-`) broke scroll-spy.
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    h1: [...(defaultSchema.attributes?.h1 ?? []), "id"],
    h2: [...(defaultSchema.attributes?.h2 ?? []), "id"],
    h3: [...(defaultSchema.attributes?.h3 ?? []), "id"],
    h4: [...(defaultSchema.attributes?.h4 ?? []), "id"],
    h5: [...(defaultSchema.attributes?.h5 ?? []), "id"],
    h6: [...(defaultSchema.attributes?.h6 ?? []), "id"],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "className",
      "ariaHidden",
      "tabIndex",
      ["href", /^(https?:|mailto:|tel:|\/|#)/i],
    ],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      ["src", /^(https?:|\/|data:image\/)/i],
      "alt",
      "title",
      "width",
      "height",
      "loading",
    ],
  },
};

type MarkdownContentProps = {
  source: string;
  className?: string;
};

export function MarkdownContent({ source, className }: MarkdownContentProps) {
  if (!source?.trim()) return null;

  const cleaned = stripEmDashes(source);

  return (
    <div className={cn("prose-blog", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
              properties: {
                className: ["heading-anchor"],
              },
            },
          ],
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          a: ({ href, children, ...props }) => {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                {...props}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === "string" ? src : undefined}
              alt={alt || ""}
              loading="lazy"
              decoding="async"
            />
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
