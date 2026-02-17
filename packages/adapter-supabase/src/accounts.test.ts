import { describe, expect, it } from "vitest";
import { createAccountsService } from "./accounts";

describe("accounts service", () => {
  it("returns profile by user id", async () => {
    const svc = createAccountsService();
    await expect(svc.getProfile("u1"))
      .resolves
      .toMatchObject({ userId: "u1" });
  });
});
