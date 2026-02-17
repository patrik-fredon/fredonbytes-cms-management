import { loadConfig } from "@fredonbytes/config";
import { createServiceContainer } from "@fredonbytes/core";
import { createVendureServices } from "@fredonbytes/adapter-vendure";
import { createSupabaseServices } from "@fredonbytes/adapter-supabase";

function getConfigInput() {
  const mode = process.env.FREDONBYTES_MODE ?? "vendure";

  if (mode === "supabase") {
    return {
      FREDONBYTES_MODE: "supabase" as const,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  return {
    FREDONBYTES_MODE: "vendure" as const,
    VENDURE_SHOP_API_URL: process.env.VENDURE_SHOP_API_URL
      ?? process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL
      ?? "https://readonlydemo.vendure.io/shop-api",
    VENDURE_CHANNEL_TOKEN: process.env.VENDURE_CHANNEL_TOKEN
      ?? process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN
      ?? "__default_channel__",
  };
}

export function getServiceContainer() {
  const config = loadConfig(getConfigInput());

  return createServiceContainer(config, {
    supabase: () => createSupabaseServices({
      auth: {
        async signInWithPassword() {
          return {
            data: { user: null },
            error: { message: "Supabase client is not configured yet" },
          };
        },
      },
    }),
    vendure: () => createVendureServices({
      query: async () => ({}),
    }),
  });
}
