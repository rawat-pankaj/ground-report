import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

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

  const { password } = await request.json();
  const trimmed = (password || "").trim();

  if (!trimmed || trimmed !== process.env.ADMIN_PASSWORD) {
    await delay(FAILED_ATTEMPT_DELAY_MS);
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set("admin_session", process.env.ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
