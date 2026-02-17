import { describe, expect, it, vi } from "vitest";
import { createVendureServices } from "./index";

describe("vendure cart mapping", () => {
  it("maps add item errors to ProviderError", async () => {
    const svc = createVendureServices({
      query: vi.fn().mockRejectedValue(new Error("500")),
    } as never);

    await expect(
      svc.cart.addItem({ cartId: "c1", variantId: "v1", quantity: 1 }),
    ).rejects.toThrow(/ProviderError/);
  });
});
