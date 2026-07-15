import { test, expect } from "@playwright/test";

// ── Route Guard Tests ─────────────────────────────────────────────────────────

test("unauthenticated user is redirected from /student to /", async ({ page }) => {
  await page.goto("/student");
  // Wait for client-side redirect to resolve
  await page.waitForURL("/", { timeout: 8000 });
  expect(page.url()).toMatch(/\/$/);
});

test("unauthenticated user is redirected from /faculty to /", async ({ page }) => {
  await page.goto("/faculty");
  await page.waitForURL("/", { timeout: 8000 });
  expect(page.url()).toMatch(/\/$/);
});

test("unauthenticated user is redirected from /admin to /", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL("/", { timeout: 8000 });
  expect(page.url()).toMatch(/\/$/);
});

test("unauthenticated user is redirected from /admin/requests to /", async ({ page }) => {
  await page.goto("/admin/requests");
  await page.waitForURL("/", { timeout: 8000 });
  expect(page.url()).toMatch(/\/$/);
});

// ── Accessibility Tests ───────────────────────────────────────────────────────

test("home page has a skip-to-content link that is focusable", async ({ page }) => {
  await page.goto("/");

  const skipLink = page.locator("a.skip-link");

  // 1. The element must be present in the DOM
  await expect(skipLink).toBeAttached();

  // 2. It must point to the correct landmark anchor
  await expect(skipLink).toHaveAttribute("href", "#main-content");

  // 3. It must be keyboard-focusable (the WCAG 2.1 SC 2.4.1 requirement).
  //    We focus it programmatically rather than relying on Tab-order position,
  //    which varies based on where Playwright's body.click() lands in the page.
  await skipLink.focus();
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  expect(focused).toBe("#main-content");
});

test("login page hamburger button has aria-expanded attribute", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  const hamburger = page.locator('button[aria-label="Toggle menu"]').first();
  await expect(hamburger).toHaveAttribute("aria-expanded", "false");

  await hamburger.click();
  await expect(hamburger).toHaveAttribute("aria-expanded", "true");
});

// ── Security Header Tests ─────────────────────────────────────────────────────

test("response headers include required security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  const csp = headers["content-security-policy"] || "";
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-src 'self' blob: https://*.firebaseapp.com");
  expect(csp).toContain("worker-src 'self' blob:");
});

test("CSP connect-src does not contain bare 'https:'", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"] ?? "";
  // Ensure the overly broad `https:` token is NOT present in connect-src
  const connectSrcMatch = csp.match(/connect-src([^;]*)/);
  if (connectSrcMatch) {
    // Should not have a bare `https:` (with space/end) — only specific domains
    expect(connectSrcMatch[1]).not.toMatch(/\bhttps:\s/);
  }
});

// ── Route Policy Fallback Test ────────────────────────────────────────────────

test("unregistered admin sub-path returns 404 (not silently public)", async ({ page }) => {
  // Next.js renders 404 for undefined page files — the PROTECTED_PREFIXES fallback
  // in route-policy.js is a client-side guard for dynamically-added pages.
  // This test verifies the 404 page is served rather than any authenticated content.
  const response = await page.goto("/admin/some-future-feature");
  // Should be a 404 response
  expect(response?.status()).toBe(404);
  // The custom 404 page should be shown, not admin content
  await expect(page.getByRole("heading")).not.toContainText(/admin/i);
});
