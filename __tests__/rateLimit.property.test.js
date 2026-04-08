/**
 * Property-based tests for isRateLimited using fast-check.
 */
import * as fc from "fast-check";
import { isRateLimited } from "@/lib/rate-limit";

beforeEach(() => {
  globalThis.__ledger_rate_limit_store?.clear();
});

describe("isRateLimited - property-based", () => {
  it("never blocks the first request for any key", () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 40 }),
      fc.integer({ min: 1, max: 100 }),
      fc.integer({ min: 1000, max: 60000 }),
      (key, maxCount, windowMs) => {
        globalThis.__ledger_rate_limit_store?.clear();
        return isRateLimited(key, maxCount, windowMs) === false;
      }
    ));
  });

  it("always blocks after maxCount requests within the window", () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 40 }),
      fc.integer({ min: 1, max: 20 }),
      (key, maxCount) => {
        globalThis.__ledger_rate_limit_store?.clear();
        for (let i = 0; i < maxCount; i++) isRateLimited(key, maxCount, 60000);
        return isRateLimited(key, maxCount, 60000) === true;
      }
    ));
  });

  it("different keys never interfere with each other", () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.integer({ min: 1, max: 10 }),
      (keyA, keyB, maxCount) => {
        fc.pre(keyA !== keyB);
        globalThis.__ledger_rate_limit_store?.clear();
        // Exhaust keyA
        for (let i = 0; i < maxCount; i++) isRateLimited(keyA, maxCount, 60000);
        isRateLimited(keyA, maxCount, 60000); // blocked
        // keyB should still be free
        return isRateLimited(keyB, maxCount, 60000) === false;
      }
    ));
  });

  it("count is always non-negative after any sequence of calls", () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.integer({ min: 0, max: 15 }),
      fc.integer({ min: 1, max: 10 }),
      (key, calls, maxCount) => {
        globalThis.__ledger_rate_limit_store?.clear();
        for (let i = 0; i < calls; i++) isRateLimited(key, maxCount, 60000);
        const entry = globalThis.__ledger_rate_limit_store?.get(key);
        return !entry || (Array.isArray(entry.timestamps) && entry.timestamps.length <= calls);
      }
    ));
  });
});
