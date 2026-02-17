import { describe, expect, it } from "vitest";
import { createSupabaseClients } from "./client";

describe("createSupabaseClients", () => {
  it("builds server and anon clients from config", () => {
    const clients = createSupabaseClients({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });

    expect(clients.admin).toBeDefined();
    expect(clients.public).toBeDefined();
  });

  it("returns sdk-backed clients with rpc support", () => {
    const clients = createSupabaseClients({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });

    expect(typeof (clients.public as { rpc?: unknown }).rpc).toBe("function");
    expect(typeof (clients.admin as { rpc?: unknown }).rpc).toBe("function");
  });
});
