import { describe, expect, it, vi } from "vitest";
import { createCatalogService } from "./catalog";

describe("catalog service", () => {
  it("returns normalized product list", async () => {
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "p1", name: "Tee", price: 2000 }],
        error: null,
      }),
    });
    const svc = createCatalogService({ from } as never);

    const result = await svc.listProducts();
    expect(result.items[0].id).toBe("p1");
    expect(result.items[0].price).toBe(2000);
  });
});
