import { describe, expect, it } from "vitest";
import { loadClientConfig, loadServerConfig } from "./index";

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

describe("loadClientConfig", () => {
  it("allows supabase client config without server-only secrets", () => {
    expect(
      loadClientConfig({
        FREDONBYTES_MODE: "supabase",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_ANON_KEY: "anon",
      }),
    ).toEqual({
      FREDONBYTES_MODE: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
    });
  });

  it("never exposes server-only supabase fields", () => {
    const config = loadClientConfig({
      FREDONBYTES_MODE: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      DATABASE_URL: "postgres://localhost:5432/app",
    });

    expect("SUPABASE_SERVICE_ROLE_KEY" in config).toBe(false);
    expect("DATABASE_URL" in config).toBe(false);
  });
});
