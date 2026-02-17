# FredonBytes Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert this Vendure-based monorepo into a FredonBytes hybrid template that defaults to Supabase mode, keeps Vendure as an optional adapter, and preserves current functionality during phased migration.

**Architecture:** Introduce provider-agnostic domain contracts in `packages/core`, typed env/config in `packages/config`, and two adapters (`packages/adapter-vendure`, `packages/adapter-supabase`). Wire apps through one composition root (`FredonBytesProvider`) so mode selection is config-driven. Migrate features domain-by-domain with contract tests, then flip default mode to Supabase after parity is proven.

**Tech Stack:** TypeScript, Next.js 16, Vendure 3.5.x, Supabase (Auth + Postgres), Zod, Vitest, Playwright, npm workspaces.

---

## Execution Rules

- Apply `@test-driven-development` in every task.
- Apply `@verification-before-completion` before claiming pass/fix.
- Apply `@systematic-debugging` on any unexpected failure.
- Keep commits small and frequent (one commit per task).

---

### Task 1: Workspace And Test Foundation

**Files:**
- Modify: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`
- Create: `docs/testing/strategy.md`

**Step 1: Write the failing test**

```ts
// vitest.workspace.ts (initial failing reference)
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/*/vitest.config.ts",
]);
```

```bash
npm run test
```

Expected: FAIL with "Missing script: test".

**Step 2: Run test to verify it fails**

Run: `npm run test`  
Expected: npm reports missing `test` script.

**Step 3: Write minimal implementation**

```json
// package.json (scripts/workspaces excerpt)
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "test": "vitest --workspace vitest.workspace.ts run",
    "test:watch": "vitest --workspace vitest.workspace.ts",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "@playwright/test": "^1.49.1",
    "typescript": "^5.9.3"
  }
}
```

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@fredonbytes/config": ["packages/config/src/index.ts"],
      "@fredonbytes/core": ["packages/core/src/index.ts"]
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test`  
Expected: PASS with "No test files found" (exit 0 after workspace bootstraps), or PASS with initial package tests if present.

**Step 5: Commit**

```bash
git add package.json tsconfig.base.json vitest.workspace.ts docs/testing/strategy.md
git commit -m "chore: add monorepo test and ts foundation"
```

---

### Task 2: Typed Config Package (`@fredonbytes/config`)

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/src/index.ts`
- Create: `packages/config/src/schema.ts`
- Test: `packages/config/src/index.test.ts`
- Create: `packages/config/vitest.config.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { loadConfig } from "./index";

describe("loadConfig", () => {
  it("requires Supabase keys in supabase mode", () => {
    expect(() => loadConfig({ FREDONBYTES_MODE: "supabase" }))
      .toThrow(/SUPABASE_URL/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/config`  
Expected: FAIL with "loadConfig is not defined" or import error.

**Step 3: Write minimal implementation**

```ts
// packages/config/src/schema.ts
import { z } from "zod";

const baseSchema = z.object({
  FREDONBYTES_MODE: z.enum(["supabase", "vendure"]),
});

export const configSchema = z.discriminatedUnion("FREDONBYTES_MODE", [
  baseSchema.extend({
    FREDONBYTES_MODE: z.literal("supabase"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  }),
  baseSchema.extend({
    FREDONBYTES_MODE: z.literal("vendure"),
    VENDURE_SHOP_API_URL: z.string().url(),
    VENDURE_CHANNEL_TOKEN: z.string().min(1).default("__default_channel__"),
  }),
]);
```

```ts
// packages/config/src/index.ts
import { configSchema } from "./schema";

export function loadConfig(env: Record<string, string | undefined>) {
  return configSchema.parse(env);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/config`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/config
git commit -m "feat(config): add typed mode-based config loader"
```

---

### Task 3: Core Contracts And Error Taxonomy (`@fredonbytes/core`)

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/src/contracts.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/errors.test.ts`
- Create: `packages/core/vitest.config.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { AuthError } from "./errors";

describe("AuthError", () => {
  it("sets error code", () => {
    const err = new AuthError("INVALID_CREDENTIALS", "Invalid login");
    expect(err.code).toBe("INVALID_CREDENTIALS");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/core`  
Expected: FAIL because `AuthError` does not exist.

**Step 3: Write minimal implementation**

```ts
// packages/core/src/errors.ts
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export class AuthError extends DomainError {}
export class ValidationError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
export class PaymentError extends DomainError {}
export class ProviderError extends DomainError {}
```

```ts
// packages/core/src/contracts.ts (excerpt)
export interface AuthService {
  signIn(input: { email: string; password: string }): Promise<{ userId: string }>;
  signOut(): Promise<void>;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/core`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): add domain errors and service contracts"
```

---

### Task 4: Service Container And Mode Resolver

**Files:**
- Create: `packages/core/src/container.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/container.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createServiceContainer } from "./container";

describe("createServiceContainer", () => {
  it("uses supabase adapter in supabase mode", () => {
    const container = createServiceContainer({
      FREDONBYTES_MODE: "supabase",
    } as never, {
      supabase: vi.fn(() => ({ auth: {} })),
      vendure: vi.fn(),
    });
    expect(container.mode).toBe("supabase");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/core`  
Expected: FAIL (`createServiceContainer` missing).

**Step 3: Write minimal implementation**

```ts
export function createServiceContainer(config: { FREDONBYTES_MODE: "supabase" | "vendure" }, factories: {
  supabase: () => unknown;
  vendure: () => unknown;
}) {
  if (config.FREDONBYTES_MODE === "supabase") {
    return { mode: "supabase", services: factories.supabase() };
  }
  return { mode: "vendure", services: factories.vendure() };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/core`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/container.ts packages/core/src/container.test.ts packages/core/src/index.ts
git commit -m "feat(core): add mode-driven service container"
```

---

### Task 5: Vendure Adapter Extraction (`@fredonbytes/adapter-vendure`)

**Files:**
- Create: `packages/adapter-vendure/package.json`
- Create: `packages/adapter-vendure/src/index.ts`
- Create: `packages/adapter-vendure/src/client.ts`
- Test: `packages/adapter-vendure/src/index.test.ts`
- Create: `packages/adapter-vendure/vitest.config.ts`
- Modify: `apps/storefront/src/lib/vendure/api.ts` (reuse wrapper or re-export)

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createVendureServices } from "./index";

describe("createVendureServices", () => {
  it("maps API errors to ProviderError", async () => {
    const query = vi.fn().mockRejectedValue(new Error("HTTP error! status: 500"));
    const svc = createVendureServices({ query } as never);
    await expect(svc.catalog.listCollections()).rejects.toThrow(/ProviderError/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-vendure`  
Expected: FAIL (package/functions missing).

**Step 3: Write minimal implementation**

```ts
import { ProviderError } from "@fredonbytes/core";

export function createVendureServices(client: { query: (...args: unknown[]) => Promise<unknown> }) {
  return {
    catalog: {
      async listCollections() {
        try {
          return await client.query("CollectionsDocument");
        } catch (err) {
          throw new ProviderError("VENDURE_QUERY_FAILED", String(err));
        }
      },
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-vendure`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-vendure apps/storefront/src/lib/vendure/api.ts
git commit -m "feat(adapter-vendure): add initial vendure service adapter"
```

---

### Task 6: Supabase Adapter Bootstrap (`@fredonbytes/adapter-supabase`)

**Files:**
- Create: `packages/adapter-supabase/package.json`
- Create: `packages/adapter-supabase/src/index.ts`
- Create: `packages/adapter-supabase/src/client.ts`
- Test: `packages/adapter-supabase/src/index.test.ts`
- Create: `packages/adapter-supabase/vitest.config.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createSupabaseServices } from "./index";

describe("createSupabaseServices", () => {
  it("calls supabase auth signInWithPassword", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const svc = createSupabaseServices({
      auth: { signInWithPassword },
    } as never);
    await svc.auth.signIn({ email: "a@b.com", password: "x" });
    expect(signInWithPassword).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL (missing implementation).

**Step 3: Write minimal implementation**

```ts
import { AuthError } from "@fredonbytes/core";

export function createSupabaseServices(client: {
  auth: { signInWithPassword: (input: { email: string; password: string }) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> };
}) {
  return {
    auth: {
      async signIn(input: { email: string; password: string }) {
        const { data, error } = await client.auth.signInWithPassword(input);
        if (error || !data.user) throw new AuthError("INVALID_CREDENTIALS", error?.message ?? "No user");
        return { userId: data.user.id };
      },
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase
git commit -m "feat(adapter-supabase): add auth bootstrap adapter"
```

---

### Task 7: Contract Test Matrix (Adapters Must Behave The Same)

**Files:**
- Create: `packages/core/src/contract-tests/auth.contract.ts`
- Create: `packages/adapter-vendure/src/auth.contract.test.ts`
- Create: `packages/adapter-supabase/src/auth.contract.test.ts`

**Step 1: Write the failing test**

```ts
// packages/core/src/contract-tests/auth.contract.ts
export function runAuthContractTests(name: string, makeAuth: () => { signIn: (i: { email: string; password: string }) => Promise<{ userId: string }> }) {
  describe(`${name} auth contract`, () => {
    it("returns userId on valid sign in", async () => {
      const auth = makeAuth();
      const result = await auth.signIn({ email: "ok@site.com", password: "pass" });
      expect(result.userId).toBeTruthy();
    });
  });
}
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-vendure && npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL until both adapters satisfy shared contract setup.

**Step 3: Write minimal implementation**

```ts
// Adapter test files call runAuthContractTests with adapter-specific mocks.
```

**Step 4: Run test to verify it passes**

Run: `npm run test`  
Expected: PASS for both adapter contract suites.

**Step 5: Commit**

```bash
git add packages/core/src/contract-tests packages/adapter-vendure/src/auth.contract.test.ts packages/adapter-supabase/src/auth.contract.test.ts
git commit -m "test(core): add adapter auth contract test matrix"
```

---

### Task 8: Wire Existing Storefront Through Core (Vendure Preservation Phase)

**Files:**
- Create: `apps/storefront/src/lib/fredonbytes/container.ts`
- Modify: `apps/storefront/src/lib/vendure/actions.ts`
- Modify: `apps/storefront/src/app/**/actions.ts` (all action entry points)
- Test: `apps/storefront/src/lib/fredonbytes/container.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getServiceContainer } from "./container";

