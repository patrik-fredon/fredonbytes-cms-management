import { describe, expect, it } from "vitest";

export function runAuthContractTests(
  name: string,
  makeAuth: () => {
    signIn: (input: { email: string; password: string }) => Promise<{ userId: string }>;
  },
) {
  describe(`${name} auth contract`, () => {
    it("returns userId on valid sign in", async () => {
      const auth = makeAuth();
      const result = await auth.signIn({
        email: "ok@site.com",
        password: "pass",
      });

      expect(result.userId).toBeTruthy();
    });
  });
}
