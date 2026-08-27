import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "portal_admin_session";

function requiredSecret() {
  const value = process.env.ADMIN_SESSION_SECRET || "";
  if (value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  }
  return value;
}

function expectedToken() {
  return crypto
    .createHmac("sha256", requiredSecret())
    .update("portal-admin-v2")
    .digest("hex");
}

export function createAdminToken() {
  return expectedToken();
}

export function verifyAdminPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || expected.length < 12) return false;

  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);

  if (left.length !== right.length) return false;

  try {
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const store = await cookies();
  const current = store.get(COOKIE_NAME)?.value || "";
  const expected = expectedToken();

  if (current.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(current),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export const adminCookieName = COOKIE_NAME;
