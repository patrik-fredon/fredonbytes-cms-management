import { NotFoundError } from "@fredonbytes/core";

export function createAccountsService(db: {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: {
            id: string;
            email: string;
            first_name?: string | null;
            last_name?: string | null;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}) {
  return {
    async getProfile(userId: string) {
      const { data, error } = await db
        .from("profiles")
        .select("id,email,first_name,last_name")
        .eq("id", userId)
        .single();

      if (error || !data) {
        throw new NotFoundError("PROFILE_NOT_FOUND", "Profile not found");
      }

      return {
        userId: data.id,
        email: data.email,
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
      };
    },
  };
}
