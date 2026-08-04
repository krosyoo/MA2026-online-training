import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { ConfigurationError, sessionSecret } from "./env";
import { getUserRole } from "./storage";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const SESSION_COOKIE = "ma_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const KEY_LENGTH = 64;

export interface SessionUser {
  id: string;
  role: "student" | "admin";
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: SessionUser;
  }
}

/**
 * Read lazily so a missing secret surfaces on the routes that need it rather
 * than taking down every route, including /api/health.
 */
function getSecret(): Uint8Array {
  const secret = sessionSecret();
  if (!secret) {
    throw new ConfigurationError(
      "SESSION_SECRET is missing or shorter than 32 characters. Generate one " +
        "with `openssl rand -base64 32` and add it to the project's " +
        "environment variables.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * For admin-initiated password resets: there is no email provider configured
 * (Vercel-only deployment), so recovery is admin-mediated instead of a
 * self-service emailed link. The admin relays this value to the student
 * out-of-band; the API returns it exactly once and never stores it in
 * plaintext.
 */
export function generateTemporaryPassword(): string {
  // Base64url avoids characters that are awkward to read aloud or paste.
  return randomBytes(9).toString("base64url");
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (expected.length !== KEY_LENGTH) return false;

  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      role: payload.role === "admin" ? "admin" : "student",
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function attachSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token.length > 0) {
    req.auth = (await readSessionToken(token)) ?? undefined;
  }
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.auth) {
    res.status(401).json({ message: "로그인이 필요합니다." });
    return;
  }
  next();
}

/**
 * The role inside the token can go stale if an account is demoted, so admin
 * access is re-checked against the database on every privileged request.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ message: "로그인이 필요합니다." });
    return;
  }

  const role = await getUserRole(req.auth.id);
  if (role !== "admin") {
    res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
    return;
  }
  next();
}
