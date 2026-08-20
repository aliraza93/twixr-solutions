const MAX_BYTES = 4.5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

export function asUploadFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value !== "object") return null;
  if (!("arrayBuffer" in value) || !("size" in value) || !("name" in value)) {
    return null;
  }
  const file = value as File;
  if (!file.size) return null;
  return file;
}

export function assertUploadFile(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Files must be under 4.5 MB for this uploader.");
  }
  if (file.type && !ALLOWED.has(file.type)) {
    throw new Error("Use JPG, PNG, WebP, GIF, SVG, or PDF.");
  }
}

export function safeUploadName(file: File) {
  return file.name.replace(/[^\w.\-]+/g, "-").slice(0, 80) || "upload";
}

export function blobErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "Upload failed";
  if (/valid token|access denied|forbidden/i.test(raw)) {
    return "Vercel Blob denied the upload. In the store, click Save Changes (Production + Preview), then redeploy so OIDC and BLOB_STORE_ID reach the server.";
  }
  if (/oidc.*environment/i.test(raw)) {
    return "Blob OIDC is not enabled for this environment. Include Production (and Development if you upload locally) on the store connection.";
  }
  return raw.slice(0, 220);
}
