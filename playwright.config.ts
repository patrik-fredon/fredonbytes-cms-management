import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  webServer: [
    {
      command: "npm run dev:storefront",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev -w starter-next",
      port: 3002,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "vendure",
      testMatch: /.*(auth|cart)\.spec\.ts/,
      use: {
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "supabase",
      testMatch: /.*starter\.spec\.ts/,
      use: {
        baseURL: "http://localhost:3002",
      },
    },
  ],
});
