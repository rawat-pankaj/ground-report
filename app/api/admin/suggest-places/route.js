import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { suggestPlacesForVideos } from "../../../../lib/youtube";
import { suggestPlace } from "../../../../lib/places";

export const dynamic = "force-dynamic";

const MAX_SCAN = 500;

// Read-only scan for Admin -> Places: suggests a place for every video whose
// Place is empty. Nothing is saved here; the admin reviews the list and saving
// goes through ./apply. A video YouTube no longer returns still gets a
// suggestion from its stored title. Gated by proxy.js like every /api/admin/* route.
export async function POST() {
  const videos = await prisma.video.findMany({
    where: { OR: [{ place: null }, { place: "" }] },
    select: {
      id: true,
      youtubeVideoId: true,
      title: true,
      status: true,
      channel: { select: { name: true } },
    },
    orderBy: { addedAt: "desc" },
    take: MAX_SCAN,
  });

  let fromYouTube;
  try {
    fromYouTube = await suggestPlacesForVideos(videos.map((v) => v.youtubeVideoId));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  const suggestions = [];
  for (const v of videos) {
    const place = fromYouTube[v.youtubeVideoId] ?? suggestPlace({ title: v.title });
    if (!place) continue;
    suggestions.push({
      id: v.id,
      youtubeVideoId: v.youtubeVideoId,
      title: v.title,
      channel: v.channel?.name || "Unknown",
      status: v.status,
      place,
    });
  }

  return NextResponse.json({
    scanned: videos.length,
    scannedAt: new Date().toISOString(),
    suggestions,
  });
}
