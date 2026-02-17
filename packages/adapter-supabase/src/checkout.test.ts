import { describe, expect, it } from "vitest";
import { createCheckoutService } from "./checkout";

describe("checkout service", () => {
  it("creates order from cart", async () => {
    const svc = createCheckoutService({} as never);
    await expect(svc.placeOrder("cart-1"))
      .resolves
      .toMatchObject({ orderCode: expect.any(String) });
  });
});
