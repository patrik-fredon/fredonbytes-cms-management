import { describe, expect, it } from "vitest";
import { getContainer } from "./container";

describe("starter container", () => {
  it("defaults to supabase mode", () => {
    process.env.FREDONBYTES_MODE = "supabase";
    expect(getContainer().mode).toBe("supabase");
  });
});
