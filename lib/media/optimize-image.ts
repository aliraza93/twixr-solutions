import sharp from "sharp";

/** Raster types we re-encode. SVG, GIF (may be animated), ICO and non-images pass through. */
const CONVERTIBLE = /^image\/(png|jpe?g|webp|avif|tiff|heic|heif)$/i;

export type OptimizeOptions = {
  /** Longest edge is capped here; smaller images are never upscaled. */
  maxWidth?: number;
  /** WebP quality, 1-100. 78 is visually lossless for photos and diagrams at web sizes. */
  quality?: number;
};

export type OptimizedImage = {
  bytes: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  /** True when the bytes were re-encoded to WebP. */
  converted: boolean;
};

export function isConvertibleImage(mimeType: string): boolean {
  return CONVERTIBLE.test(mimeType.trim());
}

/**
 * Resize and re-encode a raster image as WebP before it is stored.
 *
 * Gemini returns 1.5 to 2 MB PNGs; the same image as WebP at q78 is usually
 * 80 to 200 KB, which is the single biggest win for LCP on blog pages. sharp
 * drops input metadata (EXIF, XMP, C2PA) unless withMetadata() is called.
 * Falls back to the original bytes on any failure so an upload never breaks.
 */
export async function optimizeImage(
  bytes: Buffer,
  mimeType: string,
  opts: OptimizeOptions = {}
): Promise<OptimizedImage> {
  if (!isConvertibleImage(mimeType)) {
    return { bytes, mimeType, converted: false };
  }
  const maxWidth = opts.maxWidth ?? 1920;
  const quality = opts.quality ?? 78;
  try {
    const { data, info } = await sharp(bytes)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    // Keep the original if WebP somehow came out larger (rare, tiny PNG icons).
    if (data.length >= bytes.length && mimeType === "image/webp") {
      return { bytes, mimeType, converted: false };
    }
    return {
      bytes: data,
      mimeType: "image/webp",
      width: info.width,
      height: info.height,
      converted: true,
    };
  } catch (error) {
    console.warn(
      "optimizeImage failed, uploading original bytes:",
      error instanceof Error ? error.message : String(error)
    );
    return { bytes, mimeType, converted: false };
  }
}

/** "my-post-cover-1712.png" -> "my-post-cover-1712.webp" */
export function withExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  return `${base}.${ext}`;
}

/** A Cloudinary-safe public_id from a filename: lowercase, dashes, no extension. */
export function publicIdFromFilename(filename: string): string {
  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}
