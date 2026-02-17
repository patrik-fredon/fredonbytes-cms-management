import { runAuthContractTests } from "../../core/src/contract-tests/auth.contract";
import { createVendureServices } from "./index";

runAuthContractTests("vendure", () => {
  const services = createVendureServices({
    query: async () => ({ userId: "vendure-user-1" }),
  });

  return services.auth;
});
