import { ProviderError } from "@fredonbytes/core";

type VendureRequest = (...args: unknown[]) => Promise<unknown>;

export function createVendureServices(client: {
  query: VendureRequest;
  mutation?: VendureRequest;
}) {
  const asProviderError = (code: string, err: unknown) =>
    new ProviderError(code, `ProviderError: ${String(err)}`);
  const mutate = client.mutation ?? client.query;

  return {
    auth: {
      async signIn(input: { email: string; password: string }) {
        try {
          const result = await mutate("SignInDocument", input) as
            | { userId?: string }
            | undefined;

          return {
            userId: result?.userId ?? "vendure-user",
          };
        } catch (err) {
          throw asProviderError("VENDURE_SIGNIN_FAILED", err);
        }
      },
      async signOut() {
        return;
      },
    },
    catalog: {
      async listCollections() {
        try {
          return await client.query("CollectionsDocument");
        } catch (err) {
          throw asProviderError("VENDURE_QUERY_FAILED", err);
        }
      },
    },
    cart: {
      async getActiveCart(userId: string) {
        try {
          const result = await client.query("ActiveOrderDocument", { userId }) as
            | { id?: string; total?: number }
            | undefined;
          return {
            id: result?.id ?? "unknown",
            total: Number(result?.total ?? 0),
          };
        } catch (err) {
          throw asProviderError("VENDURE_CART_FETCH_FAILED", err);
        }
      },
      async addItem(input: {
        cartId: string;
        variantId: string;
        quantity: number;
      }) {
        try {
          await mutate("AddItemToOrderDocument", input);
        } catch (err) {
          throw asProviderError("VENDURE_CART_ADD_FAILED", err);
        }
      },
    },
    checkout: {
      async placeOrder(cartId: string) {
        try {
          const result = await mutate("PlaceOrderDocument", { cartId }) as
            | { orderCode?: string }
            | undefined;
          return {
            orderCode: result?.orderCode ?? "UNKNOWN",
          };
        } catch (err) {
          throw asProviderError("VENDURE_CHECKOUT_FAILED", err);
        }
      },
    },
    orders: {
      async getByCode(code: string) {
        try {
          return await client.query("OrderByCodeDocument", { code });
        } catch (err) {
          throw asProviderError("VENDURE_ORDER_LOOKUP_FAILED", err);
        }
      },
    },
    accounts: {
      async getProfile(userId: string) {
        try {
          const result = await client.query("ActiveCustomerDocument", { userId }) as
            | { userId?: string; email?: string }
            | undefined;
          return {
            userId: result?.userId ?? userId,
            email: result?.email,
          };
        } catch (err) {
          throw asProviderError("VENDURE_ACCOUNT_FETCH_FAILED", err);
        }
      },
    },
  };
}
