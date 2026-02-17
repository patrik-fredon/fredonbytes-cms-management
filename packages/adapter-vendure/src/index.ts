import { ProviderError } from "@fredonbytes/core";

export function createVendureServices(client: {
  query: (...args: unknown[]) => Promise<unknown>;
}) {
  return {
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
