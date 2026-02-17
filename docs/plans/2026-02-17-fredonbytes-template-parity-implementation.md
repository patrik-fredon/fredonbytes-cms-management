# FredonBytes Template Parity-First Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver parity-first FredonBytes template completion so Vendure behavior is preserved while Supabase/Postgres mode reaches parity-critical readiness for new and existing Next.js apps.

**Architecture:** Expand the provider-agnostic contract surface in `packages/core`, enforce strict typed mode config in `packages/config`, replace adapter stubs with real domain services in `packages/adapter-supabase` and mapped Vendure services in `packages/adapter-vendure`, and route storefront behavior through one composition root. Back parity with a dual-adapter contract matrix and dual-mode E2E gates in CI.

**Tech Stack:** TypeScript, Next.js App Router, Vendure GraphQL API, Supabase Auth/Postgres/RLS, Zod, Vitest, Playwright, npm workspaces, GitHub Actions.

---

## Execution Rules

- Apply `@test-driven-development` on every task.
- Apply `@verification-before-completion` before completion claims.
- Apply `@systematic-debugging` immediately on unexpected failures.
- Keep commits task-scoped and frequent (one commit per task).

---

### Task 1: Tighten Typed Runtime Config (Mode + Secret Safety)

**Files:**
- Modify: `packages/config/src/schema.ts`
- Create: `packages/config/src/server.ts`
- Create: `packages/config/src/client.ts`
- Modify: `packages/config/src/index.ts`
- Modify: `packages/config/src/index.test.ts`

**Step 1: Write the failing test**

```ts
// packages/config/src/index.test.ts
it("requires DATABASE_URL in supabase mode", () => {
  expect(() =>
    loadServerConfig({
      FREDONBYTES_MODE: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    }),
  ).toThrow(/DATABASE_URL/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/config`  
Expected: FAIL due to missing `DATABASE_URL` validation.

**Step 3: Write minimal implementation**

```ts
// packages/config/src/schema.ts (excerpt)
const supabaseSchema = baseSchema.extend({
  FREDONBYTES_MODE: z.literal("supabase"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});
```

```ts
// packages/config/src/client.ts (excerpt)
export function loadClientConfig(env: Record<string, string | undefined>) {
  const parsed = configSchema.parse(env);
  if (parsed.FREDONBYTES_MODE === "supabase") {
    return {
      FREDONBYTES_MODE: parsed.FREDONBYTES_MODE,
      SUPABASE_URL: parsed.SUPABASE_URL,
      SUPABASE_ANON_KEY: parsed.SUPABASE_ANON_KEY,
    };
  }
  return {
    FREDONBYTES_MODE: parsed.FREDONBYTES_MODE,
    VENDURE_SHOP_API_URL: parsed.VENDURE_SHOP_API_URL,
    VENDURE_CHANNEL_TOKEN: parsed.VENDURE_CHANNEL_TOKEN,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/config`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/config/src/schema.ts packages/config/src/server.ts packages/config/src/client.ts packages/config/src/index.ts packages/config/src/index.test.ts
