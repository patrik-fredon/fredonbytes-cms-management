# FredonBytes Template Design (Vendure Fundamentals -> General Next.js Template)

Date: 2026-02-17  
Status: Approved in brainstorming

## 1. Scope And Goals

Transform this repository from a Vendure-centered monorepo into a reusable FredonBytes template for:

- New Next.js projects.
- Existing already-running Next.js projects.

The solution must preserve current functionality while enabling a broader, provider-abstracted architecture with:

- Postgres connection configuration.
- Supabase URL + anon key + service role key configuration.
- Optional Vendure integration as a plugin path, not a hard requirement.

## 2. Key Product Decisions

- Distribution model: Hybrid.
- Vendure position: Optional plugin; non-Vendure default runtime.
- Non-Vendure default scope: Full parity target (auth, accounts, catalog, cart, checkout, orders, CMS/media).
- Migration strategy: Phased.
- Existing app integration contract: Package-first App Router integration.
- Default auth engine in non-Vendure mode: Supabase Auth.

## 3. Architecture Blueprint

Create a modular monorepo with:

- `apps/starter-next`: default Supabase-first FredonBytes app shell.
- `apps/commerce-vendure`: optional Vendure-connected reference shell.
- `packages/core`: provider-agnostic domain contracts and orchestration.
- `packages/adapter-supabase`: default provider implementation.
- `packages/adapter-vendure`: optional Vendure adapter.
- `packages/ui`: route-ready reusable UI/features for App Router.
- `packages/config`: typed environment schema and runtime config resolver.

Runtime mode selection via config:

- `supabase` (default)
- `vendure` (optional)

No hardcoded provider paths in feature code; resolve provider once in container/composition root.

## 4. Component Responsibilities

`packages/core` exposes strict service contracts:

- `AuthService`
- `AccountService`
- `CatalogService`
- `CartService`
- `CheckoutService`
- `OrderService`
- `CmsService`
- `MediaService`

Adapters implement these contracts:

- Supabase adapter:
  - Supabase Auth for identity/session.
  - Supabase Postgres schema + RLS + RPC for commerce/CMS/account/order flows.
  - Service role key restricted to server runtime.
- Vendure adapter:
  - Maps existing Vendure GraphQL operations into core DTOs/contracts.
  - Preserves channel token and auth-token semantics.

UI/features consume only core DTOs and operations (no direct provider SDK usage in feature layer).

## 5. Data Model And Config Strategy

### 5.1 Config

Mode selector:

- `FREDONBYTES_MODE=supabase|vendure`

Supabase mode keys:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- optional `DATABASE_URL`

Vendure mode keys:

- `VENDURE_SHOP_API_URL`
- `VENDURE_CHANNEL_TOKEN`
- optional auth/channel header overrides

Common keys:

- site metadata
- revalidation secret
- auth cookie/header config
- feature flags

All config validated by a typed schema at boot; fail fast on invalid mode/key combinations.

### 5.2 Data

Supabase-first schema includes domains for:

- users/profile
- addresses
- products/variants/collections/inventory
- carts/cart_items/promotions
- orders/order_items/payments/shipments
- cms_pages/cms_blocks/media

Use migration files + deterministic seed scripts.

Migration compatibility metadata preserves source references (for example `vendure_order_id`) while maintaining core canonical IDs.

## 6. Data Flow, Error Model, And Observability

Request path:

`Next.js route/action -> core service -> selected adapter -> provider -> normalized DTO`

Error taxonomy in core:

- `AuthError`
- `ValidationError`
- `NotFoundError`
- `ConflictError`
- `PaymentError`
- `ProviderError`

Adapters convert provider-native errors to core errors.

Observability baseline:

- structured logging (`request_id`, `mode`, `domain`, `operation`, `latency_ms`, `result`)
- readiness checks for selected adapter
- optional metrics hooks per domain operation

Startup behavior:

- fail fast if selected mode is misconfigured or provider is unreachable at boot
- no silent runtime fallback across providers

## 7. Testing Strategy

- Unit tests: core contracts, DTOs, config validation, adapter mapping logic.
- Integration tests: Supabase adapter (RLS/auth/data), Vendure adapter GraphQL mapping.
- Contract tests: same domain test matrix run against both adapters.
- End-to-end tests: full user journeys in `supabase` mode and `vendure` mode.
- Regression baseline: preserve existing repository behavior during phase 1.

## 8. Phased Rollout Plan

1. Phase A: Baseline preservation
   - Wrap current Vendure calls behind core contracts.
   - Keep all existing routes/features working.
2. Phase B: Supabase parity
   - Implement Supabase adapter domain by domain behind feature flags.
   - Run dual adapter test matrix continuously.
3. Phase C: Default flip
   - Make `supabase` the default mode after parity evidence.
   - Retain Vendure adapter as optional plugin.
4. Phase D: Template hardening
   - Publish package-first integration docs.
   - Provide migration guidance for existing Next.js apps.

## 9. Acceptance Criteria

- Existing Vendure functionality remains operational during migration.
- FredonBytes starter runs in Supabase mode with parity-critical journeys passing.
- Existing Next.js apps integrate via package-first contract.
- Typed env validation prevents invalid runtime startup.
- Service-role secrets remain server-only.
- Documentation covers setup, modes, migration path, and troubleshooting.

## 10. Non-Goals (Initial)

- Automatic provider switching during runtime.
- Provider-specific API exposure in shared UI layer.
- Immediate deprecation of Vendure adapter.
