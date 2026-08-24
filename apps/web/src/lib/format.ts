const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_KB = 1024;

/** Human-readable file size, matched to the wireframe's "1.2 MB" precision. */
export function formatFileSize(bytes: number): string {
  if (bytes >= BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} KB`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Coarse relative timestamp ("2 min ago"). Takes `now` explicitly so the caller
 * decides when the clock is read — the dashboard resolves it once on the server
 * so the rendered string cannot drift between server output and hydration.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - new Date(iso).getTime());

  if (elapsed < MINUTE_MS) return "just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(elapsed / DAY_MS);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
