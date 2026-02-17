import { test, expect } from "@playwright/test";

test("cart page flow", async ({ page }) => {
  await page.goto("/cart");
  await expect(page).toHaveURL(/cart/);
});
