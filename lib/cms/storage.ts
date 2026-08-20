import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { canUseCloudinary, uploadToCloudinary } from "@/lib/cms/cloudinary";

/** Vercel’s filesystem is ephemeral/read-only except /tmp. */
export function canUseLocalUploads() {
  return process.env.VERCEL !== "1";
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
  if (canUseCloudinary()) {
    return uploadToCloudinary(file);
  }

  if (canUseLocalUploads()) {
    return storeLocally(file, pathname);
  }

  throw new Error(
    "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on Production, then redeploy."
  );
}
