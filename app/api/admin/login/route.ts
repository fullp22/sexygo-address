import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieName,
  createAdminToken,
  verifyAdminPassword,
} from "@/lib/admin-auth";

type AttemptState = {
  count: number;
  resetAt: number;
};

const globalRateState = globalThis as unknown as {
  adminLoginAttempts?: Map<string, AttemptState>;
};

const attempts =
  globalRateState.adminLoginAttempts ??
  new Map<string, AttemptState>();

if (!globalRateState.adminLoginAttempts) {
  globalRateState.adminLoginAttempts = attempts;
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

function currentAttempt(key: string) {
  const now = Date.now();
  const state = attempts.get(key);

  if (!state || state.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, fresh);
    return fresh;
  }

  return state;
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);
  const state = currentAttempt(key);

  if (state.count >= MAX_FAILURES) {
    return NextResponse.redirect(
      new URL("/admin/login?error=locked", request.url),
      303,
    );
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");

  if (!verifyAdminPassword(password)) {
    state.count += 1;
    attempts.set(key, state);

    return NextResponse.redirect(
      new URL("/admin/login?error=1", request.url),
      303,
    );
  }

  attempts.delete(key);

  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(adminCookieName, createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