describe("getServiceContainer", () => {
  it("uses vendure mode when configured", () => {
    process.env.FREDONBYTES_MODE = "vendure";
    const c = getServiceContainer();
    expect(c.mode).toBe("vendure");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w storefront`  
Expected: FAIL (`getServiceContainer` missing).

**Step 3: Write minimal implementation**

```ts
import { loadConfig } from "@fredonbytes/config";
import { createServiceContainer } from "@fredonbytes/core";
import { createVendureServices } from "@fredonbytes/adapter-vendure";
import { createSupabaseServices } from "@fredonbytes/adapter-supabase";

export function getServiceContainer() {
  const config = loadConfig(process.env);
  return createServiceContainer(config, {
    supabase: () => createSupabaseServices(/* supabase client */ {} as never),
    vendure: () => createVendureServices(/* vendure client */ {} as never),
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w storefront`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/storefront/src/lib/fredonbytes apps/storefront/src/lib/vendure/actions.ts apps/storefront/src/app
git commit -m "refactor(storefront): route actions through fredonbytes container"
```

---

### Task 9: Supabase Schema + Migrations Foundation

**Files:**
- Create: `infra/supabase/migrations/20260217_0001_core.sql`
- Create: `infra/supabase/seed/seed.sql`
- Create: `infra/supabase/README.md`
- Test: `infra/supabase/tests/schema-smoke.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("supabase core schema", () => {
  it("defines carts table", () => {
    const sql = readFileSync("infra/supabase/migrations/20260217_0001_core.sql", "utf8");
    expect(sql).toMatch(/create table if not exists carts/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- infra/supabase/tests/schema-smoke.test.ts`  
Expected: FAIL because migration file does not exist.

**Step 3: Write minimal implementation**

```sql
create table if not exists profiles (
  id uuid primary key,
  email text not null unique
);

create table if not exists carts (
  id uuid primary key,
  customer_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- infra/supabase/tests/schema-smoke.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add infra/supabase
git commit -m "feat(db): add supabase migration and seed foundation"
```

---

### Task 10: Supabase Catalog + Cart Services

**Files:**
- Modify: `packages/adapter-supabase/src/index.ts`
- Create: `packages/adapter-supabase/src/catalog.ts`
- Create: `packages/adapter-supabase/src/cart.ts`
- Test: `packages/adapter-supabase/src/catalog.test.ts`
- Test: `packages/adapter-supabase/src/cart.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createCatalogService } from "./catalog";

describe("catalog service", () => {
  it("returns normalized product list", async () => {
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [{ id: "p1", name: "Tee" }], error: null }) });
    const svc = createCatalogService({ from } as never);
    const result = await svc.listProducts();
    expect(result.items[0].id).toBe("p1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL (catalog/cart services missing).

**Step 3: Write minimal implementation**

```ts
export function createCatalogService(db: { from: (t: string) => { select: () => Promise<{ data: Array<{ id: string; name: string }>; error: unknown }> } }) {
  return {
    async listProducts() {
      const { data } = await db.from("products").select();
      return { items: (data ?? []).map((p) => ({ id: p.id, name: p.name })) };
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/index.ts packages/adapter-supabase/src/catalog.ts packages/adapter-supabase/src/cart.ts packages/adapter-supabase/src/catalog.test.ts packages/adapter-supabase/src/cart.test.ts
git commit -m "feat(adapter-supabase): add catalog and cart domain services"
```

---

### Task 11: Supabase Checkout + Orders + Accounts Services

**Files:**
- Create: `packages/adapter-supabase/src/checkout.ts`
- Create: `packages/adapter-supabase/src/orders.ts`
- Create: `packages/adapter-supabase/src/accounts.ts`
- Modify: `packages/adapter-supabase/src/index.ts`
- Test: `packages/adapter-supabase/src/checkout.test.ts`
- Test: `packages/adapter-supabase/src/orders.test.ts`
- Test: `packages/adapter-supabase/src/accounts.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createCheckoutService } from "./checkout";

describe("checkout service", () => {
  it("creates order from cart", async () => {
    const svc = createCheckoutService({} as never);
    await expect(svc.placeOrder("cart-1")).resolves.toMatchObject({ orderCode: expect.any(String) });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL because checkout/orders/accounts service methods are missing.

**Step 3: Write minimal implementation**

```ts
export function createCheckoutService() {
  return {
    async placeOrder(cartId: string) {
      return { orderCode: `ORD-${cartId}` };
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/checkout.ts packages/adapter-supabase/src/orders.ts packages/adapter-supabase/src/accounts.ts packages/adapter-supabase/src/index.ts packages/adapter-supabase/src/checkout.test.ts packages/adapter-supabase/src/orders.test.ts packages/adapter-supabase/src/accounts.test.ts
git commit -m "feat(adapter-supabase): add checkout orders and account services"
```

---

### Task 12: `@fredonbytes/ui` Provider + Hooks

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/provider.tsx`
- Create: `packages/ui/src/hooks.ts`
- Create: `packages/ui/src/index.ts`
- Test: `packages/ui/src/provider.test.tsx`
- Create: `packages/ui/vitest.config.ts`

**Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFredonBytes } from "./hooks";

describe("useFredonBytes", () => {
  it("throws outside provider", () => {
    expect(() => renderHook(() => useFredonBytes())).toThrow(/FredonBytesProvider/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/ui`  
Expected: FAIL because provider/hook are missing.

**Step 3: Write minimal implementation**

```tsx
import { createContext, useContext } from "react";

const FredonBytesContext = createContext<unknown>(undefined);

export function FredonBytesProvider({ value, children }: { value: unknown; children: React.ReactNode }) {
  return <FredonBytesContext.Provider value={value}>{children}</FredonBytesContext.Provider>;
}

export function useFredonBytes() {
  const value = useContext(FredonBytesContext);
  if (!value) throw new Error("useFredonBytes must be used within FredonBytesProvider");
  return value;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/ui`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): add fredonbytes provider and hook layer"
```

---

### Task 13: New Starter App (`apps/starter-next`) In Supabase Mode

**Files:**
- Create: `apps/starter-next/package.json`
- Create: `apps/starter-next/next.config.ts`
- Create: `apps/starter-next/src/app/layout.tsx`
- Create: `apps/starter-next/src/app/page.tsx`
- Create: `apps/starter-next/src/lib/container.ts`
- Create: `apps/starter-next/.env.example`
- Test: `apps/starter-next/src/lib/container.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getContainer } from "./container";

describe("starter container", () => {
  it("defaults to supabase mode", () => {
    process.env.FREDONBYTES_MODE = "supabase";
    expect(getContainer().mode).toBe("supabase");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w starter-next`  
Expected: FAIL until app wiring exists.

**Step 3: Write minimal implementation**

```ts
import { loadConfig } from "@fredonbytes/config";
import { createServiceContainer } from "@fredonbytes/core";
import { createSupabaseServices } from "@fredonbytes/adapter-supabase";
import { createVendureServices } from "@fredonbytes/adapter-vendure";

export function getContainer() {
  const config = loadConfig(process.env);
  return createServiceContainer(config, {
    supabase: () => createSupabaseServices({} as never),
    vendure: () => createVendureServices({} as never),
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w starter-next`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/starter-next
git commit -m "feat(starter): add supabase-first fredonbytes next app shell"
```

---

### Task 14: Existing Next.js Integration Contract Docs

**Files:**
- Create: `docs/integration/nextjs-existing-app.md`
- Modify: `README.md`
- Modify: `apps/storefront/README.md`

**Step 1: Write the failing test**

```md
<!-- docs/integration/nextjs-existing-app.md -->
<!-- Add checklist test assertions manually in review: -->
- [ ] Includes install command
- [ ] Includes provider wiring
- [ ] Includes App Router route-handler wiring
- [ ] Includes env examples for both modes
```

**Step 2: Run test to verify it fails**

Run: `rg -n "provider wiring|App Router|FREDONBYTES_MODE" docs/integration/nextjs-existing-app.md`  
Expected: FAIL / no matches before content.

**Step 3: Write minimal implementation**

```md
# Integrate FredonBytes Into Existing Next.js App

1. Install packages:
   `npm i @fredonbytes/config @fredonbytes/core @fredonbytes/ui @fredonbytes/adapter-supabase @fredonbytes/adapter-vendure`
2. Add `FredonBytesProvider` in `app/layout.tsx`.
3. Add container composition in `src/lib/fredonbytes/container.ts`.
4. Add env keys (`FREDONBYTES_MODE`, Supabase/Vendure mode keys).
5. Route server actions through core services, not provider SDK directly.
```

**Step 4: Run test to verify it passes**

Run: `rg -n "Install packages|FredonBytesProvider|FREDONBYTES_MODE" docs/integration/nextjs-existing-app.md`  
Expected: PASS with matching lines.

**Step 5: Commit**

```bash
git add docs/integration/nextjs-existing-app.md README.md apps/storefront/README.md
git commit -m "docs: add package-first integration guide for existing next apps"
```

---

### Task 15: E2E Parity Matrix + CI Gate

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/cart.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("auth sign-in flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/sign-in/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- --project=vendure`  
Expected: FAIL before config/projects exist.

**Step 3: Write minimal implementation**

```ts
// playwright.config.ts (excerpt)
import { defineConfig } from "@playwright/test";

export default defineConfig({
  projects: [
    { name: "vendure", use: { baseURL: "http://localhost:3001" } },
    { name: "supabase", use: { baseURL: "http://localhost:3002" } },
  ],
});
```

```yaml
# .github/workflows/ci.yml (excerpt)
- run: npm run test
- run: npm run test:e2e -- --project=vendure
- run: npm run test:e2e -- --project=supabase
```

**Step 4: Run test to verify it passes**

Run: `npm run test && npm run test:e2e -- --project=vendure`  
Expected: PASS locally for vendure baseline; supabase project enabled when infra is available.

**Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e .github/workflows/ci.yml package.json
git commit -m "test: add e2e parity matrix and ci quality gates"
```

---

## Final Verification Checklist (Before Phase Completion Claims)

Run in order:

```bash
npm ci
npm run test
npm run build
npm run dev:server
npm run dev:storefront
```

Expected outcomes:

- Unit/integration tests pass.
- Existing Vendure storefront flows remain functional in `vendure` mode.
- Starter app boots in `supabase` mode with valid env.
- No server-only secrets exposed in client bundles.

