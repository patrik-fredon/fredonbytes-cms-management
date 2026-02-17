type VendureRequest = (...args: unknown[]) => Promise<unknown>;

export function createVendureClient(query: VendureRequest, mutation?: VendureRequest) {
  return {
    query,
    mutation: mutation ?? query,
  };
}
