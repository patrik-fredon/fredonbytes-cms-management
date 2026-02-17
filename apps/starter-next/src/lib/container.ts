import { loadConfig } from "@fredonbytes/config";
import { createServiceContainer } from "@fredonbytes/core";
import { createSupabaseServices } from "@fredonbytes/adapter-supabase";
import { createVendureServices } from "@fredonbytes/adapter-vendure";

function getConfigInput() {
  const mode = process.env.FREDONBYTES_MODE ?? "supabase";

  if (mode === "vendure") {
    return {
      FREDONBYTES_MODE: "vendure" as const,
      VENDURE_SHOP_API_URL: process.env.VENDURE_SHOP_API_URL
        ?? "https://readonlydemo.vendure.io/shop-api",
      VENDURE_CHANNEL_TOKEN: process.env.VENDURE_CHANNEL_TOKEN
        ?? "__default_channel__",
    };
  }

  return {
    FREDONBYTES_MODE: "supabase" as const,
    SUPABASE_URL: process.env.SUPABASE_URL ?? "https://example.supabase.co",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-key",
  };
}

export function getContainer() {
  const config = loadConfig(getConfigInput());

  return createServiceContainer(config, {
    supabase: () => createSupabaseServices({
      auth: {
        async signInWithPassword() {
          return {
            data: { user: null },
            error: { message: "Supabase auth client not configured" },
          };
        },
      },
    }),
    vendure: () => createVendureServices({
      query: async () => ({}),
    }),
  });
}
