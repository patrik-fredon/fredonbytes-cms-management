import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("supabase core schema", () => {
  it("defines carts table", () => {
    const sql = readFileSync("infra/supabase/migrations/20260217_0001_core.sql", "utf8");
    expect(sql).toMatch(/create table if not exists carts/i);
  });
});
