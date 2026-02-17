import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { useFredonBytes } from "./hooks";

function HookProbe() {
  useFredonBytes();
  return null;
}

describe("useFredonBytes", () => {
  it("throws outside provider", () => {
    expect(() => renderToString(<HookProbe />))
      .toThrow(/FredonBytesProvider/);
  });
});
