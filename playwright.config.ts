import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "vendure",
      use: {
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "supabase",
      use: {
        baseURL: "http://localhost:3002",
      },
    },
  ],
});
