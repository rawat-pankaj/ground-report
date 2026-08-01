import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

const MAX_LANGUAGE_LENGTH = 20;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // `beat` was removed as a public filter: no UI produces it, and as a
  // substring match (`contains`) it let an arbitrary caller-supplied string
  // drive an unbounded query. Beat tags remain in the DB for admin use.
  const language = (searchParams.get("language") || "").slice(0, MAX_LANGUAGE_LENGTH) || null;

  const where = { status: "published" };
  if (language) where.language = language;

  const videos = await prisma.video.findMany({
    where,
    include: { channel: true },
    orderBy: { addedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ videos });
}