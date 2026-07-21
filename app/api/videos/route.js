import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");
  const beat = searchParams.get("beat");

  const where = { status: "published" };
  if (language) where.language = language;
  if (beat) where.beatTags = { contains: beat };

  const videos = await prisma.video.findMany({
    where,
    include: { channel: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ videos });
}