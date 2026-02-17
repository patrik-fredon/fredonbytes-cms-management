import { randomUUID } from "node:crypto";
import { ProviderError } from "@fredonbytes/core";

export function createCheckoutService(db: {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{
      error: { message: string } | null;
    }>;
  };
}) {
  return {
    async placeOrder(cartId: string) {
      const code = `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
      const { error } = await db.from("orders").insert({
        id: randomUUID(),
        code,
        cart_id: cartId,
        status: "Created",
      });

      if (error) {
        throw new ProviderError("SUPABASE_ORDER_CREATE_FAILED", error.message);
      }

      return { orderCode: code };
    },
  };
}
