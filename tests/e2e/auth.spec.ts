import { test, expect } from "@playwright/test";

test.skip(process.env.RUN_E2E !== "true", "Set RUN_E2E=true to run browser flows");

test("auth sign-in flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/sign-in/);
});
