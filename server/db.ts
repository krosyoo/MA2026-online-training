import { ConfigurationError, databaseUrl } from "./env";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

export type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | undefined;

/**
 * Opens the connection on first use and reuses it afterwards, so a warm
 * serverless invocation does not reconnect.
 *
 * Neon is reached over its HTTP driver: it is stateless, so it survives the
 * cold-start/teardown cycle without leaking connections. Any other Postgres (a
 * local instance during development) goes through node-postgres.
 *
 * Neither driver supports interactive transactions here, so every write in
 * `storage.ts` is expressed as a single statement.
 */
export function getDb(): Database {
  if (cached) return cached;

  const connectionString = databaseUrl();
  if (!connectionString) {
    throw new ConfigurationError(
      "DATABASE_URL is not set. On Vercel, create the database from " +
        "Storage → Create Database (Neon); the connection string is injected " +
        "into the project automatically. Locally, copy .env.example to .env.",
    );
  }

  if (/\.neon\.(tech|build)/.test(connectionString)) {
    cached = drizzleNeonHttp(neon(connectionString), { schema });
  } else {
    // The two drivers expose the same query builder for everything used here.
    cached = drizzleNodePg(new Pool({ connectionString }), {
      schema,
    }) as unknown as Database;
  }

  return cached;
}
