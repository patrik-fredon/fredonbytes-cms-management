export function createCheckoutService(_db?: unknown) {
  return {
    async placeOrder(cartId: string) {
      return { orderCode: `ORD-${cartId}` };
    },
  };
}
