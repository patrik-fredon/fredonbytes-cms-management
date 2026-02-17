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
});
