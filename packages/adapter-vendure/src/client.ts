export function createVendureClient(query: (...args: unknown[]) => Promise<unknown>) {
  return {
    query,
  };
}
