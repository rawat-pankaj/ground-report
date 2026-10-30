import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../lib/prisma";
import { readJson, badBody } from "../../../../lib/http";

export const dynamic = "force-dynamic";

function normalizeLanguage(input) {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (v === "hi" || v === "hindi" || v === "हिंदी") return "hi";
  if (v === "en" || v === "english") return "en";
  return input.trim();
}

function normalizeBeatTags(input) {
  if (!input) return null;
  const cleaned = input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return cleaned.length ? [...new Set(cleaned)].join(", ") : null;
}

const MAX_PLACE_LENGTH = 100;

// Per-video place sent by the add-video / add-channel pages. Optional; empty
// or non-text values become null so a bad payload can't break publishing.
function cleanPlace(input) {
  if (typeof input !== "string") return null;
  return input.trim().slice(0, MAX_PLACE_LENGTH) || null;
}

export async function GET() {
  const videos = await prisma.video.findMany({
    include: { channel: true, categories: { include: { category: true } } },
    orderBy: [{ featured: "desc" }, { addedAt: "desc" }],
    take: 500,
  });
  return NextResponse.json({ videos });
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const { channel, videos, language, beatTags } = body;

  if (!channel?.youtubeChannelId || !videos?.length) {
    return NextResponse.json({ error: "channel and videos are required" }, { status: 400 });
  }

  const channelRow = await prisma.channel.upsert({
    where: { youtubeChannelId: channel.youtubeChannelId },
    update: { lastBrowsedAt: new Date() },
    create: {
      youtubeChannelId: channel.youtubeChannelId,
      name: channel.name,
      thumbnailUrl: channel.thumbnailUrl,
      uploadsPlaylistId: channel.uploadsPlaylistId,
    },
  });

  const created = [];
  for (const v of videos) {
    const video = await prisma.video.upsert({
      where: { youtubeVideoId: v.youtubeVideoId },
      update: {},
      create: {
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
        language: normalizeLanguage(language),
        beatTags: normalizeBeatTags(beatTags),
        place: cleanPlace(v.place),
        channelId: channelRow.id,
      },
    });
    created.push(video);
  }

  revalidateTag("videos");
  return NextResponse.json({ videos: created });
}