import { test, expect } from "@playwright/test";

test.skip(process.env.RUN_E2E !== "true", "Set RUN_E2E=true to run browser flows");

test("cart page flow", async ({ page }) => {
  await page.goto("/cart");
  await expect(page).toHaveURL(/cart/);
});
