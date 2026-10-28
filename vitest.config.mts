import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${srcDir}/` },
      // `server-only` throws outside a React Server Component bundle.
      {
        find: "server-only",
        replacement: fileURLToPath(
          new URL("./src/test/server-only.ts", import.meta.url),
        ),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // `src/lib/env.ts` validates these at import time. Tests never connect.
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/devgnosis",
      DATABASE_URL_POOLED:
        "postgresql://user:password@localhost:5432/devgnosis",
    },
  },
});
