export function createAccountsService(_db?: unknown) {
  return {
    async getProfile(userId: string) {
      return { userId };
    },
  };
}
