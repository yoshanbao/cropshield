/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Adequate for a single-instance student/local deployment (the spec explicitly
 * says avoid Redis unless necessary). LIMITATIONS: state is per-process, so it
 * resets on restart and is NOT shared across multiple instances. If this app is
 * ever horizontally scaled, replace this with a shared store.
 */

type Timestamps = number[];

const buckets = new Map<string, Timestamps>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Record an attempt for `key` and report whether it is within `limit`
 * requests per `windowMs`. Old timestamps outside the window are pruned.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = buckets.get(key) ?? [];
  // Keep only timestamps within the current window.
  const recent = existing.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    buckets.set(key, recent);
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  buckets.set(key, recent);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - recent.length),
    retryAfterSeconds: 0,
  };
}

// Occasionally prune empty buckets to bound memory. Cheap and best-effort.
export function pruneRateLimitBuckets(windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  const keys = Array.from(buckets.keys());
  for (const key of keys) {
    const times = buckets.get(key) ?? [];
    const recent = times.filter((t: number) => t > cutoff);
    if (recent.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, recent);
    }
  }
}
