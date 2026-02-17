import { describe, expect, it } from "vitest";
import { createAccountsService } from "./accounts";

function mockDbWithProfile(userId: string) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq(_column: string, value: string) {
              return {
                async single() {
                  if (table !== "profiles" || value !== userId) {
                    return { data: null, error: { message: "not found" } };
                  }

                  return {
                    data: {
                      id: userId,
                      email: "demo@example.com",
                      first_name: "Demo",
                      last_name: "User",
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("accounts service", () => {
  it("returns persisted profile fields from profiles table", async () => {
    const svc = createAccountsService(mockDbWithProfile("u1"));
    await expect(svc.getProfile("u1"))
      .resolves
      .toMatchObject({ userId: "u1", email: "demo@example.com" });
  });
});
