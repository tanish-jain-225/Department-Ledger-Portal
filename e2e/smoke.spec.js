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
