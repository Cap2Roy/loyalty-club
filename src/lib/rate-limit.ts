/**
 * In-memory sliding-window rate limiter.
 *
 * No Redis available, so we keep per-key counters in a module-level Map.
 * Each key tracks the window start and a request count. On each call we
 * either increment the count (if still within the window) or reset the
 * window. A periodic sweep evicts stale entries to bound memory.
 *
 * This is per-process — fine for a single-instance SQLite app. In a
 * multi-instance deployment you'd swap this for a shared store.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 min

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Returns `{ allowed: true }` when under the limit, or
 * `{ allowed: false, retryAfter }` with seconds until the window resets.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  existing.count += 1;
  if (existing.count > max) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

/** Extract a stable client identifier from the request. Falls back to IP. */
export function clientKey(req: Request, suffix: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0]!.trim() : "unknown";
  return `${ip}:${suffix}`;
}
