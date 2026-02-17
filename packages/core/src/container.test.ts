import { describe, expect, it, vi } from "vitest";
import { createServiceContainer } from "./container";

describe("createServiceContainer", () => {
  it("uses supabase adapter in supabase mode", () => {
    const container = createServiceContainer({
      FREDONBYTES_MODE: "supabase",
    } as never, {
      supabase: vi.fn(() => ({ auth: {} })),
      vendure: vi.fn(),
    });

    expect(container.mode).toBe("supabase");
  });

  it("throws when selected mode factory is missing", () => {
    expect(() =>
      createServiceContainer(
        { FREDONBYTES_MODE: "supabase" },
        { supabase: undefined as never, vendure: () => ({}) },
      ),
    ).toThrow(/supabase factory/i);
  });

  it("throws when selected vendure factory is missing", () => {
    expect(() =>
      createServiceContainer(
        { FREDONBYTES_MODE: "vendure" },
        { supabase: () => ({}), vendure: undefined as never },
      ),
    ).toThrow(/vendure factory/i);
  });
});
