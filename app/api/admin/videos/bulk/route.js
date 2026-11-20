import { NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody } from "../../../../../lib/http";
import { normalizePlace } from "../../../../../lib/places";
import { pingIndexNow } from "../../../../../lib/indexnow";
import { requireAdmin } from "../../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

// Bulk edit for Published Videos: one action applied to the ticked videos.
//   { ids: [...], action: "addCategory" | "removeCategory", categoryId }
//   { ids: [...], action: "language", value: "hi" | "en" | "" }
//   { ids: [...], action: "place", value: "Gaya, Bihar" | "" }
//   { ids: [...], action: "status", value: "published" | "hidden" }
// Deleting stays one video at a time on purpose. Unknown ids are ignored.
// Like the single-video routes: clears the "videos" cache and tells Bing.

const MAX_IDS = 500;
const MAX_PLACE_LENGTH = 100;
const LANGUAGES = { hi: "hi", en: "en", "": null };
const STATUSES = ["published", "hidden"];

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.filter((id) => typeof id === "string" && id))].slice(0, MAX_IDS)
    : [];
  if (!ids.length) return NextResponse.json({ error: "Select at least one video" }, { status: 400 });

  const where = { id: { in: ids } };
  let updated = 0;

  switch (body.action) {
    case "addCategory":
    case "removeCategory": {
      const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
      const category = categoryId && (await prisma.category.findUnique({ where: { id: categoryId } }));
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

      if (body.action === "addCategory") {
        const existing = await prisma.video.findMany({ where, select: { id: true } });
        const result = await prisma.videoCategory.createMany({
          data: existing.map((v) => ({ videoId: v.id, categoryId })),
          skipDuplicates: true,
        });
        updated = result.count;
      } else {
        const result = await prisma.videoCategory.deleteMany({ where: { videoId: { in: ids }, categoryId } });
        updated = result.count;
      }
      break;
    }

    case "language": {
      if (!(body.value in LANGUAGES)) {
        return NextResponse.json({ error: "language must be hi, en or empty" }, { status: 400 });
      }
      updated = (await prisma.video.updateMany({ where, data: { language: LANGUAGES[body.value] } })).count;
      break;
    }

    case "place": {
      if (typeof body.value !== "string") return NextResponse.json({ error: "place must be text" }, { status: 400 });
      const place = normalizePlace(body.value.slice(0, MAX_PLACE_LENGTH)) || null;
      updated = (await prisma.video.updateMany({ where, data: { place } })).count;
      break;
    }

    case "status": {
      if (!STATUSES.includes(body.value)) {
        return NextResponse.json({ error: "status must be published or hidden" }, { status: 400 });
      }
      updated = (await prisma.video.updateMany({ where, data: { status: body.value } })).count;
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (updated > 0) {
    revalidateTag("videos");
    // Hiding also announces the pages, so the engines drop them.
    after(async () => {
      const videos = await prisma.video.findMany({ where, select: { youtubeVideoId: true } });
      await pingIndexNow(["/", ...videos.map((v) => `/video/${v.youtubeVideoId}`)]);
    });
  }

  return NextResponse.json({ updated });
}
