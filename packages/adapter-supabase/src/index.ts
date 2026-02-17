import { AuthError } from "@fredonbytes/core";

export function createSupabaseServices(client: {
  auth: {
    signInWithPassword: (input: {
      email: string;
      password: string;
    }) => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
  };
}) {
  return {
    auth: {
      async signIn(input: { email: string; password: string }) {
        const { data, error } = await client.auth.signInWithPassword(input);

        if (error || !data.user) {
          throw new AuthError(
            "INVALID_CREDENTIALS",
            error?.message ?? "No user",
          );
        }

        return { userId: data.user.id };
      },
      async signOut() {
        return;
      },
    },
  };
}
