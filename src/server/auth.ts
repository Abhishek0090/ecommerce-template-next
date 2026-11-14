import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Minimal single-admin auth: one password from ADMIN_PASSWORD, and a signed,
 * HTTP-only session cookie. Swap for Auth.js, Clerk or your SSO for multiple users or roles.
 *
 * Development defaults: password "admin". In production both env vars are required.
 */
const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours
const isProd = process.env.NODE_ENV === "production";

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (s && s.length >= 32) return s;
  if (isProd) throw new Error("Set ADMIN_SECRET (32+ random characters) to use the admin portal in production.");
  return "dev-only-secret-change-me-dev-only-secret";
}

function password() {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  if (isProd) throw new Error("Set ADMIN_PASSWORD to use the admin portal in production.");
  return "admin";
}

export const usingDevCredentials = () => !process.env.ADMIN_PASSWORD;

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function safeEqual(a: string, b: string) {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string) {
  return safeEqual(candidate, password());
}

export async function startSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const value = `${expires}.${sign(String(expires))}`;
  (await cookies()).set(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, sig] = raw.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
