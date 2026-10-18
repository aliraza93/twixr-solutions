import {
  isConvertibleImage,
  optimizeImage,
  publicIdFromFilename,
  withExtension,
} from "@/lib/media/optimize-image";

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

export type CloudinaryUploadOptions = {
  /** Longest edge cap before upload. Default 1920. */
  maxWidth?: number;
  /** WebP quality. Default 78. */
  quality?: number;
  /** Set false to upload the bytes untouched (e.g. an original you must keep). */
  optimize?: boolean;
};

/**
 * Upload to Cloudinary. Raster images are resized and converted to WebP first
 * (see lib/media/optimize-image.ts), so nothing heavier than it needs to be
 * is ever stored. The file name becomes the public_id, which gives Google a
 * descriptive image URL instead of a random hash.
 */
export async function uploadToCloudinary(
  file: File,
  opts: CloudinaryUploadOptions = {}
): Promise<{ url: string }> {
  const creds = getCloudinaryCreds();
  if (!creds) {
    throw new Error("Cloudinary is not configured.");
  }

  let upload = file;
  if (opts.optimize !== false && isConvertibleImage(file.type)) {
    const original = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeImage(original, file.type, {
      maxWidth: opts.maxWidth,
      quality: opts.quality,
    });
    if (optimized.converted) {
      upload = new File(
        [new Uint8Array(optimized.bytes)],
        withExtension(file.name || `upload-${Date.now()}`, "webp"),
        { type: "image/webp" }
      );
    }
  }

  const body = new FormData();
  body.append("file", upload);
  body.append("folder", "twixr-studio");
  const baseId = publicIdFromFilename(upload.name || "");
  if (baseId && !/^(blob|file|image|upload)$/.test(baseId)) {
    // Signed uploads overwrite on a matching public_id, so make it unique
    // unless the name already ends in a timestamp (pipeline filenames do).
    const publicId = /-\d{10,}$/.test(baseId)
      ? baseId
      : `${baseId}-${Date.now().toString(36)}`;
    body.append("public_id", publicId);
  }

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
