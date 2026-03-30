/**
 * Sliding-window rate limiter for Next.js API routes.
 *
 * Uses a globalThis singleton so the Map persists across hot-reloads in dev
 * and across requests within the same serverless instance in production.
 *
 * NOTE: This is an in-process store — it resets on cold starts.
 * For multi-instance / persistent rate limiting, swap the store for
 * Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

// Attach to globalThis so the Map survives Next.js hot-module replacement
if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = new Map();
}

/** @type {Map<string, { count: number; start: number }>} */
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
  const entry = store.get(key) ?? { count: 0, start: now };

  if (now - entry.start > windowMs) {
    // Window has expired — start a fresh one
    store.set(key, { count: 1, start: now });
    return false;
  }

  if (entry.count >= maxCount) return true;

  store.set(key, { count: entry.count + 1, start: entry.start });
  return false;
}
