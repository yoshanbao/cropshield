/**
 * Validates that uploaded bytes are actually a supported raster image by
 * inspecting the file signature (magic bytes), not trusting the client-sent
 * MIME type or filename. Rejects SVG and other document/vector types.
 *
 * Supported: JPEG, PNG, WebP. (HEIC/HEIF are intentionally excluded here
 * because they cannot be reliably distinguished by a simple signature check,
 * and the screening UI only offers JPEG/PNG/WebP.)
 */

export type DetectedImageType = "image/jpeg" | "image/png" | "image/webp";

export interface ImageValidationResult {
  ok: boolean;
  mimeType?: DetectedImageType;
  reason?: string;
}

function hasPrefix(buf: Buffer, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buf[i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Detect the true image type from the buffer's leading bytes.
 * Returns ok:false with a safe reason for anything unsupported.
 */
export function detectImageType(buf: Buffer): ImageValidationResult {
  // JPEG: FF D8 FF
  if (hasPrefix(buf, [0xff, 0xd8, 0xff])) {
    return { ok: true, mimeType: "image/jpeg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hasPrefix(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ok: true, mimeType: "image/png" };
  }
  // WebP: "RIFF" .... "WEBP"  (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    buf.length >= 12 &&
    hasPrefix(buf, [0x52, 0x49, 0x46, 0x46]) &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return { ok: true, mimeType: "image/webp" };
  }
  return {
    ok: false,
    reason: "The file is not a supported image (JPEG, PNG, or WebP).",
  };
}
