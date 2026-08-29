import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, type UserRow } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "origin_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "origin-fallback-dev-secret-change-me"
  );
}

/** Is Google OAuth configured in this environment? */
export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Hash a password with scrypt (salted). Format: salt:hash (both hex). */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time verify of a password against a stored salt:hash. */
export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = crypto.scryptSync(password, salt, expected.length);
    return (
      derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

/** Normalize a username: trim + lowercase so login is case-insensitive. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Sign a value with HMAC so the cookie cannot be tampered with. */
function sign(value: string): string {
  const sig = crypto.createHmac("sha256", secret()).update(value).digest("base64url");
  return `${value}.${sig}`;
}

function verify(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret()).update(value).digest("base64url");
  try {
    if (
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return value;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Create a session cookie payload: userId + issued time. */
export async function createSession(userId: string): Promise<void> {
  const payload = JSON.stringify({ uid: userId, iat: Date.now() });
  const token = sign(Buffer.from(payload).toString("base64url"));
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Returns the signed-in user (or null). */
export async function getCurrentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  const value = verify(raw);
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      uid?: string;
    };
    if (!decoded.uid) return null;
    const rows = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Short-lived signed state token for the OAuth handshake (CSRF protection). */
export function makeOAuthState(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${nonce}:${Date.now()}`;
  return sign(Buffer.from(payload).toString("base64url"));
}

export function verifyOAuthState(state: string | null): boolean {
  if (!state) return false;
  const value = verify(state);
  if (!value) return false;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const ts = Number(decoded.split(":")[1]);
    return Number.isFinite(ts) && Date.now() - ts < 10 * 60 * 1000; // 10 min
  } catch {
    return false;
  }
}

/** Build the redirect URI from the incoming request (works on any host). */
export function redirectUri(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}/api/auth/google/callback`;
}

export function originFrom(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
