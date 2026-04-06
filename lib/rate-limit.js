/**
 * Sliding-window rate limiter for Next.js API routes.
 *
 * Uses a globalThis singleton so the Map survives hot-reloads in dev and
 * request handling within the same serverless instance.
 *
 * NOTE: This is still an in-process store and will reset on cold starts.
 * For production scale, replace this with a persistent store such as Redis,
 * Upstash, or another cross-instance rate limit backend.
 */

// Attach to globalThis so the Map survives Next.js hot-module replacement
if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = new Map();
}

/** @type {Map<string, { timestamps: number[] }>} */
const store = globalThis.__rateLimitStore;

/**
 * Returns true if the given key has exceeded the allowed request count
 * within the rolling time window.
 *
 * @param {string} key       - Unique identifier (e.g. IP address + route).
 * @param {number} maxCount  - Maximum requests allowed per window.
 * @param {number} windowMs  - Window duration in milliseconds.
 * @returns {boolean}
 */
export function isRateLimited(key, maxCount, windowMs) {
  const now = Date.now();
    const entry = store.get(key) ?? { timestamps: [], start: now, count: 0 };
  const windowStart = now - windowMs;

  const expired = typeof entry.start === "number" && now - entry.start > windowMs;
  const timestamps = expired ? [] : entry.timestamps;
  const recentTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

  if (expired) {
    entry.start = now;
  }

  if (recentTimestamps.length >= maxCount) {
    const count = recentTimestamps.length;
    store.set(key, { timestamps: recentTimestamps, start: entry.start, count });
    return true;
  }

  recentTimestamps.push(now);
  const count = recentTimestamps.length;
  store.set(key, { timestamps: recentTimestamps, start: entry.start, count });
  return false;
}
