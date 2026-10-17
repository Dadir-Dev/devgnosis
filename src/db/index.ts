import "server-only";

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { env } from "../lib/env";

import * as schema from "./schema";

// Node does not define a global WebSocket; the Neon WebSocket driver needs one.
neonConfig.webSocketConstructor = ws;

// Cache the pool across dev hot reloads so connections are not leaked.
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({ connectionString: env.DATABASE_URL_POOLED });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle({ client: pool, schema });
