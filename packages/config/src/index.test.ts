import { describe, expect, it } from "vitest";
import { loadServerConfig } from "./index";

describe("loadServerConfig", () => {
  it("requires DATABASE_URL in supabase mode", () => {
    expect(() =>
      loadServerConfig({
        FREDONBYTES_MODE: "supabase",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      }),
    ).toThrow(/DATABASE_URL/);
  });
});
