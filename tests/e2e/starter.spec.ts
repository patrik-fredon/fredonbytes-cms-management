import { test, expect } from "@playwright/test";

test("starter home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /fredonbytes starter/i })).toBeVisible();
});
