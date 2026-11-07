import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Private local-disk image storage.
 *
 * Images are stored OUTSIDE public/ (in an uploads/ dir at the project root)
 * so they are never served as static assets. They are only readable through
 * the authorized GET /api/cases/[id]/image route, which checks ownership/role.
 *
 * NOTE ON HOSTING: local-disk storage works on a persistent server (local dev,
 * a VPS, a long-running Node host). It does NOT work on serverless/Vercel,
 * where the filesystem is ephemeral and not shared across instances. If this
 * app is later deployed to serverless hosting, this module must be swapped for
 * object storage (e.g. S3/R2). Keeping all disk access behind this small
 * module makes that a contained change.
 */

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Maps allowed MIME types to file extensions.
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

async function ensureDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Persist raw image bytes to disk and return the generated filename only.
 * The filename is a random UUID + safe extension -- the original client
 * filename is never trusted or used for the storage path.
 */
export async function saveImage(
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = MIME_EXTENSIONS[mimeType];
  if (!ext) {
    throw new Error(`Unsupported image MIME type: ${mimeType}`);
  }
  await ensureDir();
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return filename;
}

/**
 * Read an image back from disk by its stored filename.
 * Rejects any filename containing path separators or traversal sequences.
 */
export async function readImage(
  filename: string,
): Promise<{ bytes: Buffer; mimeType: string }> {
  if (!isSafeFilename(filename)) {
    throw new Error("Invalid image filename.");
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = EXTENSION_MIME[ext] ?? "application/octet-stream";
  const bytes = await fs.readFile(path.join(UPLOAD_DIR, filename));
  return { bytes, mimeType };
}

/**
 * Best-effort delete used to clean up an orphaned file when the DB write
 * that should reference it fails. Never throws.
 */
export async function deleteImage(filename: string): Promise<void> {
  if (!isSafeFilename(filename)) {
    return;
  }
  try {
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // Ignore: file may already be gone.
  }
}

/**
 * Guard against path traversal. A valid stored filename is a UUID plus a
 * known image extension, with no slashes or dot-dot sequences.
 */
export function isSafeFilename(filename: string): boolean {
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return false;
  }
  if (filename.includes("..")) {
    return false;
  }
  return /^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename);
}
