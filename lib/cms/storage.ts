import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
}

function blobStoreId() {
  return process.env.BLOB_STORE_ID?.trim() ?? "";
}

function oidcToken() {
  return process.env.VERCEL_OIDC_TOKEN?.trim() ?? "";
}

export function canUseVercelBlob() {
  return Boolean(blobToken() || (oidcToken() && blobStoreId()));
}

/** Vercel’s filesystem is ephemeral/read-only except /tmp. */
export function canUseLocalUploads() {
  return process.env.VERCEL !== "1";
}

async function storeOnBlob(file: File, pathname: string) {
  return put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || undefined,
    ...(blobToken() ? { token: blobToken() } : {}),
    ...(blobStoreId() ? { storeId: blobStoreId() } : {}),
  });
}

async function storeLocally(file: File, pathname: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "studio");
  await mkdir(uploadsDir, { recursive: true });
  const filename = path
    .basename(pathname)
    .replace(/[^\w.\-]+/g, "-")
    .slice(0, 80);
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/studio/${encodeURIComponent(filename)}` };
}

export async function storeAdminFile(file: File, pathname: string) {
  if (canUseVercelBlob()) {
    try {
      const blob = await storeOnBlob(file, pathname);
      return { url: blob.url };
    } catch (error) {
      if (!canUseLocalUploads()) throw error;
    }
  }

  if (!canUseLocalUploads()) {
    throw new Error(
      "Connect a Vercel Blob store to this project (include Development), then pull env vars."
    );
  }

  return storeLocally(file, pathname);
}
