import { describe, expect, it, vi } from "vitest";
import { createSupabaseServices } from "./index";

describe("createSupabaseServices", () => {
  it("calls supabase auth signInWithPassword", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    const svc = createSupabaseServices({
      auth: { signInWithPassword },
    } as never);

    await svc.auth.signIn({ email: "a@b.com", password: "x" });
    expect(signInWithPassword).toHaveBeenCalled();
  });
});
