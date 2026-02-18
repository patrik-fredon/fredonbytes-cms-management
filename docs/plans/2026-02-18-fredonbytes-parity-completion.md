# FredonBytes Parity Completion Plan (Tasks 10–13)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining 4 tasks (10-13) of the parity-first implementation plan, bringing the FredonBytes template from 69% to 100% completion.

**Architecture:** The foundation (core contracts, config, both adapters, Supabase schema) is solid with 30 passing tests. What remains is expanding the contract surface to cover all storefront operations, rewiring actions through the container, building the contract test matrix, enforcing dual-mode E2E, and hardening docs.

**Tech Stack:** TypeScript, Next.js App Router, Vendure GraphQL API, Supabase Auth/Postgres, Zod, Vitest, Playwright, npm workspaces, GitHub Actions.

**Critical Dependency:** The original Task 10 assumed storefront actions could be rewired to `container.services`, but the core contracts only expose 5 methods (signIn, signOut, getActiveCart, addItem, placeOrder) while storefront actions use ~20 operations. Tasks 10A–10C expand the surface before 10D rewires.

---

## Execution Rules

- Apply `@test-driven-development` on every task.
- Apply `@verification-before-completion` before completion claims.
- Apply `@systematic-debugging` immediately on unexpected failures.
- Keep commits task-scoped and frequent (one commit per task).

---

### Task 10A: Expand Core Contracts And DTOs For Storefront Parity

**Why:** Storefront actions reference operations not yet in core contracts. Without expanding contracts first, Task 10D (action rewiring) cannot compile.

**Files:**
- Modify: `packages/core/src/contracts.ts`
- Modify: `packages/core/src/dto.ts`
- Modify: `packages/core/src/contracts.test.ts`
- Modify: `packages/core/src/index.ts`

**Step 1: Write the failing test**

```ts
// packages/core/src/contracts.test.ts — add these tests

it("CartService exposes removeItem and adjustQuantity", () => {
  type C = import("./contracts").CartService;
  type _r = ReturnType<C["removeItem"]>;
  type _a = ReturnType<C["adjustQuantity"]>;
  expect(true).toBe(true);
});

it("CheckoutService exposes setShippingAddress and setShippingMethod", () => {
  type C = import("./contracts").CheckoutService;
  type _s = ReturnType<C["setShippingAddress"]>;
  type _m = ReturnType<C["setShippingMethod"]>;
  type _c = ReturnType<C["setCustomerForOrder"]>;
  type _t = ReturnType<C["transitionToArrangingPayment"]>;
  expect(true).toBe(true);
});

it("AccountService exposes full profile and address operations", () => {
  type A = import("./contracts").AccountService;
  type _g = ReturnType<A["getActiveCustomer"]>;
  type _u = ReturnType<A["updateCustomer"]>;
  type _p = ReturnType<A["updatePassword"]>;
  type _e = ReturnType<A["requestEmailUpdate"]>;
  type _ca = ReturnType<A["createAddress"]>;
  type _ua = ReturnType<A["updateAddress"]>;
  type _da = ReturnType<A["deleteAddress"]>;
  expect(true).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/core`
Expected: FAIL — missing methods on contract interfaces.

**Step 3: Write minimal implementation**

Expand `contracts.ts`:

```ts
// CartService additions
export interface CartService {
  getActiveCart(userId: string): Promise<ActiveCartDto>;
  addItem(input: AddCartItemInputDto): Promise<void>;
  removeItem(input: { cartId: string; lineItemId: string }): Promise<void>;
  adjustQuantity(input: { cartId: string; lineItemId: string; quantity: number }): Promise<void>;
  applyPromotionCode(input: { cartId: string; code: string }): Promise<void>;
  removePromotionCode(input: { cartId: string; code: string }): Promise<void>;
}

// CheckoutService additions
export interface CheckoutService {
  placeOrder(cartId: string): Promise<PlaceOrderResultDto>;
  setShippingAddress(input: { cartId: string; address: AddressInputDto }): Promise<void>;
  setShippingMethod(input: { cartId: string; methodId: string }): Promise<void>;
  setCustomerForOrder(input: { cartId: string; email: string; firstName: string; lastName: string }): Promise<void>;
  transitionToArrangingPayment(cartId: string): Promise<void>;
}

// AccountService (new — replaces the minimal getProfile)
export interface AccountService {
  getProfile(userId: string): Promise<ProfileDto>;
  getActiveCustomer(): Promise<CustomerDto>;
  updateCustomer(input: UpdateCustomerInputDto): Promise<void>;
  updatePassword(input: { currentPassword: string; newPassword: string }): Promise<void>;
  requestEmailUpdate(input: { password: string; newEmailAddress: string }): Promise<void>;
  createAddress(input: AddressInputDto): Promise<{ id: string }>;
  updateAddress(input: { id: string } & AddressInputDto): Promise<void>;
  deleteAddress(id: string): Promise<void>;
  setDefaultShippingAddress(id: string): Promise<void>;
  setDefaultBillingAddress(id: string): Promise<void>;
}
```

