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
  const dbClient = "admin" in client ? client.admin : client;

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
    catalog: createCatalogService(dbClient as never),
    cart: createCartService(dbClient as never),
    checkout: createCheckoutService(dbClient),
    orders: createOrdersService(dbClient),
    accounts: createAccountsService(dbClient),
  };
}

export { createSupabaseClients } from "./client";
