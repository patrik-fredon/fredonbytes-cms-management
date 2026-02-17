import { runAuthContractTests } from "../../core/src/contract-tests/auth.contract";
import { createSupabaseServices } from "./index";

runAuthContractTests("supabase", () => {
  const services = createSupabaseServices({
    auth: {
      signInWithPassword: async () => ({
        data: { user: { id: "supabase-user-1" } },
        error: null,
      }),
    },
  });

  return services.auth;
});
