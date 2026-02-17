import { test, expect } from "@playwright/test";

test("auth sign-in flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/sign-in/);
});
