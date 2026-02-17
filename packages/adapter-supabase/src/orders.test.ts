import { describe, expect, it } from "vitest";
import { createOrdersService } from "./orders";

describe("orders service", () => {
  it("returns order by code", async () => {
    const svc = createOrdersService();
    await expect(svc.getByCode("ORD-1")).resolves.toMatchObject({ code: "ORD-1" });
  });
});
