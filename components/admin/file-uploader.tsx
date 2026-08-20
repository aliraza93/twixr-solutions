"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin/fields";
import { Input } from "@/components/ui/input";
import { uploadAdminFile } from "@/app/admin/upload";
import { cn } from "@/lib/utils";

function toList(value?: string | string[]) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function FileUploader({
  name,
  label,
  hint,
  defaultValue,
  multiple = false,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | string[];
  multiple?: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(() => toList(defaultValue));
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const serialized = multiple ? urls.join("\n") : (urls[0] ?? "");

  function addUrls(next: string[]) {
    setUrls((current) => {
      const merged = multiple ? [...current, ...next] : next.slice(0, 1);
      return [...new Set(merged.filter(Boolean))];
    });
  }

  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    start(async () => {
      try {
        const uploaded: string[] = [];
        for (const file of multiple ? list : list.slice(0, 1)) {
          const data = new FormData();
          data.set("file", file);
          const result = await uploadAdminFile(data);
          uploaded.push(result.url);
        }
        addUrls(uploaded);
        toast.success(uploaded.length > 1 ? "Files uploaded" : "File uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  return (
    <Field
      label={label}
      htmlFor={name}
      hint={hint ?? "Drop files here, browse, or paste an existing URL."}
    >
      <input type="hidden" name={name} value={serialized} />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-lg border border-dashed bg-white p-4 transition-colors",
          dragging ? "border-pine bg-pine-tint" : "border-hairline-strong"
        )}
      >
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-2 py-4 text-center text-sm text-ink-soft disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-6 w-6 animate-spin text-pine" />
          ) : (
            <Upload className="h-6 w-6 text-pine" />
          )}
          <span className="font-medium text-ink">
            {pending ? "Uploading…" : "Drop files or click to browse"}
          </span>
          <span className="text-xs">JPG, PNG, WebP, GIF, SVG · 4.5 MB max</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        {urls.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {urls.map((url) => (
              <li
                key={url}
                className="flex items-center gap-3 rounded-md border border-hairline-strong bg-white p-2"
              >
                {url.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-pine-tint text-pine">
                    <ImagePlus className="h-4 w-4" />
                  </span>
                )}
                <p className="min-w-0 flex-1 truncate text-xs text-muted">{url}</p>
                <button
                  type="button"
                  className="cursor-pointer rounded p-1 text-muted hover:text-danger"
                  onClick={() => setUrls((current) => current.filter((item) => item !== url))}
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex gap-2">
          <Input
            value={urlDraft}
            placeholder="Or paste a URL"
            className="border-hairline-strong bg-white shadow-none"
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (urlDraft.trim()) {
                  addUrls([urlDraft.trim()]);
                  setUrlDraft("");
                }
              }
            }}
          />
          <button
            type="button"
            className="cursor-pointer rounded-md border border-hairline-strong bg-white px-3 text-sm font-medium text-pine hover:bg-pine-tint"
            onClick={() => {
              if (urlDraft.trim()) {
                addUrls([urlDraft.trim()]);
                setUrlDraft("");
              }
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Field>
  );
}
