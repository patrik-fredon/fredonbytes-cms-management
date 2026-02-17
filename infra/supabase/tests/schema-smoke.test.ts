import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

describe("supabase core schema", () => {
  it("defines carts table", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const sqlPath = resolve(__dirname, "../migrations/20260217_0001_core.sql");
    const sql = readFileSync(sqlPath, "utf8");
    expect(sql).toMatch(/create table if not exists carts/i);
  });
});
