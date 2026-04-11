/**
 * Sliding-window rate limiter for Next.js API routes.
 *
 * Strategy:
 * 1) Preferred in production: shared Firestore-backed limiter via firebase-admin.
 * 2) Fallback/local: in-memory limiter for tests and local development.
 */

import { getAdminDb } from "@/lib/api-auth";

const RATE_LIMIT_STORE_KEY = "__ledger_rate_limit_store";
const SHARED_DOC_RETENTION_MS = 24 * 60 * 60 * 1000;

// Initialize singleton store on global scope
if (!globalThis[RATE_LIMIT_STORE_KEY]) {
  globalThis[RATE_LIMIT_STORE_KEY] = new Map();
}

const store = globalThis[RATE_LIMIT_STORE_KEY];

function normalizeKey(key) {
  return String(key || "unknown")
    .slice(0, 256)
    .replace(/\//g, "_");
}

function shouldUseSharedStore() {
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.RATE_LIMIT_STORE === "shared") return true;
  if (process.env.RATE_LIMIT_STORE === "memory") return false;
  return true;
}

function pruneTimestamps(timestamps, now, windowMs) {
  return (Array.isArray(timestamps) ? timestamps : []).filter((t) => Number(t) > now - windowMs);
}

function isRateLimitedLocal(safeKey, max, windowMs) {
  const now = Date.now();
  const entry = store.get(safeKey) || { timestamps: [] };

  // Remove timestamps outside the current window.
  const recent = pruneTimestamps(entry.timestamps, now, windowMs);

  if (recent.length >= max) {
    return true;
  }

  recent.push(now);
  store.set(safeKey, { timestamps: recent });

  // Occasional cleanup of the global map to prevent memory leaks in long-running instances
  if (store.size > 1000) {
    const cutoff = now - (windowMs * 2);
    for (const [k, v] of store.entries()) {
      if (v.timestamps.every((t) => t < cutoff)) store.delete(k);
    }
  }

  return false;
}

async function isRateLimitedShared(safeKey, max, windowMs) {
  const db = getAdminDb();
  const now = Date.now();
  const docRef = db.collection("rateLimits").doc(safeKey);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const current = snap.exists ? snap.data() : {};
    const recent = pruneTimestamps(current.timestamps, now, windowMs);
    const updatedAtMs = Number(current.updatedAtMs) || 0;
    const isStale = now - updatedAtMs > SHARED_DOC_RETENTION_MS;
    const limited = recent.length >= max;

    // Remove fully stale keys to keep the shared collection bounded over time.
    if (!limited && recent.length === 0 && isStale && snap.exists) {
      tx.delete(docRef);
      return false;
    }

    if (!limited) {
      recent.push(now);
    }

    tx.set(
      docRef,
      {
        timestamps: recent,
        updatedAtMs: now,
      },
      { merge: true }
    );

    return limited;
  });
}

/**
 * Returns true if the key has exceeded the maximum count in the window.
 * @param {string} key - Unique identifier (e.g., 'route:ip').
 * @param {number} max - Max requests allowed.
 * @param {number} windowMs - Window duration in ms.
 * @returns {boolean}
 */
export async function isRateLimited(key, max, windowMs) {
  const safeKey = normalizeKey(key);

  if (!shouldUseSharedStore()) {
    return isRateLimitedLocal(safeKey, max, windowMs);
  }

  try {
    return await isRateLimitedShared(safeKey, max, windowMs);
  } catch {
    // Fail-open to local limiter when shared store is unavailable.
    return isRateLimitedLocal(safeKey, max, windowMs);
  }
}

