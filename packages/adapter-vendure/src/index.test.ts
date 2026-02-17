import { describe, expect, it, vi } from "vitest";
import { createVendureServices } from "./index";

describe("createVendureServices", () => {
  it("uses mutation operation for sign in when mutation client is available", async () => {
    const query = vi.fn();
    const mutation = vi.fn().mockResolvedValue({ userId: "u1" });
    const svc = createVendureServices({ query, mutation } as never);

    const result = await svc.auth.signIn({
      email: "test@example.com",
      password: "secret",
    });

    expect(result.userId).toBe("u1");
    expect(mutation).toHaveBeenCalledWith("SignInDocument", {
      email: "test@example.com",
      password: "secret",
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("maps API errors to ProviderError", async () => {
    const query = vi.fn().mockRejectedValue(new Error("HTTP error! status: 500"));
    const svc = createVendureServices({ query } as never);

    await expect(svc.catalog.listCollections()).rejects.toThrow(/ProviderError/);
  });

  it("uses mutation operation for sign in writes", async () => {
    const query = vi.fn().mockResolvedValue({});
    const mutation = vi.fn().mockResolvedValue({ userId: "u1" });
    const svc = createVendureServices({ query, mutation } as never);

    await expect(
      svc.auth.signIn({ email: "user@example.com", password: "secret" }),
    ).resolves.toEqual({ userId: "u1" });

    expect(mutation).toHaveBeenCalledWith("SignInDocument", {
      email: "user@example.com",
      password: "secret",
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("uses mutation operation for add item writes", async () => {
    const query = vi.fn().mockResolvedValue({});
    const mutation = vi.fn().mockResolvedValue({});
    const svc = createVendureServices({ query, mutation } as never);

    await svc.cart.addItem({ cartId: "c1", variantId: "v1", quantity: 1 });
    expect(mutation).toHaveBeenCalledWith("AddItemToOrderDocument", {
      cartId: "c1",
      variantId: "v1",
      quantity: 1,
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("uses mutation operation for place order writes", async () => {
    const query = vi.fn().mockResolvedValue({});
    const mutation = vi.fn().mockResolvedValue({ orderCode: "ORD-1" });
    const svc = createVendureServices({ query, mutation } as never);

    await expect(svc.checkout.placeOrder("c1")).resolves.toEqual({
      orderCode: "ORD-1",
    });

    expect(mutation).toHaveBeenCalledWith("PlaceOrderDocument", { cartId: "c1" });
    expect(query).not.toHaveBeenCalled();
  });
});
