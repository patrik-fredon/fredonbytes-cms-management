import { runAuthContractTests } from "../../core/src/contract-tests/auth.contract";
import { createVendureServices } from "./index";

runAuthContractTests("vendure", () => {
  const services = createVendureServices({
    query: async (document: unknown) => {
      if (document === "SignInDocument") {
        return { userId: "vendure-user-1" };
      }
      return {};
    },
  });

  return services.auth;
});
