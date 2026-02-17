import { describe, expect, it, vi } from "vitest";
import { createCartService } from "./cart";

function mockDb() {
  const cartItems: Array<{
    cart_id: string;
    variant_id: string;
    quantity: number;
    unit_price: number;
  }> = [];

  return {
    from(table: string) {
      if (table === "carts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: "c1" }],
              error: null,
            }),
          }),
        };
      }

      if (table === "cart_items") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(async (_column: string, cartId: string) => ({
              data: cartItems.filter((item) => item.cart_id === cartId),
              error: null,
            })),
          }),
          insert: vi.fn().mockImplementation(async (row: {
            cart_id: string;
            variant_id: string;
            quantity: number;
          }) => {
            cartItems.push({
              ...row,
              unit_price: 2000,
            });
            return { error: null };
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  };
}

describe("cart service", () => {
  it("adds item and returns updated cart total", async () => {
    const svc = createCartService(mockDb() as never);

    await svc.addItem({ cartId: "c1", variantId: "v1", quantity: 2 });
    await expect(svc.getActiveCart("u1")).resolves.toMatchObject({
      id: "c1",
      total: 4000,
    });
  });
});
