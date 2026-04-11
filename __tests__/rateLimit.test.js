import { isRateLimited } from "@/lib/rate-limit";

// Reset the global store before each test so tests are isolated
beforeEach(() => {
  globalThis.__ledger_rate_limit_store?.clear();
});

describe("isRateLimited", () => {
  it("allows requests under the limit", async () => {
    for (let i = 0; i < 5; i++) {
      await expect(isRateLimited("test-key", 5, 60_000)).resolves.toBe(false);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    for (let i = 0; i < 5; i++) await isRateLimited("key-a", 5, 60_000);
    await expect(isRateLimited("key-a", 5, 60_000)).resolves.toBe(true);
  });

  it("does not affect a different key", async () => {
    for (let i = 0; i < 5; i++) await isRateLimited("key-b", 5, 60_000);
    // key-c is independent
    await expect(isRateLimited("key-c", 5, 60_000)).resolves.toBe(false);
  });

  it("resets the counter after the window expires", async () => {
    const windowMs = 1000;

    // Fill up the window
    for (let i = 0; i < 5; i++) await isRateLimited("key-d", 5, windowMs);
    await expect(isRateLimited("key-d", 5, windowMs)).resolves.toBe(true);

    // Advance time past the configured window
    const store = globalThis.__ledger_rate_limit_store;
    const entry = store.get("key-d");
    store.set("key-d", {
      ...entry,
      timestamps: entry.timestamps.map(() => Date.now() - (windowMs + 10)),
    });

    await expect(isRateLimited("key-d", 5, windowMs)).resolves.toBe(false);
  });

  it("uses separate counters for analyze vs autofill routes", async () => {
    for (let i = 0; i < 5; i++) await isRateLimited("analyze:1.2.3.4", 5, 60_000);
    await expect(isRateLimited("analyze:1.2.3.4", 5, 60_000)).resolves.toBe(true);
    // autofill key is untouched
    await expect(isRateLimited("autofill:1.2.3.4", 10, 60_000)).resolves.toBe(false);
  });
});
