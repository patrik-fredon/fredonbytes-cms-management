import { NotFoundError, ProviderError } from "@fredonbytes/core";

export function createOrdersService(db: {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: {
            id: string;
            code: string;
            status: string;
            cart_id: string;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}) {
  return {
    async getByCode(code: string) {
      const { data, error } = await db
        .from("orders")
        .select("id,code,status,cart_id")
        .eq("code", code)
        .single();

      if (error) {
        throw new ProviderError("SUPABASE_ORDER_LOOKUP_FAILED", error.message);
      }

      if (!data) {
        throw new NotFoundError("ORDER_NOT_FOUND", "Order not found");
      }

      return {
        id: data.id,
        code: data.code,
        status: data.status,
        cartId: data.cart_id,
      };
    },
  };
}
