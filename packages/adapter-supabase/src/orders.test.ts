import { describe, expect, it } from "vitest";
import { createOrdersService } from "./orders";

function mockDbWithOrder() {
  return {
    from(table: string) {
      if (table !== "orders") {
        throw new Error(`unexpected table ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  return {
                    data: {
                      id: "o1",
                      code: "ORD-1",
                      status: "Created",
                      cart_id: "c1",
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("orders service", () => {
  it("returns persisted order row by code", async () => {
    const svc = createOrdersService(mockDbWithOrder() as never);
    await expect(svc.getByCode("ORD-1"))
      .resolves
      .toMatchObject({ code: "ORD-1", status: "Created", cartId: "c1" });
  });
});
