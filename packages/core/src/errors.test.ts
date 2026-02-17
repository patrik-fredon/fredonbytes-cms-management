import { describe, expect, it } from "vitest";
import { AuthError } from "./errors";

describe("AuthError", () => {
  it("sets error code", () => {
    const err = new AuthError("INVALID_CREDENTIALS", "Invalid login");
    expect(err.code).toBe("INVALID_CREDENTIALS");
  });
});
