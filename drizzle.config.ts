import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dbCredentials: {
    // Direct (non-pooled) endpoint of the current Neon branch.
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