Expand `dto.ts` with new DTOs:

```ts
export interface AddressInputDto {
  fullName?: string;
  company?: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  phoneNumber?: string;
}

export interface UpdateCustomerInputDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ProfileDto {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface CustomerDto extends ProfileDto {
  phoneNumber?: string;
  addresses?: Array<{ id: string } & AddressInputDto>;
}
```

Re-export `AccountService` from `index.ts`.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/core`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/contracts.ts packages/core/src/dto.ts packages/core/src/contracts.test.ts packages/core/src/index.ts
git commit -m "feat(core): expand contract surface for full storefront parity operations"
```

---

### Task 10B: Expand Vendure Adapter For New Contract Operations

**Why:** The Vendure adapter currently only maps signIn/signOut/listCollections/getActiveCart/addItem/placeOrder/getByCode/getProfile. Must cover all new contract methods so storefront actions can route through the container in vendure mode.

**Files:**
- Modify: `packages/adapter-vendure/src/index.ts`
- Modify: `packages/adapter-vendure/src/index.test.ts`
- Create: `packages/adapter-vendure/src/checkout.test.ts`
- Create: `packages/adapter-vendure/src/accounts.test.ts`

**Step 1: Write the failing tests**

```ts
// packages/adapter-vendure/src/checkout.test.ts
it("setShippingAddress maps errors to ProviderError", async () => {
  const svc = createVendureServices({ query: vi.fn().mockRejectedValue(new Error("500")) } as never);
  await expect(
    svc.checkout.setShippingAddress({ cartId: "c1", address: { streetLine1: "x", city: "y", postalCode: "z", countryCode: "US" } }),
  ).rejects.toThrow(/ProviderError/);
});

it("transitionToArrangingPayment maps errors to ProviderError", async () => {
  const svc = createVendureServices({ query: vi.fn().mockRejectedValue(new Error("500")) } as never);
  await expect(svc.checkout.transitionToArrangingPayment("c1")).rejects.toThrow(/ProviderError/);
});
```

```ts
// packages/adapter-vendure/src/accounts.test.ts
it("updateCustomer maps errors to ProviderError", async () => {
  const svc = createVendureServices({ mutation: vi.fn().mockRejectedValue(new Error("500")) } as never);
  await expect(
    svc.accounts.updateCustomer({ firstName: "Test" }),
  ).rejects.toThrow(/ProviderError/);
});

it("createAddress maps errors to ProviderError", async () => {
  const svc = createVendureServices({ mutation: vi.fn().mockRejectedValue(new Error("500")) } as never);
  await expect(
    svc.accounts.createAddress({ streetLine1: "x", city: "y", postalCode: "z", countryCode: "US" }),
  ).rejects.toThrow(/ProviderError/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-vendure`
Expected: FAIL — missing checkout/accounts methods.

**Step 3: Write minimal implementation**

Add all new methods to `createVendureServices` in `index.ts`:

Cart additions: `removeItem`, `adjustQuantity`, `applyPromotionCode`, `removePromotionCode` — each wraps `mutate()` call in try/catch → ProviderError.

Checkout additions: `setShippingAddress`, `setShippingMethod`, `setCustomerForOrder`, `transitionToArrangingPayment` — same pattern.

