import { describe, expect, it } from "vitest";
import { getServiceContainer } from "./container";

describe("getServiceContainer", () => {
  it("uses vendure mode when configured", () => {
    process.env.FREDONBYTES_MODE = "vendure";
    process.env.VENDURE_SHOP_API_URL = "https://example.com/shop-api";
    process.env.VENDURE_CHANNEL_TOKEN = "__default_channel__";

    const c = getServiceContainer();
    expect(c.mode).toBe("vendure");
  });
});
