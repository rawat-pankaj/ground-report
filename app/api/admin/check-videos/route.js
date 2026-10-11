import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { checkVideoAvailability } from "../../../../lib/youtube";

export const dynamic = "force-dynamic";

// Read-only: reports videos that are no longer watchable but changes nothing.
// Hiding/removing stays an explicit admin action (via the existing
// /api/admin/videos/[id] routes), so a false alarm can never silently pull a
// story off the site. Gated by proxy.js like every /api/admin/* route.
export async function POST() {
  const videos = await prisma.video.findMany({
    select: {
      id: true,
      youtubeVideoId: true,
      title: true,
      status: true,
      featured: true,
      channel: { select: { name: true } },
    },
    orderBy: { addedAt: "desc" },
    take: 500,
  });

  let results;
  try {
    results = await checkVideoAvailability(videos.map((v) => v.youtubeVideoId));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  const problems = videos
    .filter((v) => results[v.youtubeVideoId]?.state && results[v.youtubeVideoId].state !== "ok")
    .map((v) => ({
      id: v.id,
      youtubeVideoId: v.youtubeVideoId,
      title: v.title,
      channel: v.channel?.name || "Unknown",
      status: v.status,
      featured: v.featured,
      state: results[v.youtubeVideoId].state,
      reason: results[v.youtubeVideoId].reason,
    }));

  return NextResponse.json({
    checked: videos.length,
    checkedAt: new Date().toISOString(),
    problems,
  });
}
