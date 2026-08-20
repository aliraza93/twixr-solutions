function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

type CloudinaryCreds = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function credsFromUrl(url: string): CloudinaryCreds | null {
  try {
    const parsed = new URL(url);
    const cloudName = parsed.hostname.trim();
    const apiKey = decodeURIComponent(parsed.username);
    const apiSecret = decodeURIComponent(parsed.password);
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

export function getCloudinaryCreds(): CloudinaryCreds | null {
  const fromUrl = firstEnv("CLOUDINARY_URL");
  if (fromUrl) return credsFromUrl(fromUrl);

  const cloudName = firstEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = firstEnv("CLOUDINARY_API_KEY");
  const apiSecret = firstEnv("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function canUseCloudinary() {
  return Boolean(getCloudinaryCreds());
}

export async function uploadToCloudinary(file: File): Promise<{ url: string }> {
  const creds = getCloudinaryCreds();
  if (!creds) {
    throw new Error("Cloudinary is not configured.");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("folder", "twixr-studio");

  const auth = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloudName}/auto/upload`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
      body,
    }
  );

  const data = (await response.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message?.slice(0, 220) || "Cloudinary upload failed.");
  }

  return { url: data.secure_url };
}
