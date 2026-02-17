import { describe, expect, it } from "vitest";
import { createServiceContainer } from "./index";

describe("contracts", () => {
  it("exposes cart and checkout services through the container surface", async () => {
    const container = createServiceContainer(
      { FREDONBYTES_MODE: "supabase" },
      {
        supabase: () => ({
          cart: {
            async getActiveCart() {
              return { id: "c1", total: 1000 };
            },
            async addItem() {
              return undefined;
            },
          },
          checkout: {
            async placeOrder() {
              return { orderCode: "ORD-1" };
            },
          },
        }),
        vendure: () => ({}),
      },
    );

    await expect(container.services.cart.getActiveCart("u1")).resolves.toEqual({
      id: "c1",
      total: 1000,
    });
    await expect(container.services.checkout.placeOrder("c1")).resolves.toEqual({
      orderCode: "ORD-1",
    });
  });
});
