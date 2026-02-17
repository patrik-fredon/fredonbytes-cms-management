import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@fredonbytes/config": fileURLToPath(
        new URL("../../packages/config/src/index.ts", import.meta.url),
      ),
      "@fredonbytes/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
      "@fredonbytes/adapter-vendure": fileURLToPath(
        new URL("../../packages/adapter-vendure/src/index.ts", import.meta.url),
      ),
      "@fredonbytes/adapter-supabase": fileURLToPath(
        new URL("../../packages/adapter-supabase/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
  },
});
