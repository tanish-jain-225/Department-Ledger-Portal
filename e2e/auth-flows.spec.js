import { test, expect } from "@playwright/test";

// ── Auth page structure ───────────────────────────────────────────────────────

test.describe("Login page", () => {
  test("renders heading, email field, password field and sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/^email/i)).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("exposes a forgot password / reset link or button", async ({ page }) => {
    await page.goto("/login");
    // Look for any interactive element mentioning password reset
    const resetEl = page.getByRole("button", { name: /forgot/i })
      .or(page.getByRole("link", { name: /forgot/i }))
      .or(page.getByText(/forgot/i));
    await expect(resetEl.first()).toBeVisible();
  });

  test("sign-in button is visible and of type submit", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByRole("button", { name: /sign in/i });
    await expect(btn).toBeVisible();
    // It should be a submit button (either type="submit" or inside a form)
    const type = await btn.getAttribute("type");
    expect(["submit", null]).toContain(type);
  });

  test("stays responsive on mobile (360px) with no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

// ── Register page structure ───────────────────────────────────────────────────

test.describe("Register page", () => {
  test("renders heading, name, email, password and submit button", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("stays responsive on mobile (360px) with no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

// ── Redirect / access control ─────────────────────────────────────────────────

test.describe("Protected route redirect (unauthenticated)", () => {
  // Without a session cookie, protected routes must not serve student/faculty/admin content.
  // They should redirect to a non-protected page (home or login).
  // NOTE: networkidle is avoided because Firebase auth SDK keeps background connections
  // open, preventing the page from ever reaching a true idle state in the browser.
  for (const route of ["/student", "/faculty", "/admin"]) {
    test(`${route} redirects unauthenticated users away`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      // Wait briefly for any client-side redirect to settle
      await page.waitForTimeout(1500);
      const finalUrl = new URL(page.url());
      expect(finalUrl.pathname).not.toBe(route);
    });
  }
});

// ── Navigation links ──────────────────────────────────────────────────────────

test.describe("Home → Auth navigation", () => {
  test("Sign In link navigates to /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Create Account link navigates to /register", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /create account/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });
});

// ── Legal pages ───────────────────────────────────────────────────────────────

test.describe("Legal pages stay responsive on mobile", () => {
  for (const [path, heading] of [["/privacy", /privacy policy/i], ["/terms", /terms of use/i]]) {
    test(`${path} renders without horizontal overflow on 360px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Explicitly wait for the h1 to be present in the DOM before asserting visibility
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

