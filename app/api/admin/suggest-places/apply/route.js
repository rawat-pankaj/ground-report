import { NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody } from "../../../../../lib/http";
import { normalizePlace } from "../../../../../lib/places";
import { pingIndexNow } from "../../../../../lib/indexnow";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 500;
const MAX_PLACE_LENGTH = 100;

// Saves the places the admin approved on Admin -> Places. Each place is only
// written if that video's Place is STILL empty, so a place typed by hand (even
// after the scan) is never overwritten. Blank places are skipped.
export async function POST(request) {
  const body = await readJson(request);
  if (!body || typeof body !== "object" || !Array.isArray(body.items)) return badBody();

  const items = body.items
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      id: typeof item?.id === "string" ? item.id : "",
      place: typeof item?.place === "string" ? normalizePlace(item.place.slice(0, MAX_PLACE_LENGTH)) : "",
    }))
    .filter((item) => item.id && item.place);

  let saved = 0;
  const savedIds = [];
  for (const { id, place } of items) {
    const result = await prisma.video.updateMany({
      where: { id, OR: [{ place: null }, { place: "" }] },
      data: { place },
    });
    saved += result.count;
    if (result.count) savedIds.push(id);
  }

  if (saved > 0) {
    revalidateTag("videos");
    // Tell Bing which published video pages changed (lib/indexnow.js).
    after(async () => {
      const videos = await prisma.video.findMany({
        where: { id: { in: savedIds }, status: "published" },
        select: { youtubeVideoId: true },
      });
      await pingIndexNow(videos.map((v) => `/video/${v.youtubeVideoId}`));
    });
  }
  return NextResponse.json({ saved, skipped: items.length - saved });
}
