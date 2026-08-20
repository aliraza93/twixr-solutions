export async function uploadAdminFile(file: File): Promise<{ url: string }> {
  const data = new FormData();
  data.set("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: data,
    credentials: "same-origin",
  });

  let payload: { url?: string; error?: string } = {};
  try {
    payload = (await response.json()) as { url?: string; error?: string };
  } catch {
    throw new Error("Upload failed. Try a smaller image, or paste a URL.");
  }

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Upload failed.");
  }

  return { url: payload.url };
}
