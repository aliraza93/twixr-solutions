import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put, type PutBlobResult } from "@vercel/blob";

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
  return Boolean(blobToken() || (oidcToken() && blobStoreId()) || blobStoreId());
}

/** Vercel’s filesystem is ephemeral/read-only except /tmp. */
export function canUseLocalUploads() {
  return process.env.VERCEL !== "1";
}

type PutAccess = "public" | "private";

async function putWithAccess(
  pathname: string,
  body: Buffer,
  access: PutAccess,
  contentType: string
) {
  const base = {
    access,
    addRandomSuffix: true as const,
    contentType,
  };

  // On Vercel, OIDC + store id is the supported path. Never pass the
  // read-write token at the same time — a stale token wins and returns 403.
  if (blobStoreId() && (oidcToken() || process.env.VERCEL === "1")) {
    return put(pathname, body, {
      ...base,
      storeId: blobStoreId(),
      ...(oidcToken() ? { oidcToken: oidcToken() } : {}),
    });
  }

  if (blobToken()) {
    return put(pathname, body, {
      ...base,
      token: blobToken(),
    });
  }

  throw new Error(
    "Vercel Blob is not configured. Connect the store, save, and redeploy."
  );
}

async function storeOnBlob(file: File, pathname: string): Promise<PutBlobResult> {
  const body = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";
  try {
    return await putWithAccess(pathname, body, "public", contentType);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/access|public|private|forbidden/i.test(message)) throw error;
    return putWithAccess(pathname, body, "private", contentType);
  }
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
      "Connect a Vercel Blob store to this project, click Save Changes, then redeploy."
    );
  }

  return storeLocally(file, pathname);
}
