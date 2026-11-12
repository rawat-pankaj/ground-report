import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody } from "../../../../../lib/http";

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
      place: typeof item?.place === "string" ? item.place.trim().slice(0, MAX_PLACE_LENGTH) : "",
    }))
    .filter((item) => item.id && item.place);

  let saved = 0;
  for (const { id, place } of items) {
    const result = await prisma.video.updateMany({
      where: { id, OR: [{ place: null }, { place: "" }] },
      data: { place },
    });
    saved += result.count;
  }

  if (saved > 0) revalidateTag("videos");
  return NextResponse.json({ saved, skipped: items.length - saved });
}
