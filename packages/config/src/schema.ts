import { z } from "zod";

const baseSchema = z.object({
  FREDONBYTES_MODE: z.enum(["supabase", "vendure"]),
});

export const configSchema = z.discriminatedUnion("FREDONBYTES_MODE", [
  baseSchema.extend({
    FREDONBYTES_MODE: z.literal("supabase"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  }),
  baseSchema.extend({
    FREDONBYTES_MODE: z.literal("vendure"),
    VENDURE_SHOP_API_URL: z.string().url(),
    VENDURE_CHANNEL_TOKEN: z.string().min(1).default("__default_channel__"),
  }),
]);
