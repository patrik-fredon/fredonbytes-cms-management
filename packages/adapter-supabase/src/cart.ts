import { ProviderError } from "@fredonbytes/core";

type CartDb = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => Promise<{
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }>;
    };
    insert?: (values: Record<string, unknown>) => Promise<{
      error: { message: string } | null;
    }>;
  };
};

export function createCartService(db: CartDb) {
  return {
    async getActiveCart(userId: string) {
      const cartSelection = db.from("carts").select("id,total");
      const cartResult = "eq" in cartSelection
        ? await cartSelection.eq("customer_id", userId)
        : await (cartSelection as Promise<{
          data: Array<Record<string, unknown>> | null;
          error: { message: string } | null;
        }>);
      const { data: carts, error: cartError } = cartResult;

      if (cartError) {
        throw new ProviderError("SUPABASE_CART_LOOKUP_FAILED", cartError.message);
      }

      const cart = carts?.[0];
      if (!cart) {
        return { id: "unknown", total: 0 };
      }

      let total = Number(cart.total ?? 0);
      const itemSelection = db.from("cart_items").select("quantity,unit_price");
      if ("eq" in itemSelection) {
        const { data: items, error: itemError } = await itemSelection.eq(
          "cart_id",
          String(cart.id),
        );

        if (itemError) {
          throw new ProviderError("SUPABASE_CART_ITEMS_FAILED", itemError.message);
        }

        total = (items ?? []).reduce((sum, item) => {
          const quantity = Number(item.quantity ?? 0);
          const unitPrice = Number(item.unit_price ?? 0);
          return sum + (quantity * unitPrice);
        }, 0);
      }

      return {
        id: String(cart.id),
        total,
      };
    },
    async addItem(input: {
      cartId: string;
      variantId: string;
      quantity: number;
    }) {
      const insert = db.from("cart_items").insert;
      if (!insert) {
        throw new ProviderError("SUPABASE_CART_ADD_FAILED", "Insert is not available");
      }

      const { error } = await insert({
        cart_id: input.cartId,
        variant_id: input.variantId,
        quantity: input.quantity,
      });

      if (error) {
        throw new ProviderError("SUPABASE_CART_ADD_FAILED", error.message);
      }
    },
  };
}