Account additions: `getActiveCustomer`, `updateCustomer`, `updatePassword`, `requestEmailUpdate`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultShippingAddress`, `setDefaultBillingAddress` — same pattern.

All follow existing pattern: `try { await mutate(DocumentName, input); } catch (err) { throw new ProviderError("VENDURE_XXX_FAILED", \`ProviderError: \${String(err)}\`); }`

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-vendure`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-vendure/src/index.ts packages/adapter-vendure/src/index.test.ts packages/adapter-vendure/src/checkout.test.ts packages/adapter-vendure/src/accounts.test.ts
git commit -m "feat(adapter-vendure): implement full parity contract surface"
```

---

### Task 10C: Expand Supabase Adapter For New Contract Operations

**Why:** Same gap as Vendure — Supabase adapter only has getProfile, listProducts, getActiveCart/addItem, placeOrder, getByCode. Must cover all new contract methods.

**Files:**
- Modify: `packages/adapter-supabase/src/cart.ts`
- Modify: `packages/adapter-supabase/src/checkout.ts`
- Modify: `packages/adapter-supabase/src/accounts.ts`
- Modify: `packages/adapter-supabase/src/index.ts`
- Modify: `packages/adapter-supabase/src/cart.test.ts`
- Modify: `packages/adapter-supabase/src/checkout.test.ts`
- Modify: `packages/adapter-supabase/src/accounts.test.ts`

**Step 1: Write the failing tests**

```ts
// cart.test.ts additions
it("removeItem deletes from cart_items", async () => {
  const svc = createCartService(mockDb());
  await svc.addItem({ cartId: "c1", variantId: "v1", quantity: 1 });
  await expect(svc.removeItem({ cartId: "c1", lineItemId: "li1" })).resolves.not.toThrow();
});

it("adjustQuantity updates cart_items quantity", async () => {
  const svc = createCartService(mockDb());
  await expect(svc.adjustQuantity({ cartId: "c1", lineItemId: "li1", quantity: 5 })).resolves.not.toThrow();
});
```

```ts
// checkout.test.ts additions
it("setShippingAddress persists address to order", async () => {
  const svc = createCheckoutService(mockDb());
  await expect(
    svc.setShippingAddress({ cartId: "c1", address: { streetLine1: "123 Main", city: "NYC", postalCode: "10001", countryCode: "US" } }),
  ).resolves.not.toThrow();
});
```

```ts
// accounts.test.ts additions
it("createAddress inserts address row and returns id", async () => {
  const svc = createAccountsService(mockDb());
  const result = await svc.createAddress({ streetLine1: "123 Main", city: "NYC", postalCode: "10001", countryCode: "US" });
  expect(result).toMatchObject({ id: expect.any(String) });
});

it("updateCustomer updates profile fields", async () => {
  const svc = createAccountsService(mockDb());
  await expect(svc.updateCustomer({ firstName: "Updated" })).resolves.not.toThrow();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w @fredonbytes/adapter-supabase`
Expected: FAIL — missing methods.

**Step 3: Write minimal implementation**

Cart: `removeItem` deletes from cart_items by id. `adjustQuantity` updates quantity. `applyPromotionCode`/`removePromotionCode` insert/delete from cart_promotions.

Checkout: `setShippingAddress` upserts shipping_address on cart/order. `setShippingMethod` updates shipping_method_id. `setCustomerForOrder` sets customer_email/name on cart. `transitionToArrangingPayment` updates order status.

Accounts: `getActiveCustomer` queries profiles + addresses. `updateCustomer` updates profiles. `updatePassword` calls auth.updateUser. `requestEmailUpdate` calls auth.updateUser. Address CRUD operates on addresses table. `setDefaultShippingAddress`/`setDefaultBillingAddress` update flags.

All follow existing adapter pattern with ProviderError wrapping.

**Step 4: Run test to verify it passes**

Run: `npm run test -w @fredonbytes/adapter-supabase`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/adapter-supabase/src/cart.ts packages/adapter-supabase/src/checkout.ts packages/adapter-supabase/src/accounts.ts packages/adapter-supabase/src/index.ts packages/adapter-supabase/src/cart.test.ts packages/adapter-supabase/src/checkout.test.ts packages/adapter-supabase/src/accounts.test.ts
git commit -m "feat(adapter-supabase): implement full parity contract surface"
```

---

### Task 10D: Migrate Storefront Actions To Container-Only Service Access

**Why:** This is the original Task 10. Now that contracts + adapters cover all operations, storefront actions can replace direct `mutate()` calls with `container.services.xxx`.

**Files:**
- Modify: `apps/storefront/src/app/sign-in/actions.ts`
- Modify: `apps/storefront/src/app/cart/actions.ts`
- Modify: `apps/storefront/src/app/checkout/actions.ts`
- Modify: `apps/storefront/src/app/account/profile/actions.ts`
- Modify: `apps/storefront/src/app/account/addresses/actions.ts`
- Modify: `apps/storefront/src/lib/vendure/actions.ts`
- Create: `apps/storefront/src/lib/fredonbytes/actions.test.ts`

**Step 1: Write the failing test**

```ts
// apps/storefront/src/lib/fredonbytes/actions.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock getServiceContainer to return a fake container
vi.mock("../fredonbytes/container", () => ({
  getServiceContainer: () => ({
    mode: "vendure",
    services: {
      auth: { signIn: vi.fn().mockResolvedValue({ userId: "u1" }), signOut: vi.fn() },
      cart: {
        getActiveCart: vi.fn().mockResolvedValue({ id: "c1", total: 0 }),
        addItem: vi.fn(), removeItem: vi.fn(), adjustQuantity: vi.fn(),
        applyPromotionCode: vi.fn(), removePromotionCode: vi.fn(),
      },
      checkout: {
        placeOrder: vi.fn().mockResolvedValue({ orderCode: "ORD-1" }),
        setShippingAddress: vi.fn(), setShippingMethod: vi.fn(),
        setCustomerForOrder: vi.fn(), transitionToArrangingPayment: vi.fn(),
      },
      accounts: {
        getProfile: vi.fn().mockResolvedValue({ userId: "u1", email: "a@b.com" }),
        getActiveCustomer: vi.fn().mockResolvedValue({ userId: "u1", email: "a@b.com" }),
        updateCustomer: vi.fn(), updatePassword: vi.fn(), requestEmailUpdate: vi.fn(),
        createAddress: vi.fn().mockResolvedValue({ id: "addr1" }),
        updateAddress: vi.fn(), deleteAddress: vi.fn(),
        setDefaultShippingAddress: vi.fn(), setDefaultBillingAddress: vi.fn(),
      },
    },
  }),
}));

describe("storefront actions resolve through service container", () => {
  it("sign-in action uses container auth service", async () => {
    // Import after mock is set up
    const { loginAction } = await import("../../app/sign-in/actions");
    // The action should NOT import mutate or any Vendure-specific module
    expect(loginAction).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -w storefront`
Expected: FAIL — actions still import `mutate` from Vendure client.

**Step 3: Write minimal implementation**

For each action file, replace the pattern:
```ts
// BEFORE (every action file)
const container = getServiceContainer();
// ... direct mutate(SomeMutation, vars) ...
```

With:
```ts
// AFTER
const container = getServiceContainer();
await container.services.cart.removeItem({ cartId, lineItemId });
// etc.
```

**sign-in/actions.ts:** Replace `mutate(LoginMutation)` → `container.services.auth.signIn({ email, password })`. Replace `mutate(LogoutMutation)` → `container.services.auth.signOut()`.

**cart/actions.ts:** Replace all 4 `mutate()` calls with corresponding `container.services.cart.*` methods.

**checkout/actions.ts:** Replace all 6 `mutate()` calls with `container.services.checkout.*` methods. Remove local `AddressInput` interface — use `AddressInputDto` from core.

**account/profile/actions.ts:** Replace 3 `mutate()` calls with `container.services.accounts.*` methods.

**account/addresses/actions.ts:** Replace 5 `mutate()` calls with `container.services.accounts.*` methods. Remove local `AddressInput`/`UpdateAddressInput` — use core DTOs.

**lib/vendure/actions.ts:** Replace `query(GetActiveCustomerQuery)` with `container.services.accounts.getActiveCustomer()`.

**Important constraint:** Preserve existing error handling semantics (return {error} objects). Preserve `revalidatePath`/`revalidateTag`/`redirect` calls. Only change the data access layer.

**Step 4: Run test to verify it passes**

Run: `npm run test -w storefront`
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/storefront/src/app/sign-in/actions.ts apps/storefront/src/app/cart/actions.ts apps/storefront/src/app/checkout/actions.ts apps/storefront/src/app/account/profile/actions.ts apps/storefront/src/app/account/addresses/actions.ts apps/storefront/src/lib/vendure/actions.ts apps/storefront/src/lib/fredonbytes/actions.test.ts
git commit -m "refactor(storefront): route all parity-critical actions through core service container"
```

---

### Task 11: Dual-Adapter Contract Matrix For Parity Domains

**Why:** Prove both adapters satisfy the same behavioral contract. Follows the pattern already established by `auth.contract.ts`.

**Files:**
- Create: `packages/core/src/contract-tests/cart.contract.ts`
- Create: `packages/core/src/contract-tests/checkout.contract.ts`
- Create: `packages/core/src/contract-tests/accounts.contract.ts`
- Create: `packages/adapter-supabase/src/cart.contract.test.ts`
- Create: `packages/adapter-supabase/src/checkout.contract.test.ts`
- Create: `packages/adapter-supabase/src/accounts.contract.test.ts`
- Create: `packages/adapter-vendure/src/cart.contract.test.ts`
- Create: `packages/adapter-vendure/src/checkout.contract.test.ts`
- Create: `packages/adapter-vendure/src/accounts.contract.test.ts`

**Step 1: Write the failing test**

```ts
// packages/core/src/contract-tests/cart.contract.ts
import { describe, it, expect } from "vitest";
import type { CartService } from "../contracts";

export function runCartContractTests(
  name: string,
  makeCart: () => CartService,
) {
  describe(`${name} cart contract`, () => {
    it("getActiveCart returns { id, total }", async () => {
      const cart = await makeCart().getActiveCart("u1");
      expect(cart).toEqual({ id: expect.any(String), total: expect.any(Number) });
    });

    it("addItem does not throw on valid input", async () => {
      await expect(
        makeCart().addItem({ cartId: "c1", variantId: "v1", quantity: 1 }),
      ).resolves.not.toThrow();
    });

    it("removeItem does not throw on valid input", async () => {
      await expect(
        makeCart().removeItem({ cartId: "c1", lineItemId: "li1" }),
      ).resolves.not.toThrow();
    });
  });
}
```

```ts
// packages/core/src/contract-tests/checkout.contract.ts
export function runCheckoutContractTests(
  name: string,
  makeCheckout: () => CheckoutService,
) {
  describe(`${name} checkout contract`, () => {
    it("placeOrder returns { orderCode }", async () => {
      const result = await makeCheckout().placeOrder("c1");
      expect(result).toMatchObject({ orderCode: expect.any(String) });
    });

    it("setShippingAddress does not throw on valid input", async () => {
      await expect(
        makeCheckout().setShippingAddress({
          cartId: "c1",
          address: { streetLine1: "123", city: "NYC", postalCode: "10001", countryCode: "US" },
        }),
      ).resolves.not.toThrow();
    });
  });
}
```

```ts
// packages/core/src/contract-tests/accounts.contract.ts
export function runAccountsContractTests(
  name: string,
  makeAccounts: () => AccountService,
) {
  describe(`${name} accounts contract`, () => {
    it("getProfile returns { userId, email }", async () => {
      const profile = await makeAccounts().getProfile("u1");
      expect(profile).toMatchObject({ userId: expect.any(String), email: expect.any(String) });
    });

    it("createAddress returns { id }", async () => {
      const result = await makeAccounts().createAddress({
        streetLine1: "123", city: "NYC", postalCode: "10001", countryCode: "US",
      });
      expect(result).toMatchObject({ id: expect.any(String) });
    });
  });
}
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — adapter contract test files don't exist yet, then FAIL when created because adapter mocks need wiring.

**Step 3: Write minimal implementation**

Each adapter contract test file (6 total) follows the auth.contract.test pattern:
- Import `runXxxContractTests` from core
- Create adapter-specific mock/fixture
- Call the contract function

Example (supabase cart):
```ts
// packages/adapter-supabase/src/cart.contract.test.ts
import { runCartContractTests } from "@fredonbytes/core/contract-tests/cart.contract";
import { createCartService } from "./cart";
import { mockDb } from "./test-helpers"; // or inline mock

runCartContractTests("supabase", () => createCartService(mockDb()));
```

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS across all workspace suites.

**Step 5: Commit**

```bash
git add packages/core/src/contract-tests/ packages/adapter-supabase/src/*.contract.test.ts packages/adapter-vendure/src/*.contract.test.ts
git commit -m "test(core): add cart, checkout, and accounts dual-adapter contract matrix"
```

---

### Task 12: Enforce Dual-Mode E2E In CI And Remove Vendure Deferral

**Why:** CI currently skips Vendure E2E. E2E tests are stub-level (navigate + check URL). Both must be fixed for parity evidence.

**Files:**
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/auth.spec.ts`
- Modify: `tests/e2e/cart.spec.ts`
- Modify: `tests/e2e/starter.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/testing/strategy.md`

**Step 1: Write the failing test**

```ts
// tests/e2e/auth.spec.ts — expand
import { test, expect } from "@playwright/test";

test("auth sign-in page renders form fields", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/sign-in/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  // Verify form elements exist
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("auth sign-in shows error on invalid credentials", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("invalid@test.com");
  await page.getByLabel(/password/i).fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Should show error, not redirect
  await expect(page).toHaveURL(/sign-in/);
});
```

```ts
// tests/e2e/cart.spec.ts — expand
test("cart page shows empty state or items", async ({ page }) => {
  await page.goto("/cart");
  await expect(page).toHaveURL(/cart/);
  // Cart page should render (either empty message or items list)
  const content = page.locator("main");
  await expect(content).toBeVisible();
});
```

```ts
// tests/e2e/starter.spec.ts — expand
test("starter homepage renders and navigates", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /fredonbytes starter/i })).toBeVisible();
  // Verify the app loaded properly (not a blank page or error)
  const title = await page.title();
  expect(title).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- --project=vendure` and `npm run test:e2e -- --project=supabase`
Expected: FAIL — new assertions not yet met.

**Step 3: Write minimal implementation**

Update `playwright.config.ts` if needed for proper test matching.

Update `.github/workflows/ci.yml` — remove the Vendure deferral comment and add:
```yaml
- run: npm run test:e2e -- --project=vendure
- run: npm run test:e2e -- --project=supabase
```

Update `docs/testing/strategy.md` with comprehensive testing strategy covering:
- Unit tests: core contracts, DTOs, config, adapter mappings
- Contract tests: dual-adapter matrix (auth, cart, checkout, accounts)
- Integration tests: Supabase auth/RLS, Vendure GraphQL mapping
- E2E tests: dual-mode (vendure project + supabase project)
- CI: runs all gates, no deferred modes

**Step 4: Run test to verify it passes**

Run: `npm run test && npm run build && npm run test:e2e -- --project=vendure && npm run test:e2e -- --project=supabase`
Expected: PASS for both projects.

**Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/ .github/workflows/ci.yml docs/testing/strategy.md
git commit -m "test(ci): enforce dual-mode parity e2e gates for vendure and supabase"
```

---

### Task 13: Integration And Migration Docs Hardening

**Why:** Docs currently lack DATABASE_URL guidance, server-only secret instructions, and migration path for existing Vendure users.

**Files:**
- Modify: `docs/integration/nextjs-existing-app.md`
- Create: `docs/integration/migration-vendure-to-fredonbytes.md`
- Modify: `docs/testing/strategy.md` (if not already updated in Task 12)
- Modify: `apps/starter-next/.env.example`
- Modify: `README.md`

**Step 1: Write the failing test**

```bash
# Verify required content exists in docs
rg -l "DATABASE_URL" docs/integration/nextjs-existing-app.md docs/integration/migration-vendure-to-fredonbytes.md
rg -l "SUPABASE_SERVICE_ROLE_KEY.*server" docs/integration/nextjs-existing-app.md
rg -l "vendure mode|supabase mode" docs/integration/migration-vendure-to-fredonbytes.md
```

**Step 2: Run test to verify it fails**

Run: commands above
Expected: FAIL — migration doc doesn't exist, nextjs-existing-app.md missing DATABASE_URL.

**Step 3: Write minimal implementation**

**`docs/integration/nextjs-existing-app.md`** — add sections:
- Required environment variables table with DATABASE_URL
- Server-only secrets warning for SUPABASE_SERVICE_ROLE_KEY
- Client-safe vs server config distinction

**`docs/integration/migration-vendure-to-fredonbytes.md`** — create with:
- Overview of migration from direct Vendure to FredonBytes container
- Step-by-step: install packages → config → container → action rewiring
- Running in vendure mode vs supabase mode
- Dual-mode testing guidance
- Compatibility mapping columns explanation

**`apps/starter-next/.env.example`** — add DATABASE_URL, ensure all required keys documented.

**`README.md`** — add links to integration and migration docs.

**Step 4: Run test to verify it passes**

Run: same `rg` commands
Expected: PASS with all required matches.

**Step 5: Commit**

```bash
git add docs/integration/ README.md apps/starter-next/.env.example
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

- All workspace unit + contract tests pass (including new dual-adapter contract matrix).
- Build succeeds for all packages and apps.
- Vendure E2E passes with real form assertions.
- Supabase E2E passes for starter app.
- CI mirrors local verification and enforces both modes.

---

## Task Dependency Graph

```
Task 10A (expand contracts)
  ├── Task 10B (vendure adapter) ──┐
  └── Task 10C (supabase adapter) ─┤
                                    └── Task 10D (rewire actions) ── Task 11 (contract matrix)
                                                                          │
                                                                    Task 12 (E2E + CI)
                                                                          │
                                                                    Task 13 (docs)
```

Tasks 10B and 10C are independent and can run in parallel after 10A.
Tasks 12 and 13 can run in parallel after 11.
