import { describe, expect, it, vi } from "vitest";
import { createCartService } from "./cart";

describe("cart service", () => {
  it("returns active cart summary", async () => {
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "c1", total: 1200 }],
        error: null,
      }),
    });
    const svc = createCartService({ from } as never);

    const result = await svc.getActiveCart("u1");
    expect(result.id).toBe("c1");
  });
});
