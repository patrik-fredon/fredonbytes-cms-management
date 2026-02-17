# Testing Strategy

- Unit and contract tests run with Vitest via the root workspace config.
- Package-level tests live with each package and expose `vitest.config.ts`.
- End-to-end tests run with Playwright through `npm run test:e2e`.
- CI should run `npm run test` before any build or deployment step.
