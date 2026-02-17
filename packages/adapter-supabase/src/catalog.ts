import { ProviderError } from "@fredonbytes/core";

export function createCatalogService(db: {
  from: (table: string) => {
    select: (columns?: string) => Promise<{
      data: Array<{ id: string; name: string; price?: number }> | null;
      error: { message?: string } | null;
    }>;
  };
}) {
  return {
    async listProducts() {
      const { data, error } = await db.from("products").select("id,name,price");

      if (error) {
        throw new ProviderError(
          "SUPABASE_PRODUCTS_LIST_FAILED",
          error.message ?? "Failed to list products",
        );
      }

      return {
        items: (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price ?? 0,
        })),
      };
    },
  };
}
