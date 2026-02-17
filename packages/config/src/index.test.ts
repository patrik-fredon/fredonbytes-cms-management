import { describe, expect, it } from "vitest";
import { loadConfig } from "./index";

describe("loadConfig", () => {
  it("requires Supabase keys in supabase mode", () => {
    expect(() => loadConfig({ FREDONBYTES_MODE: "supabase" }))
      .toThrow(/SUPABASE_URL/);
  });
});
