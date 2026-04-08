import { isRateLimited } from "@/lib/rate-limit";

// Reset the global store before each test so tests are isolated
beforeEach(() => {
  globalThis.__ledger_rate_limit_store?.clear();
});

describe("isRateLimited", () => {
  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited("test-key", 5, 60_000)).toBe(false);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 5; i++) isRateLimited("key-a", 5, 60_000);
    expect(isRateLimited("key-a", 5, 60_000)).toBe(true);
  });

  it("does not affect a different key", () => {
    for (let i = 0; i < 5; i++) isRateLimited("key-b", 5, 60_000);
    // key-c is independent
    expect(isRateLimited("key-c", 5, 60_000)).toBe(false);
  });

  it("resets the counter after the window expires", () => {
    // Fill up the window
    for (let i = 0; i < 5; i++) isRateLimited("key-d", 5, 1);
    expect(isRateLimited("key-d", 5, 1)).toBe(true);

    // Advance time past the 1ms window
    const store = globalThis.__ledger_rate_limit_store;
    const entry = store.get("key-d");
    store.set("key-d", {
      ...entry,
      timestamps: entry.timestamps.map(() => Date.now() - 10),
    });

    expect(isRateLimited("key-d", 5, 1)).toBe(false);
  });

  it("uses separate counters for analyze vs autofill routes", () => {
    for (let i = 0; i < 5; i++) isRateLimited("analyze:1.2.3.4", 5, 60_000);
    expect(isRateLimited("analyze:1.2.3.4", 5, 60_000)).toBe(true);
    // autofill key is untouched
    expect(isRateLimited("autofill:1.2.3.4", 10, 60_000)).toBe(false);
  });
});
