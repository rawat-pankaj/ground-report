import { NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../lib/prisma";
import { readJson, badBody } from "../../../../lib/http";
import { uniqueSlug } from "../../../../lib/slug";
import { normalizePlace } from "../../../../lib/places";
import { pingIndexNow } from "../../../../lib/indexnow";
import { requireAdmin } from "../../../../lib/adminAuth";

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
// normalizePlace keeps one spelling per place ("delhi, india" -> "Delhi").
function cleanPlace(input) {
  if (typeof input !== "string") return null;
  return normalizePlace(input.slice(0, MAX_PLACE_LENGTH)) || null;
}

const MAX_NOTE_LENGTH = 1000;

// Optional "Why this matters" note from the add-video page (same limit as PATCH).
function cleanNote(input) {
  if (typeof input !== "string") return null;
  return input.trim().slice(0, MAX_NOTE_LENGTH) || null;
}

const MAX_VIDEOS = 200;
const IMAGE_HOSTS = ["i.ytimg.com", "yt3.ggpht.com", "yt3.googleusercontent.com"];

function cleanImage(input) {
  if (typeof input !== "string") return null;
  try {
    const url = new URL(input);
    return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

const cleanText = (input, max) => (typeof input === "string" ? input.trim().slice(0, max) : "");

function cleanChannel(c) {
  if (!c || typeof c !== "object" || !/^UC[\w-]{22}$/.test(c.youtubeChannelId || "")) return null;
  const name = cleanText(c.name, 200);
  if (!name) return null;
  return {
    youtubeChannelId: c.youtubeChannelId,
    name,
    thumbnailUrl: cleanImage(c.thumbnailUrl),
    uploadsPlaylistId: /^[\w-]{10,64}$/.test(c.uploadsPlaylistId || "") ? c.uploadsPlaylistId : null,
  };
}

function cleanVideo(v) {
  if (!v || typeof v !== "object" || !/^[\w-]{11}$/.test(v.youtubeVideoId || "")) return null;
  const title = cleanText(v.title, 300);
  if (!title) return null;
  const published = v.publishedAt ? new Date(v.publishedAt) : null;
  return {
    youtubeVideoId: v.youtubeVideoId,
    title,
    thumbnailUrl: cleanImage(v.thumbnailUrl),
    publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
    place: v.place,
    curatorNote: v.curatorNote,
  };
}

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const videos = await prisma.video.findMany({
    include: { channel: true, categories: { include: { category: true } } },
    orderBy: [{ featured: "desc" }, { addedAt: "desc" }],
    take: 500,
  });
  return NextResponse.json({ videos });
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const { language, beatTags } = body;
  if ((language != null && typeof language !== "string") || (beatTags != null && typeof beatTags !== "string")) {
    return NextResponse.json({ error: "language and beatTags must be text" }, { status: 400 });
  }

  // The browser sends what the YouTube lookup returned. Check its shape here
  // rather than trust it: ids in YouTube's formats, text capped, and pictures
  // only from YouTube's image hosts (the same ones the CSP allows).
  const channel = cleanChannel(body.channel);
  const videos = Array.isArray(body.videos) ? body.videos.slice(0, MAX_VIDEOS).map(cleanVideo) : [];
  if (!channel || !videos.length || videos.some((v) => !v)) {
    return NextResponse.json({ error: "channel and videos are required, in YouTube's formats" }, { status: 400 });
  }

  // Every channel gets a slug for its /channel/<slug> page: a new channel when it
  // is created, and an existing one without a slug the next time it is used.
  const existing = await prisma.channel.findUnique({
    where: { youtubeChannelId: channel.youtubeChannelId },
    select: { slug: true },
  });
  const slug =
    existing?.slug ||
    (await uniqueSlug(channel.name, async (candidate) =>
      Boolean(await prisma.channel.findUnique({ where: { slug: candidate }, select: { id: true } }))
    ));

  const channelRow = await prisma.channel.upsert({
    where: { youtubeChannelId: channel.youtubeChannelId },
    update: { lastBrowsedAt: new Date(), ...(existing?.slug ? {} : { slug }) },
    create: {
      youtubeChannelId: channel.youtubeChannelId,
      name: channel.name,
      slug,
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
        publishedAt: v.publishedAt,
        language: normalizeLanguage(language),
        beatTags: normalizeBeatTags(beatTags),
        place: cleanPlace(v.place),
        curatorNote: cleanNote(v.curatorNote),
        channelId: channelRow.id,
      },
    });
    created.push(video);
  }

  revalidateTag("videos");
  // Tell Bing about the new pages once the response has gone (lib/indexnow.js).
  after(() =>
    pingIndexNow([
      "/",
      channelRow.slug && `/channel/${channelRow.slug}`,
      ...created.filter((v) => v.status === "published").map((v) => `/video/${v.youtubeVideoId}`),
    ])
  );
  return NextResponse.json({ videos: created });
}