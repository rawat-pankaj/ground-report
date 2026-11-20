import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getVideoSnippets } from "../../../../lib/youtube";
import { classifyNote } from "../../../../lib/noteCheck";
import { requireAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

// Read-only check for Admin -> Notes: compares every saved "Why this matters"
// note with its video's YouTube description and title (lib/noteCheck.js).
// Changes nothing; editing stays on Published Videos. Gated by proxy.js like
// every /api/admin/* route.
export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const videos = await prisma.video.findMany({
    where: { AND: [{ curatorNote: { not: null } }, { curatorNote: { not: "" } }] },
    select: {
      id: true,
      youtubeVideoId: true,
      title: true,
      status: true,
      curatorNote: true,
      channel: { select: { name: true } },
    },
    orderBy: { addedAt: "desc" },
    take: 1000,
  });

  let snippets;
  try {
    snippets = await getVideoSnippets(videos.map((v) => v.youtubeVideoId));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  const notes = videos
    .filter((v) => v.curatorNote.trim())
    .map((v) => {
      const yt = snippets[v.youtubeVideoId];
      return {
        id: v.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        channel: v.channel?.name || "Unknown",
        status: v.status,
        note: v.curatorNote,
        // A video gone from YouTube can't be compared; judge it on its own text.
        kind: classifyNote(v.curatorNote, { description: yt?.description || "", title: yt?.title || v.title }),
      };
    });

  return NextResponse.json({ checkedAt: new Date().toISOString(), notes });
}
