import { assertUploadFile } from "@/lib/cms/upload";

export async function uploadAdminFile(file: File): Promise<{ url: string }> {
  assertUploadFile(file);

  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: form,
  });

  const data = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!response.ok || !data?.url) {
    throw new Error(
      data?.error?.trim() || "Upload failed. You can still paste an image URL below."
    );
  }

  return { url: data.url };
}
