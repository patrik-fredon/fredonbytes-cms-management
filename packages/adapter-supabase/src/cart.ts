export function createCartService(db: {
  from: (table: string) => {
    select: () => Promise<{
      data: Array<{ id: string; total: number }> | null;
      error: unknown;
    }>;
  };
}) {
  return {
    async getActiveCart(_userId: string) {
      const { data } = await db.from("carts").select();
      const cart = data?.[0] ?? { id: "unknown", total: 0 };
      return {
        id: cart.id,
        total: cart.total,
      };
    },
  };
}
