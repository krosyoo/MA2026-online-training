import "./env";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. On Vercel, create the database from " +
      "Storage → Create Database (Neon); the connection string is injected " +
      "into the project automatically. Locally, copy .env.example to .env.",
  );
}

/**
 * Neon is reached over its HTTP driver: it is stateless, so it survives the
 * serverless cold-start/teardown cycle without leaking connections. Any other
 * Postgres (a local instance during development) goes through node-postgres.
 *
 * Neither driver supports interactive transactions here, so every write in
 * `storage.ts` is expressed as a single statement.
 */
const isNeon = /\.neon\.(tech|build)/.test(connectionString);

export type Database = NeonHttpDatabase<typeof schema>;

function createDb(): Database {
  if (isNeon) {
    return drizzleNeonHttp(neon(connectionString), { schema });
  }

  const pool = new Pool({ connectionString });
  // The two drivers expose the same query builder for everything used here.
  return drizzleNodePg(pool, { schema }) as unknown as Database;
}

export const db = createDb();
