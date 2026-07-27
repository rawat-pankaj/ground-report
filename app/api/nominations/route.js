import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const MAX_INPUT_LENGTH = 500;
const MAX_REASON_LENGTH = 1000;
const MAX_CONTACT_LENGTH = 200;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(request) {
  // Vercel sets x-forwarded-for; take the first (client) address.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentCount = await prisma.nominationRateLimit.count({
    where: { ipAddress: ip, createdAt: { gte: windowStart } },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Too many suggestions from this connection. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const input = (body.input || "").trim().slice(0, MAX_INPUT_LENGTH);
  const type = body.type === "video" ? "video" : "channel";

  if (!input) {
    return NextResponse.json({ error: "A link or name is required" }, { status: 400 });
  }

  const reasonText = (body.reasonText || "").trim().slice(0, MAX_REASON_LENGTH) || null;
  const submitterContact = (body.submitterContact || "").trim().slice(0, MAX_CONTACT_LENGTH) || null;

  const nomination = await prisma.nomination.create({
    data: { type, input, reasonText, submitterContact },
  });

  // Record this submission for rate limiting, and opportunistically clear
  // old rows so the table doesn't grow unbounded. Best-effort: if this
  // fails, the nomination itself has already succeeded.
  await prisma.nominationRateLimit
    .create({ data: { ipAddress: ip } })
    .catch(() => {});
  prisma.nominationRateLimit
    .deleteMany({ where: { createdAt: { lt: windowStart } } })
    .catch(() => {});

  return NextResponse.json({ nomination });
}
