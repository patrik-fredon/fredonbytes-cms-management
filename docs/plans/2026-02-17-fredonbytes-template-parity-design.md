# FredonBytes Template Parity-First Design (Option 1)

Date: 2026-02-17  
Status: Approved

## 1. Scope Lock And Acceptance Gates

This design is complete only when all of the following are true:

1. Existing Vendure storefront functionality remains operational in `vendure` mode for parity-critical journeys.
2. A package-first FredonBytes architecture is usable for both new and existing Next.js apps.
3. Supabase/Postgres integration is real implementation, not scaffolding.
4. App feature code is provider-agnostic and routes through core contracts + container.
5. Completion is evidence-based (unit/contract/integration/E2E and CI gates).

## 2. Target Architecture And Boundaries

Repository target:

- `packages/core`: full domain contracts, DTOs, normalized errors, service container.
- `packages/config`: strict runtime config schema with server/client-safe accessors.
- `packages/adapter-supabase`: full domain implementation with Supabase Auth + Postgres.
- `packages/adapter-vendure`: mapped Vendure implementations preserving current behavior.
- `packages/ui`: provider and hooks consuming core service container.
- `apps/storefront`: parity app routed through core contracts.
- `apps/starter-next`: generalized starter following the same contract.

Migration boundary rules:

1. Preserve storefront behavior first.
2. Migrate domain by domain behind stable contracts.
3. Gate each domain migration with contract tests and targeted E2E.

## 3. Config, Secrets, And Data Model Constraints

Mode selector:

- `FREDONBYTES_MODE=supabase|vendure`

Required keys by mode:

- `supabase`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (required for migrations/server jobs).
- `vendure`: `VENDURE_SHOP_API_URL`, `VENDURE_CHANNEL_TOKEN` (+ optional header overrides).

Secret-handling rules:

- Service role key must remain server-only.
- Config package exposes server/full config and client-safe/public config separately.
- CI guard verifies no service role key exposure in client bundles.

Supabase/Postgres domain coverage (minimum):

- Accounts: profiles, addresses, preferences.
- Catalog: products, variants, collections, media, inventory.
- Cart/checkout: carts, cart_items, promotions, shipping methods.
- Orders: orders, order_items, payments, shipments, status history.
- CMS/media: pages, blocks, media mapping.
- Compatibility mapping columns for source Vendure identifiers where needed.

Data quality:

- Idempotent migrations.
- Deterministic seed data.
- Tested RLS for customer-scoped reads/writes.

## 4. Error Model, Test Matrix, And Delivery Milestones

Error model:

- Core error taxonomy: `AuthError`, `ValidationError`, `NotFoundError`, `ConflictError`, `PaymentError`, `ProviderError`.
- Adapters map provider-native errors to core errors.
- Route handlers expose stable mode-independent error envelopes.

Test matrix:

1. Unit tests for contracts, DTOs, config, mappings.
2. Contract tests run identically for Supabase and Vendure adapters.
3. Integration tests for Supabase auth/RLS/data and Vendure GraphQL mapping semantics.
4. E2E for both `vendure` and `supabase` projects in CI (no deferred Vendure gate).
5. Verification commands required before any completion claim.

Phased delivery:

1. Complete core contract surface and remove adapter stubs.
2. Migrate storefront actions/routes to container-only service resolution.
3. Implement full Supabase schema + domain services for parity-critical journeys.
4. Enforce dual-mode CI and finalize integration/starter documentation.

## 5. Exit Criteria

Work is considered complete only when:

- Vendure mode behavior is preserved and passing parity E2E.
- Supabase mode passes parity-critical journeys.
- Both adapters satisfy shared contract suites for covered domains.
- Integration docs are sufficient for existing and new Next.js projects.
- CI gates enforce the same success criteria used for local verification.
