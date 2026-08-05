import { config } from "dotenv";

/**
 * Loads `.env` for local development. On Vercel the file does not exist and
 * real environment variables are already present — dotenv never overwrites
 * those, so importing this module is a no-op there.
 *
 * Import it before anything that reads `process.env` at module scope.
 */
config();

/**
 * A required environment variable is missing or malformed. Raised lazily, on
 * the first request that needs the setting, rather than at import time: a
 * module-level throw takes down every route including /api/health, which is
 * the one endpoint that should still answer while a deployment is being
 * configured.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function sessionSecret(): string | undefined {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : undefined;
}
