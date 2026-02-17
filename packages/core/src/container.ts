export function createServiceContainer<
  TSupabaseServices,
  TVendureServices,
>(
  config: { FREDONBYTES_MODE: "supabase" | "vendure" },
  factories: {
    supabase: () => TSupabaseServices;
    vendure: () => TVendureServices;
  },
) {
  if (config.FREDONBYTES_MODE === "supabase") {
    if (!factories.supabase) {
      throw new Error("supabase factory is required");
    }

    return {
      mode: "supabase" as const,
      services: factories.supabase(),
    };
  }

  if (!factories.vendure) {
    throw new Error("vendure factory is required");
  }

  return {
    mode: "vendure" as const,
    services: factories.vendure(),
  };
}
