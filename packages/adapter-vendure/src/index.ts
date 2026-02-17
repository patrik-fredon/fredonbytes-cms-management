import { ProviderError } from "@fredonbytes/core";

type VendureRequest = (...args: unknown[]) => Promise<unknown>;

export function createVendureServices(client: {
  query: VendureRequest;
  mutation?: VendureRequest;
}) {
  return {
    auth: {
      async signIn(input: { email: string; password: string }) {
        try {
          const executeMutation = client.mutation ?? client.query;
          const result = await executeMutation("SignInDocument", input) as
            | { userId?: string }
            | undefined;

          return {
            userId: result?.userId ?? "vendure-user",
          };
        } catch (err) {
          throw new ProviderError(
            "VENDURE_SIGNIN_FAILED",
            `ProviderError: ${String(err)}`,
          );
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
          throw new ProviderError(
            "VENDURE_QUERY_FAILED",
            `ProviderError: ${String(err)}`,
          );
        }
      },
    },
  };
}
