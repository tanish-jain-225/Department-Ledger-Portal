import { test, expect } from "@playwright/test";

test("home page renders and exposes auth entry points", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("#main-content");

  await expect(main.getByRole("heading", { name: /the modern ledger/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /create account/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /sign in/i })).toBeVisible();
});

test("health endpoint responds with service payload", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(600);

  const body = await response.json();
  expect(body).toHaveProperty("service", "student-ledger-portal");
  expect(body).toHaveProperty("ok");
});

test("auth pages render key forms", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: /identity join/i })).toBeVisible();
  await expect(page.getByLabel(/full name/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
});

test("legal pages are reachable", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: /terms of use/i })).toBeVisible();
});

test("home page stays responsive on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /the modern ledger/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(hasHorizontalOverflow).toBe(false);
});
