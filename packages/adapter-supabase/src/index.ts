import { AuthError } from "@fredonbytes/core";
import { createCatalogService } from "./catalog";
import { createCartService } from "./cart";
import { createCheckoutService } from "./checkout";
import { createOrdersService } from "./orders";
import { createAccountsService } from "./accounts";
import type { SupabaseClientLike } from "./client";

export function createSupabaseServices(client: {
  public: SupabaseClientLike;
  admin: SupabaseClientLike;
} | SupabaseClientLike) {
  const authClient = "public" in client ? client.public : client;
  const domainClient = "public" in client ? client.public : client;

  return {
    auth: {
      async signIn(input: { email: string; password: string }) {
        const { data, error } = await authClient.auth.signInWithPassword(input);

        if (error || !data.user) {
          throw new AuthError(
            "INVALID_CREDENTIALS",
            error?.message ?? "No user",
          );
        }

        return { userId: data.user.id };
      },
      async signOut() {
        return;
      },
    },
    catalog: createCatalogService(domainClient as never),
    cart: createCartService(domainClient as never),
    checkout: createCheckoutService(domainClient),
    orders: createOrdersService(domainClient),
    accounts: createAccountsService(domainClient),
  };
}

export { createSupabaseClients } from "./client";
