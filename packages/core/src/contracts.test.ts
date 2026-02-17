import { describe, expect, it } from "vitest";
import { ok } from "./index";

describe("contracts", () => {
  it("exposes cart and checkout service contracts", () => {
    type _Cart = import("./contracts").CartService;
    type _Checkout = import("./contracts").CheckoutService;
    expect(ok({}).ok).toBe(true);
  });
});
