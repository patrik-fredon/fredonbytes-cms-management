import { describe, expect, it } from "vitest";
import { getContainer } from "./container";

describe("starter container", () => {
  it("defaults to supabase mode", () => {
    process.env.FREDONBYTES_MODE = "supabase";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.DATABASE_URL = "postgres://localhost:5432/fredonbytes";
    expect(getContainer().mode).toBe("supabase");
  });

  it("fails fast when required supabase env is missing", () => {
    process.env.FREDONBYTES_MODE = "supabase";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.DATABASE_URL;

    expect(() => getContainer()).toThrow(/SUPABASE_URL|SUPABASE_ANON_KEY|DATABASE_URL/);
  });
});
