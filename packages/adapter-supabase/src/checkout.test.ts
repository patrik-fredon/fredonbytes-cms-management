import { describe, expect, it } from "vitest";
import { createCheckoutService } from "./checkout";

function mockDbForCheckout() {
  const orders: Array<Record<string, unknown>> = [];

  return {
    orders,
    from(table: string) {
      if (table !== "orders") {
        throw new Error(`unexpected table ${table}`);
      }

      return {
        async insert(row: Record<string, unknown>) {
          orders.push(row);
          return { error: null };
        },
      };
    },
  };
}

describe("checkout service", () => {
  it("creates an order row and returns generated order code", async () => {
    const db = mockDbForCheckout();
    const svc = createCheckoutService(db as never);

    await expect(svc.placeOrder("c1"))
      .resolves
      .toMatchObject({ orderCode: expect.stringMatching(/^ORD-/) });
    expect(db.orders).toHaveLength(1);
  });
});
