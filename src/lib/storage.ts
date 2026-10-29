import path from "path";
import fs from "fs";
import crypto from "crypto";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Persistent storage location outside temporary build output.
// Configurable via process.env.UPLOAD_DIR, falls back to /tmp on serverless (Vercel)
export const PERSISTENT_UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL
    ? path.join("/tmp", "uploads", "products")
    : path.join(process.cwd(), "uploads", "products"));

// Public upload directory for standard Next.js static asset serving
export const PUBLIC_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

export const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Ensures storage directories exist on disk.
 */
export async function ensureStorageDirectories(): Promise<void> {
  await fs.promises.mkdir(PERSISTENT_UPLOAD_DIR, { recursive: true });
  try {
    await fs.promises.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  } catch {
    // If public folder is read-only in production, fail silently;
    // Route handler serves from PERSISTENT_UPLOAD_DIR.
  }
}

/**
 * Validates file signature (magic bytes) to guarantee actual image content.
 */
export function validateImageSignature(buffer: Buffer): {
  isValid: boolean;
  detectedType: "jpeg" | "png" | "webp" | null;
} {
  if (buffer.length < 8) {
    return { isValid: false, detectedType: null };
  }

  // JPEG magic bytes: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedType: "jpeg" };
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedType: "png" };
  }

  // WebP magic bytes: RIFF at 0..3 and WEBP at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedType: "webp" };
  }

  return { isValid: false, detectedType: null };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalizedExtension?: string;
  mimeType?: string;
}

/**
 * Comprehensive server-side validation for image files:
 * 1. File size limit
 * 2. File extension validation
 * 3. MIME type validation
 * 4. Binary signature (magic bytes) inspection
 */
export function validateImageFile(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType: string
): ValidationResult {
  // 1. Size check
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(
        2
      )} MB) exceeds the maximum allowed limit of 5 MB.`,
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      error: "Uploaded file is empty (0 bytes).",
    };
  }

  // 2. Extension check
  const ext = path.extname(originalFilename || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension (${ext || "none"}). Only JPG, JPEG, and PNG images are supported.`,
    };
  }

  // 3. MIME check
  const normalizedMime = (declaredMimeType || "").toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return {
      valid: false,
      error: `Unsupported MIME type (${normalizedMime}). Only image/jpeg and image/png are supported.`,
    };
  }

  // 4. Magic bytes inspection
  const { isValid, detectedType } = validateImageSignature(buffer);
  if (!isValid || !detectedType) {
    return {
      valid: false,
      error:
        "File content does not match a valid JPG, PNG, or WebP image. The file may be corrupt or an executable disguised as an image.",
    };
  }

  // Cross-check extension and detected format
  if (detectedType === "jpeg" && ext !== ".jpg" && ext !== ".jpeg") {
    return {
      valid: false,
      error: "File extension does not match its detected JPEG content.",
    };
  }

  if (detectedType === "png" && ext !== ".png") {
    return {
      valid: false,
      error: "File extension does not match its detected PNG content.",
    };
  }

  if (detectedType === "webp" && ext !== ".webp") {
    return {
      valid: false,
      error: "File extension does not match its detected WebP content.",
    };
  }

  const normalizedExt =
    detectedType === "png" ? ".png" : detectedType === "webp" ? ".webp" : ".jpg";
  const finalMime =
    detectedType === "png"
      ? "image/png"
      : detectedType === "webp"
      ? "image/webp"
      : "image/jpeg";

  return {
    valid: true,
    normalizedExtension: normalizedExt,
    mimeType: finalMime,
  };
}

/**
 * Generates an unguessable unique filename to prevent overwrite and directory traversal attacks.
 * Uses timestamp + cryptographic random bytes.
 */
export function generateSecureFilename(extension: string): string {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString("hex");
  const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;
  return `${timestamp}-${randomHex}${cleanExt}`;
}

/**
 * Writes the image buffer to persistent storage and public directory.
 * Returns the public URL path (e.g. /uploads/products/12345-abcde.jpg).
 */
export async function saveProductImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  await ensureStorageDirectories();

  // Sanitize filename to basename only
  const safeFilename = path.basename(filename);

  // 1. Write to persistent directory
  const persistentPath = path.join(/*turbopackIgnore: true*/ PERSISTENT_UPLOAD_DIR, safeFilename);
  await fs.promises.writeFile(/*turbopackIgnore: true*/ persistentPath, buffer);

  // 2. Also write to public directory if writable (for Next.js dev server & direct static serving)
  try {
    const publicPath = path.join(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, safeFilename);
    await fs.promises.writeFile(/*turbopackIgnore: true*/ publicPath, buffer);
  } catch {
    // Non-fatal if public folder is immutable on some hosting providers
  }

  return `/uploads/products/${safeFilename}`;
}

/**
 * Reads an image file from storage securely.
 */
export async function readProductImage(
  filename: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const safeFilename = path.basename(filename);
  const ext = path.extname(safeFilename).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

  // Check persistent directory first
  const persistentPath = path.join(/*turbopackIgnore: true*/ PERSISTENT_UPLOAD_DIR, safeFilename);
  try {
    const buffer = await fs.promises.readFile(/*turbopackIgnore: true*/ persistentPath);
    return { buffer, mimeType };
  } catch {
    // Check public directory as fallback
    try {
      const publicPath = path.join(PUBLIC_UPLOAD_DIR, safeFilename);
      const buffer = await fs.promises.readFile(/*turbopackIgnore: true*/ publicPath);
      return { buffer, mimeType };
    } catch {
      return null;
    }
  }
}
