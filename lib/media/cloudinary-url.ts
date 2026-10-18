/**
 * Delivery-time Cloudinary transforms. Works for every image already stored,
 * including the old 2 MB PNGs, because Cloudinary resizes and re-encodes on
 * the CDN edge.
 */
const MARKER = "/image/upload/";

function split(url: string): { head: string; tail: string } | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const at = url.indexOf(MARKER);
  if (at === -1) return null;
  const tail = url.slice(at + MARKER.length);
  const first = tail.split("/")[0] ?? "";
  // Already carries a transform segment (e.g. "f_jpg,q_auto"): leave it alone.
  if (first.includes("_") && !/^v\d+$/.test(first)) return null;
  return { head: url.slice(0, at + MARKER.length), tail };
}

export function isCloudinaryUrl(url?: string | null): boolean {
  return Boolean(url && split(url));
}

/** Responsive web delivery: modern format (WebP/AVIF), auto quality, capped width. */
export function cloudinaryResponsive(url: string, width: number): string {
  const parts = split(url);
  if (!parts) return url;
  return `${parts.head}f_auto,q_auto:good,c_limit,w_${Math.round(width)}/${parts.tail}`;
}

export const RESPONSIVE_WIDTHS = [480, 768, 1024, 1440] as const;

/** srcset string for a Cloudinary image, or undefined for any other host. */
export function cloudinarySrcSet(
  url: string,
  widths: readonly number[] = RESPONSIVE_WIDTHS
): string | undefined {
  if (!split(url)) return undefined;
  return widths.map((w) => `${cloudinaryResponsive(url, w)} ${w}w`).join(", ");
}

/**
 * JPEG copy for platforms that do not accept WebP uploads (LinkedIn's image
 * API takes JPG, PNG and GIF). Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryAsJpeg(url: string): string {
  const parts = split(url);
  if (!parts) return url;
  return `${parts.head}f_jpg,q_auto:good/${parts.tail}`;
}
