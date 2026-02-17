export function createCatalogService(db: {
  from: (table: string) => {
    select: () => Promise<{
      data: Array<{ id: string; name: string }> | null;
      error: unknown;
    }>;
  };
}) {
  return {
    async listProducts() {
      const { data } = await db.from("products").select();
      return {
        items: (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
        })),
      };
    },
  };
}
