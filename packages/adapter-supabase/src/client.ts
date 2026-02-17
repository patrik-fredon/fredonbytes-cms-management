import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseClientLike = Pick<
  SupabaseClient,
  "auth" | "from"
>;

export function createSupabaseClients(cfg: {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}) {
  const sharedOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };

  const publicClient = createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    sharedOptions,
  );

  const adminClient = createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY,
    sharedOptions,
  );

  return {
    public: publicClient,
    admin: adminClient,
  };
}
