export function createOrdersService(_db?: unknown) {
  return {
    async getByCode(code: string) {
      return { code };
    },
  };
}
