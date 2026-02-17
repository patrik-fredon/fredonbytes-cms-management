import { loadConfig } from "@fredonbytes/config";
import { createServiceContainer } from "@fredonbytes/core";
import {
  createSupabaseClients,
  createSupabaseServices,
} from "@fredonbytes/adapter-supabase";
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
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  };
}

export function getContainer() {
  const config = loadConfig(getConfigInput());

  return createServiceContainer(config, {
    supabase: () => {
      if (config.FREDONBYTES_MODE !== "supabase") {
        throw new Error("supabase config is required");
      }

      return createSupabaseServices(createSupabaseClients(config));
    },
    vendure: () => createVendureServices({
      query: async () => ({}),
    }),
  });
}
