import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { readJson, badBody } from "../../../../lib/http";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken } from "../../../../lib/session";

export const dynamic = "force-dynamic";

// Compare SHA-256 digests with timingSafeEqual so the time taken does not depend
// on how many leading characters of the password were right.
function passwordMatches(candidate) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FAILED_ATTEMPT_DELAY_MS = 750;

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentAttempts = await prisma.loginAttempt.count({
    where: { ipAddress: ip, createdAt: { gte: windowStart } },
  });

  if (recentAttempts >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Record this attempt BEFORE checking the password. This must be awaited:
  // serverless functions can be frozen the moment a response is returned, so
  // an un-awaited write may never reach the database — which would leave the
  // counter at zero and silently disable the rate limit entirely.
  // Logins are rare, so the added latency here is irrelevant.
  await prisma.loginAttempt.create({ data: { ipAddress: ip } }).catch(() => {});
  await prisma.loginAttempt
    .deleteMany({ where: { createdAt: { lt: windowStart } } })
    .catch(() => {});

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const trimmed = (typeof body.password === "string" ? body.password : "").trim();

  if (!trimmed || !passwordMatches(trimmed)) {
    await delay(FAILED_ATTEMPT_DELAY_MS);
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  // A signed, expiring token (see lib/session.js), not the password itself.
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
