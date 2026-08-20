"use server";

import { requireUser } from "@/lib/cms/auth";
import { storeAdminFile } from "@/lib/cms/storage";

const MAX_BYTES = 4.5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

function asFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value !== "object") return null;
  if (!("arrayBuffer" in value) || !("size" in value) || !("name" in value)) {
    return null;
  }
  const file = value as File;
  if (!file.size) return null;
  return file;
}

export async function uploadAdminFile(formData: FormData) {
  await requireUser();

  const file = asFile(formData.get("file"));
  if (!file) {
    throw new Error("Choose a file to upload.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Files must be under 4.5 MB for this uploader.");
  }
  if (file.type && !ALLOWED.has(file.type)) {
    throw new Error("Use JPG, PNG, WebP, GIF, SVG, or PDF.");
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "-").slice(0, 80) || "upload";
  return storeAdminFile(file, `studio/${Date.now()}-${safeName}`);
}
