/**
 * Sliding-window rate limiter for Next.js API routes.
 *
 * NOTE ON SERVERLESS (Vercel): 
 * This uses a globalThis singleton which persists across requests handled 
 * by the same execution context (warm instances). However, it is NOT 
 * synchronized between different serverless instances. 
 *
 * For strict production scaling, this would require a shared store like Redis.
 */

const RATE_LIMIT_STORE_KEY = "__ledger_rate_limit_store";

// Initialize singleton store on global scope
if (!globalThis[RATE_LIMIT_STORE_KEY]) {
  globalThis[RATE_LIMIT_STORE_KEY] = new Map();
}

const store = globalThis[RATE_LIMIT_STORE_KEY];

/**
 * Returns true if the key has exceeded the maximum count in the window.
 * @param {string} key - Unique identifier (e.g., 'route:ip').
 * @param {number} max - Max requests allowed.
 * @param {number} windowMs - Window duration in ms.
 * @returns {boolean}
 */
export function isRateLimited(key, max, windowMs) {
  // Prevent accidental key collisions and runaway memory from malformed identifiers.
  const safeKey = String(key || "unknown").slice(0, 256);
  const now = Date.now();
  const entry = store.get(safeKey) || { timestamps: [] };

  // Remove timestamps outside the current window.
  const recent = entry.timestamps.filter(t => t > now - windowMs);

  if (recent.length >= max) {
    return true;
  }

  recent.push(now);
  store.set(safeKey, { timestamps: recent });
  
  // Occasional cleanup of the global map to prevent memory leaks in long-running instances
  if (store.size > 1000) {
    const cutoff = now - (windowMs * 2);
    for (const [k, v] of store.entries()) {
      if (v.timestamps.every(t => t < cutoff)) store.delete(k);
    }
  }

  return false;
}

