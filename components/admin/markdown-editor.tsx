"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TurndownService from "turndown";
import { marked } from "marked";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin/fields";
import { uploadAdminFile } from "@/lib/cms/client-upload";
import { parseBody } from "@/content/blog-schema";
import { cn } from "@/lib/utils";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

function markdownToHtml(markdown: string) {
  return String(marked.parse(markdown || "", { async: false }));
}

function htmlToMarkdown(html: string) {
  return turndown.turndown(html || "").trim();
}

function ToolbarButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-pine-tint hover:text-pine",
        active && "bg-pine text-lime"
      )}
    >
      {children}
    </button>
  );
}

export function RichEditor({
  id,
  name,
  label,
  defaultValue,
  hint,
  placeholder = "Write here…",
  minHeight = "min-h-[280px]",
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  placeholder?: string;
  minHeight?: string;
}) {
  const [markdown, setMarkdown] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: markdownToHtml(defaultValue ?? ""),
    editorProps: {
      attributes: {
        id,
        class: cn(
          "prose-admin px-3 py-3 text-sm text-ink outline-none",
          minHeight
        ),
      },
    },
    onUpdate: ({ editor: instance }) => {
      setMarkdown(htmlToMarkdown(instance.getHTML()));
    },
  });

  const insertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const result = await uploadAdminFile(file);
        editor.chain().focus().setImage({ src: result.url }).run();
        toast.success("Image inserted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  useEffect(() => {
    if (!editor) return;
    const onDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (file?.type.startsWith("image/")) {
        event.preventDefault();
        void insertImage(file);
      }
    };
    const el = editor.view.dom;
    el.addEventListener("drop", onDrop);
    return () => el.removeEventListener("drop", onDrop);
  }, [editor, insertImage]);

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint ?? "Headings, lists, links, and images. Saved as Markdown."}
    >
      <input type="hidden" name={name} value={markdown} />
      <div className="overflow-hidden rounded-lg border border-hairline-strong bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b border-hairline bg-[#f4f6f5] px-2 py-1.5">
          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="List"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={editor?.isActive("link")}
            onClick={() => {
              const href = window.prompt("Link URL", editor?.getAttributes("link").href ?? "https://");
              if (!href) return;
              editor?.chain().focus().setLink({ href }).run();
            }}
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Insert image"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </ToolbarButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void insertImage(file);
              event.target.value = "";
            }}
          />
        </div>
        <EditorContent editor={editor} />
      </div>
    </Field>
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
        if (block.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={index} src={block.src} alt={block.alt} className="rounded-md" />
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}

/** @deprecated Use RichEditor */
export const MarkdownEditor = RichEditor;
