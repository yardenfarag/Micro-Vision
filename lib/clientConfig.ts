// Upload constraints (spec 7.1).
export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_EXT = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const PREFERRED_MIN_DIM = 512;
export const HARD_MIN_DIM = 200; // below this we reject as unreadable/too small

export const SESSION_IMAGE_PREFIX = "mv:image:"; // sessionStorage key prefix
export const SESSION_META_PREFIX = "mv:meta:";

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