git commit -m "feat(config): enforce parity config contract and client-safe accessors"
```

---

### Task 2: Expand Core Contracts, DTOs, And Error Envelope

**Files:**
- Create: `packages/core/src/dto.ts`
- Modify: `packages/core/src/contracts.ts`
- Create: `packages/core/src/result.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/contracts.test.ts`

**Step 1: Write the failing test**

```ts
// packages/core/src/contracts.test.ts
it("exposes cart and checkout service contracts", () => {
  type _Cart = import("./contracts").CartService;
  type _Checkout = import("./contracts").CheckoutService;
  expect(true).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/core`  
Expected: FAIL because `CartService` / `CheckoutService` are missing.

**Step 3: Write minimal implementation**

```ts
// packages/core/src/contracts.ts (excerpt)
export interface CartService {
  getActiveCart(userId: string): Promise<{ id: string; total: number }>;
  addItem(input: { cartId: string; variantId: string; quantity: number }): Promise<void>;
}

export interface CheckoutService {
  placeOrder(cartId: string): Promise<{ orderCode: string }>;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/core`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/dto.ts packages/core/src/contracts.ts packages/core/src/result.ts packages/core/src/index.ts packages/core/src/contracts.test.ts
git commit -m "feat(core): add parity domain contracts and dto surface"
```

---

### Task 3: Enforce Mode-Specific Container Construction

**Files:**
- Modify: `packages/core/src/container.ts`
- Modify: `packages/core/src/container.test.ts`

**Step 1: Write the failing test**

```ts
it("throws when selected mode factory is missing", () => {
  expect(() =>
    createServiceContainer(
      { FREDONBYTES_MODE: "supabase" },
      { supabase: undefined as never, vendure: () => ({}) },
    ),
  ).toThrow(/supabase factory/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/core`  
Expected: FAIL because missing factory guard.

**Step 3: Write minimal implementation**

```ts
if (config.FREDONBYTES_MODE === "supabase") {
  if (!factories.supabase) throw new Error("supabase factory is required");
  return { mode: "supabase" as const, services: factories.supabase() };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/core`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/container.ts packages/core/src/container.test.ts
git commit -m "feat(core): harden mode container factory guards"
```

---

### Task 4: Replace Supabase Client Stubs With Real Clients

**Files:**
- Modify: `packages/adapter-supabase/src/client.ts`
- Modify: `packages/adapter-supabase/src/index.ts`
- Modify: `apps/starter-next/src/lib/container.ts`
- Modify: `apps/storefront/src/lib/fredonbytes/container.ts`
- Create: `packages/adapter-supabase/src/client.test.ts`

**Step 1: Write the failing test**

```ts
it("builds server and anon clients from config", () => {
  const clients = createSupabaseClients({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
  });
  expect(clients.admin).toBeDefined();
  expect(clients.public).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL because client factory is incomplete.

**Step 3: Write minimal implementation**

```ts
// packages/adapter-supabase/src/client.ts (excerpt)
export function createSupabaseClients(cfg: {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}) {
  const publicClient = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const adminClient = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY);
  return { public: publicClient, admin: adminClient };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/client.ts packages/adapter-supabase/src/index.ts packages/adapter-supabase/src/client.test.ts apps/starter-next/src/lib/container.ts apps/storefront/src/lib/fredonbytes/container.ts
git commit -m "feat(adapter-supabase): wire real supabase clients into composition roots"
```

---

### Task 5: Expand Supabase Schema For Parity Domains

**Files:**
- Create: `infra/supabase/migrations/20260217_0002_catalog_cart_orders_cms.sql`
- Modify: `infra/supabase/seed/seed.sql`
- Modify: `infra/supabase/tests/schema-smoke.test.ts`

**Step 1: Write the failing test**

```ts
it("defines orders and cms_pages tables", () => {
  const sql = readFileSync(
    "infra/supabase/migrations/20260217_0002_catalog_cart_orders_cms.sql",
    "utf8",
  );
  expect(sql).toMatch(/create table if not exists orders/i);
  expect(sql).toMatch(/create table if not exists cms_pages/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- infra/supabase/tests/schema-smoke.test.ts`  
Expected: FAIL because migration file/tables are missing.

**Step 3: Write minimal implementation**

```sql
create table if not exists products (...);
create table if not exists carts (...);
create table if not exists orders (...);
create table if not exists cms_pages (...);
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- infra/supabase/tests/schema-smoke.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add infra/supabase/migrations/20260217_0002_catalog_cart_orders_cms.sql infra/supabase/seed/seed.sql infra/supabase/tests/schema-smoke.test.ts
git commit -m "feat(db): add supabase parity schema for commerce and cms domains"
```

---

### Task 6: Implement Supabase Accounts + Auth Domain

**Files:**
- Modify: `packages/adapter-supabase/src/accounts.ts`
- Modify: `packages/adapter-supabase/src/index.ts`
- Modify: `packages/adapter-supabase/src/accounts.test.ts`
- Modify: `packages/adapter-supabase/src/auth.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("returns persisted profile fields from profiles table", async () => {
  const svc = createAccountsService(mockDbWithProfile("u1"));
  await expect(svc.getProfile("u1")).resolves.toMatchObject({ userId: "u1", email: "demo@example.com" });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL because `getProfile` is currently a stub.

**Step 3: Write minimal implementation**

```ts
export function createAccountsService(db: SupabaseLikeDb) {
  return {
    async getProfile(userId: string) {
      const { data, error } = await db.from("profiles").select("id,email,first_name,last_name").eq("id", userId).single();
      if (error || !data) throw new NotFoundError("PROFILE_NOT_FOUND", "Profile not found");
      return { userId: data.id, email: data.email, firstName: data.first_name, lastName: data.last_name };
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/accounts.ts packages/adapter-supabase/src/index.ts packages/adapter-supabase/src/accounts.test.ts packages/adapter-supabase/src/auth.contract.test.ts
git commit -m "feat(adapter-supabase): implement accounts domain with profile persistence"
```

---

### Task 7: Implement Supabase Catalog + Cart Domain

**Files:**
- Modify: `packages/adapter-supabase/src/catalog.ts`
- Modify: `packages/adapter-supabase/src/cart.ts`
- Modify: `packages/adapter-supabase/src/catalog.test.ts`
- Modify: `packages/adapter-supabase/src/cart.test.ts`

**Step 1: Write the failing test**

```ts
it("adds item and returns updated cart total", async () => {
  const svc = createCartService(mockDb());
  await svc.addItem({ cartId: "c1", variantId: "v1", quantity: 2 });
  await expect(svc.getActiveCart("u1")).resolves.toMatchObject({ id: "c1", total: 4000 });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL because `addItem` is not implemented.

**Step 3: Write minimal implementation**

```ts
// packages/adapter-supabase/src/cart.ts (excerpt)
async addItem(input) {
  const { error } = await db.from("cart_items").insert({
    cart_id: input.cartId,
    variant_id: input.variantId,
    quantity: input.quantity,
  });
  if (error) throw new ProviderError("SUPABASE_CART_ADD_FAILED", error.message);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/catalog.ts packages/adapter-supabase/src/cart.ts packages/adapter-supabase/src/catalog.test.ts packages/adapter-supabase/src/cart.test.ts
git commit -m "feat(adapter-supabase): implement catalog and cart persistence flows"
```

---

### Task 8: Implement Supabase Checkout + Orders Domain

**Files:**
- Modify: `packages/adapter-supabase/src/checkout.ts`
- Modify: `packages/adapter-supabase/src/orders.ts`
- Modify: `packages/adapter-supabase/src/checkout.test.ts`
- Modify: `packages/adapter-supabase/src/orders.test.ts`

**Step 1: Write the failing test**

```ts
it("creates an order row and returns generated order code", async () => {
  const svc = createCheckoutService(mockDbForCheckout());
  await expect(svc.placeOrder("c1")).resolves.toMatchObject({ orderCode: expect.stringMatching(/^ORD-/) });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: FAIL because checkout/orders are placeholder implementations.

**Step 3: Write minimal implementation**

```ts
// packages/adapter-supabase/src/checkout.ts (excerpt)
const code = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
await db.from("orders").insert({ id: crypto.randomUUID(), code, cart_id: cartId, status: "Created" });
return { orderCode: code };
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/checkout.ts packages/adapter-supabase/src/orders.ts packages/adapter-supabase/src/checkout.test.ts packages/adapter-supabase/src/orders.test.ts
git commit -m "feat(adapter-supabase): implement checkout and orders domain operations"
```

---

### Task 9: Implement Vendure Adapter Domain Mapping Surface

**Files:**
- Modify: `packages/adapter-vendure/src/index.ts`
- Modify: `packages/adapter-vendure/src/index.test.ts`
- Modify: `packages/adapter-vendure/src/auth.contract.test.ts`
- Create: `packages/adapter-vendure/src/cart.test.ts`

**Step 1: Write the failing test**

```ts
it("maps add item errors to ProviderError", async () => {
  const svc = createVendureServices({ query: vi.fn().mockRejectedValue(new Error("500")) } as never);
  await expect(
    svc.cart.addItem({ cartId: "c1", variantId: "v1", quantity: 1 }),
  ).rejects.toThrow(/ProviderError/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-vendure`  
Expected: FAIL because cart/order/account mappings are incomplete.

**Step 3: Write minimal implementation**

```ts
cart: {
  async addItem(input) {
    try {
      await client.query("AddItemToOrderDocument", input);
    } catch (err) {
      throw new ProviderError("VENDURE_CART_ADD_FAILED", `ProviderError: ${String(err)}`);
    }
  },
},
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-vendure`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-vendure/src/index.ts packages/adapter-vendure/src/index.test.ts packages/adapter-vendure/src/auth.contract.test.ts packages/adapter-vendure/src/cart.test.ts
git commit -m "feat(adapter-vendure): complete parity-critical domain mappings"
```

---

### Task 10: Migrate Storefront Actions To Container-Only Service Access

**Files:**
- Modify: `apps/storefront/src/lib/vendure/actions.ts`
- Modify: `apps/storefront/src/app/sign-in/actions.ts`
- Modify: `apps/storefront/src/app/cart/actions.ts`
- Modify: `apps/storefront/src/app/checkout/actions.ts`
- Modify: `apps/storefront/src/app/account/profile/actions.ts`
- Modify: `apps/storefront/src/app/account/addresses/actions.ts`
- Create: `apps/storefront/src/lib/fredonbytes/actions.test.ts`

**Step 1: Write the failing test**

```ts
it("sign-in action resolves through service container auth service", async () => {
  const result = await signInAction(formDataWithCredentials());
  expect(result.ok).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w storefront`  
Expected: FAIL because actions still invoke direct Vendure query helpers.

**Step 3: Write minimal implementation**

```ts
// apps/storefront/src/app/sign-in/actions.ts (excerpt)
const container = getServiceContainer();
await container.services.auth.signIn({ email, password });
```

**Step 4: Run test to verify it passes**

Run: `npm run test -w storefront`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/storefront/src/lib/vendure/actions.ts apps/storefront/src/app/sign-in/actions.ts apps/storefront/src/app/cart/actions.ts apps/storefront/src/app/checkout/actions.ts apps/storefront/src/app/account/profile/actions.ts apps/storefront/src/app/account/addresses/actions.ts apps/storefront/src/lib/fredonbytes/actions.test.ts
git commit -m "refactor(storefront): route parity-critical actions through core services"
```

---

### Task 11: Dual-Adapter Contract Matrix For Parity Domains

**Files:**
- Create: `packages/core/src/contract-tests/cart.contract.ts`
- Create: `packages/core/src/contract-tests/checkout.contract.ts`
- Modify: `packages/adapter-supabase/src/auth.contract.test.ts`
- Create: `packages/adapter-supabase/src/cart.contract.test.ts`
- Create: `packages/adapter-vendure/src/cart.contract.test.ts`

**Step 1: Write the failing test**

```ts
// packages/core/src/contract-tests/cart.contract.ts
export function runCartContract(name: string, makeCart: () => { getActiveCart: (u: string) => Promise<{ id: string; total: number }> }) {
  describe(`${name} cart contract`, () => {
    it("returns active cart shape", async () => {
      const cart = await makeCart().getActiveCart("u1");
      expect(cart).toEqual({ id: expect.any(String), total: expect.any(Number) });
    });
  });
}
```

**Step 2: Run test to verify it fails**

Run: `npm run test`  
Expected: FAIL until both adapters satisfy new contracts.

**Step 3: Write minimal implementation**

```ts
// adapter test files invoke runCartContract and runCheckoutContract with adapter-specific fixtures.
```

**Step 4: Run test to verify it passes**

Run: `npm run test`  
Expected: PASS across workspace suites.

**Step 5: Commit**

```bash
git add packages/core/src/contract-tests/cart.contract.ts packages/core/src/contract-tests/checkout.contract.ts packages/adapter-supabase/src/auth.contract.test.ts packages/adapter-supabase/src/cart.contract.test.ts packages/adapter-vendure/src/cart.contract.test.ts
git commit -m "test(core): add cart and checkout dual-adapter contract matrix"
```

---

### Task 12: Enforce Dual-Mode E2E In CI And Remove Vendure Deferral

**Files:**
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/auth.spec.ts`
- Modify: `tests/e2e/cart.spec.ts`
- Modify: `tests/e2e/starter.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/testing/strategy.md`

**Step 1: Write the failing test**

```ts
// tests/e2e/auth.spec.ts (excerpt)
test("auth sign-in flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/sign-in/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- --project=vendure`  
Expected: FAIL in current state (runtime fetch failures/timeouts).

**Step 3: Write minimal implementation**

```yaml
# .github/workflows/ci.yml (excerpt)
- run: npm run test
- run: npm run build
- run: npm run test:e2e -- --project=vendure
- run: npm run test:e2e -- --project=supabase
```

```ts
// playwright.config.ts (excerpt)
projects: [
  { name: "vendure", use: { baseURL: "http://localhost:3001" } },
  { name: "supabase", use: { baseURL: "http://localhost:3002" } },
];
```

**Step 4: Run test to verify it passes**

Run: `npm run test && npm run test:e2e -- --project=vendure && npm run test:e2e -- --project=supabase`  
Expected: PASS for both projects.

**Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/auth.spec.ts tests/e2e/cart.spec.ts tests/e2e/starter.spec.ts .github/workflows/ci.yml docs/testing/strategy.md
git commit -m "test(ci): enforce dual-mode parity e2e gates for vendure and supabase"
```

---

### Task 13: Integration And Migration Docs Hardening

**Files:**
- Modify: `docs/integration/nextjs-existing-app.md`
- Modify: `README.md`
- Create: `docs/integration/migration-vendure-to-fredonbytes.md`
- Modify: `apps/starter-next/.env.example`

**Step 1: Write the failing test**

```bash
rg -n "DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|vendure mode|supabase mode" docs/integration/nextjs-existing-app.md docs/integration/migration-vendure-to-fredonbytes.md
```

**Step 2: Run test to verify it fails**

Run: command above  
Expected: FAIL/missing matches before doc updates.

**Step 3: Write minimal implementation**

```md
## Required Environment
FREDONBYTES_MODE=supabase|vendure
DATABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=... # server only
```

**Step 4: Run test to verify it passes**

Run: same `rg` command  
Expected: PASS with all required matches.

**Step 5: Commit**

```bash
git add docs/integration/nextjs-existing-app.md docs/integration/migration-vendure-to-fredonbytes.md README.md apps/starter-next/.env.example
git commit -m "docs: harden parity integration and migration runbooks"
```

---

## Final Verification Checklist (Before Completion Claim)

Run in order:

```bash
npm ci
npm run test
npm run build
npm run test:e2e -- --project=vendure
npm run test:e2e -- --project=supabase
```

Expected outcomes:

- Workspace tests pass with dual-adapter contract suites.
- Storefront parity-critical journeys succeed in vendure mode.
- Starter/parity journeys succeed in supabase mode.
- CI mirrors local verification and enforces both modes.
