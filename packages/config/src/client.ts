import { configSchema } from "./schema";

export function loadClientConfig(env: Record<string, string | undefined>) {
  const parsed = configSchema.parse(env);

  if (parsed.FREDONBYTES_MODE === "supabase") {
    return {
      FREDONBYTES_MODE: parsed.FREDONBYTES_MODE,
      SUPABASE_URL: parsed.SUPABASE_URL,
      SUPABASE_ANON_KEY: parsed.SUPABASE_ANON_KEY,
    };
  }

  return {
    FREDONBYTES_MODE: parsed.FREDONBYTES_MODE,
    VENDURE_SHOP_API_URL: parsed.VENDURE_SHOP_API_URL,
    VENDURE_CHANNEL_TOKEN: parsed.VENDURE_CHANNEL_TOKEN,
  };
}
