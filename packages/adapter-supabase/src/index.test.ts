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

  it("routes account profile reads through the public client", async () => {
    const publicFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "u1", email: "demo@example.com" },
            error: null,
          }),
        }),
      }),
    });

    const adminFrom = vi.fn();

    const svc = createSupabaseServices({
      public: {
        auth: {
          signInWithPassword: vi.fn(),
        },
        from: publicFrom,
      },
      admin: {
        auth: {
          signInWithPassword: vi.fn(),
        },
        from: adminFrom,
      },
    } as never);

    await svc.accounts.getProfile("u1");
    expect(publicFrom).toHaveBeenCalledWith("profiles");
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it("routes cart reads through the public client", async () => {
    const publicFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "carts") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: "c1", total: 1200 }],
            error: null,
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "u1", email: "demo@example.com" },
              error: null,
            }),
          }),
        }),
      };
    });
    const adminFrom = vi.fn();

    const svc = createSupabaseServices({
      public: {
        auth: {
          signInWithPassword: vi.fn(),
        },
        from: publicFrom,
      },
      admin: {
        auth: {
          signInWithPassword: vi.fn(),
        },
        from: adminFrom,
      },
    } as never);

    await svc.cart.getActiveCart("u1");
    expect(publicFrom).toHaveBeenCalledWith("carts");
    expect(adminFrom).not.toHaveBeenCalled();
  });
});
