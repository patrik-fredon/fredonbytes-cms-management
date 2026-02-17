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
    return {
      mode: "supabase" as const,
      services: factories.supabase(),
    };
  }

  return {
    mode: "vendure" as const,
    services: factories.vendure(),
  };
}
