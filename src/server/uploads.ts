import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DATA_DIR } from "./db";

/**
 * Image uploads are stored in DATA_DIR/uploads and served by /api/uploads/[file].
 * (Files added to /public after a build are not served by `next start`.)
 * Swap these functions for S3, Cloudinary or Vercel Blob in production.
 */
export const UPLOAD_DIR = join(DATA_DIR, "uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_URL_PREFIX = "/api/uploads/";
export const FILE_NAME_RE = /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/;

// Detect the type from the file's bytes, not its name or the browser's claim. SVG is not accepted (it can carry scripts).
const SIGNATURES: { ext: "jpg" | "png" | "webp" | "gif"; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "gif", test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
  { ext: "webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

export const CONTENT_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as const;

export class UploadError extends Error {}

/** Saves one image and returns its URL. */
export async function saveImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError("Empty file.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name} is larger than 5 MB.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(bytes));
  if (!kind) throw new UploadError(`${file.name} is not a JPG, PNG, WebP or GIF image.`);
  const name = `${randomUUID().replace(/-/g, "")}.${kind.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, name), bytes);
  return UPLOAD_URL_PREFIX + name;
}

/** Saves every non-empty File under `field`, up to `max`. */
export async function saveImages(form: FormData, field: string, max: number): Promise<string[]> {
  const files = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > max) throw new UploadError(`You can upload up to ${max} photos.`);
  const urls: string[] = [];
  for (const f of files) urls.push(await saveImage(f));
  return urls;
}

export async function readUpload(name: string) {
  if (!FILE_NAME_RE.test(name)) return null;
  try {
    return await readFile(join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

/** Deletes uploaded files that are no longer referenced (ignores seed art and external URLs). */
export async function deleteUploads(urls: string[]) {
  for (const url of urls) {
    const name = url.startsWith(UPLOAD_URL_PREFIX) ? url.slice(UPLOAD_URL_PREFIX.length) : "";
    if (FILE_NAME_RE.test(name)) await unlink(join(UPLOAD_DIR, name)).catch(() => undefined);
  }
}
