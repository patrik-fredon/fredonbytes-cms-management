import { describe, expect, it, vi } from "vitest";
import { createVendureServices } from "./index";

describe("createVendureServices", () => {
  it("maps API errors to ProviderError", async () => {
    const query = vi.fn().mockRejectedValue(new Error("HTTP error! status: 500"));
    const svc = createVendureServices({ query } as never);

    await expect(svc.catalog.listCollections()).rejects.toThrow(/ProviderError/);
  });

  it("routes cart add item to vendure mutation document", async () => {
    const query = vi.fn().mockResolvedValue({});
    const svc = createVendureServices({ query } as never);

    await svc.cart.addItem({ cartId: "c1", variantId: "v1", quantity: 1 });
    expect(query).toHaveBeenCalledWith("AddItemToOrderDocument", {
      cartId: "c1",
      variantId: "v1",
      quantity: 1,
    });
  });
});
