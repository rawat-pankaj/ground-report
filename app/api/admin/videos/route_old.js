import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

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

export async function GET() {
  const videos = await prisma.video.findMany({
    include: { channel: true },
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json({ videos });
}

export async function POST(request) {
  const body = await request.json();
  const { channel, videos, language, region, beatTags } = body;

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
        region: region || null,
        beatTags: normalizeBeatTags(beatTags),
        channelId: channelRow.id,
      },
    });
    created.push(video);
  }

  return NextResponse.json({ videos: created });
}