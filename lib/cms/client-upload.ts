import { upload } from "@vercel/blob/client";
import { safeUploadName } from "@/lib/cms/upload";

function uploadError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Upload failed. You can still paste an image URL below.";
}

/**
 * Browser → Vercel Blob. The server only issues a token; the file
 * never goes through the Next.js function (avoids 4.5 MB body + OIDC).
 */
export async function uploadAdminFile(file: File): Promise<{ url: string }> {
  const pathname = `studio/${safeUploadName(file)}`;
  const options = {
    handleUploadUrl: "/api/admin/upload",
    contentType: file.type || undefined,
  } as const;

  try {
    const blob = await upload(pathname, file, {
      ...options,
      access: "public",
    });
    return { url: blob.url };
  } catch (publicError) {
    try {
      const blob = await upload(pathname, file, {
        ...options,
        access: "private",
      });
      return { url: blob.downloadUrl || blob.url };
    } catch {
      throw new Error(uploadError(publicError));
    }
  }
}
