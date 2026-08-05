import type { NextFunction, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

interface RateLimitRow {
  count: number;
  window_start: string | Date;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter backed by one upserted row per key. A single
 * `INSERT ... ON CONFLICT DO UPDATE` is atomic per key in Postgres, so
 * concurrent hits on the same key still count correctly without needing a
 * transaction.
 */
async function hitRateLimit(
  key: string,
  windowMs: number,
  max: number,
): Promise<RateLimitResult> {
  const cutoff = new Date(Date.now() - windowMs).toISOString();

  const result = await getDb().execute(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < ${cutoff}::timestamp
                THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < ${cutoff}::timestamp
                THEN now() ELSE rate_limits.window_start END
    RETURNING count, window_start
  `);

  const row = (result as unknown as { rows: RateLimitRow[] }).rows[0];
  if (!row || row.count <= max) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const windowStartMs = new Date(row.window_start).getTime();
  const retryAfterMs = Math.max(0, windowStartMs + windowMs - Date.now());
  return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
}

/**
 * Every distinct client IP leaves a row behind, so without this the table
 * grows without bound. Swept opportunistically rather than on a schedule,
 * because serverless has nowhere to run a periodic job.
 */
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
let lastSweep = 0;

async function sweepExpired(): Promise<void> {
  if (Date.now() - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = Date.now();

  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  await getDb().execute(
    sql`DELETE FROM rate_limits WHERE window_start < ${cutoff}::timestamp`,
  );
}

/**
 * Throttles a route by client IP. Applied to /auth/login and /auth/signup to
 * blunt credential stuffing and signup spam — the per-account lockout in
 * server/storage.ts (recordLoginFailure) is the defense against brute-forcing
 * one known account.
 */
export function rateLimitByIp(
  bucket: string,
  windowMs: number,
  max: number,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Best-effort housekeeping; a failure here must not block the request.
      await sweepExpired().catch(() => {});

      const result = await hitRateLimit(`${bucket}:${req.ip ?? "unknown"}`, windowMs, max);
      if (!result.allowed) {
        res.setHeader("Retry-After", String(result.retryAfterSeconds));
        res.status(429).json({
          message: `요청이 너무 많습니다. ${Math.ceil(result.retryAfterSeconds / 60)}분 후 다시 시도해주세요.`,
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
