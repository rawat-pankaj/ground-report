import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Data access for the homepage feed, shared by the page (first batch) and
// /api/feed (the "Load more" button). Everything is wrapped in unstable_cache
// with the "videos" tag, which every admin write route already revalidates
// (publish/hide/feature/categorize/add/delete) -- that, not a timer, keeps it
// fresh. Cache keys are the function arguments, so every argument must come
// from a small, validated set; see the callers for how each one is bounded.

// 48, not 50, on purpose: on desktop the grid has 4 columns and the featured
// card occupies a 2x2 block (4 cells). 48 cards (+4 for the hero) fills 13 whole
// rows, and every later page of 48 fills 12 whole rows, so a full page never
// leaves empty cells at the bottom. 50 left two blank cells. Keep this a
// multiple of 4 (and even, for the 2-column mobile grid).
export const PAGE_SIZE = 48;

// Two-letter codes only ("hi", "en", ...). The language filter has no UI any
// more but old links still carry it; an unbounded string here would let anyone
// mint unlimited cache entries.
export function cleanLanguage(raw) {
  const v = String(raw || "").toLowerCase();
  return /^[a-z]{2}$/.test(v) ? v : "";
}

export const getCategories = unstable_cache(
  async () => {
    const categoriesRaw = await prisma.category.findMany({
      where: { videos: { some: { video: { status: "published" } } } },
      include: { _count: { select: { videos: { where: { video: { status: "published" } } } } } },
    });
    return categoriesRaw.sort((a, b) => b._count.videos - a._count.videos);
  },
  ["homepage-categories"],
  { tags: ["videos"] }
);

export const getHero = unstable_cache(
  async () => {
    const video = await prisma.video.findFirst({
      where: { status: "published", featured: true },
      include: {
        channel: true,
        // Same label rule as the grid cards (see getFeedPage).
        categories: {
          select: { category: { select: { name: true } } },
          orderBy: { category: { videos: { _count: "desc" } } },
          take: 1,
        },
      },
    });
    if (!video) return null;
    const { categories, ...hero } = video;
    return { ...hero, categoryName: categories[0]?.category.name || null };
  },
  ["homepage-hero"],
  { tags: ["videos"] }
);

// What a story card needs, shared by the grid, search and the video page's
// related stories. One label per card: the video's category with the most videos
// overall, so the same label shows wherever the video appears.
export const CARD_SELECT = {
  id: true,
  youtubeVideoId: true,
  title: true,
  thumbnailUrl: true,
  publishedAt: true,
  language: true,
  channel: { select: { name: true } },
  categories: {
    select: { category: { select: { name: true } } },
    orderBy: { category: { videos: { _count: "desc" } } },
    take: 1,
  },
};

// Flattens the category relation into `categoryName`, the shape StoryCard reads.
export function toCardVideo({ categories, ...video }) {
  return { ...video, categoryName: categories[0]?.category.name || null };
}

// One page of the grid. Fetches PAGE_SIZE + 1 rows so "is there more?" is known
// without a separate count query. The id tie-break keeps paging stable when
// several videos share an addedAt (e.g. a bulk channel import).
export const getFeedPage = unstable_cache(
  async (language, category, offset, excludeId) => {
    const where = { status: "published" };
    if (language) where.language = language;
    if (category) where.categories = { some: { category: { slug: category } } };
    if (excludeId) where.id = { not: excludeId };

    const rows = await prisma.video.findMany({
      where,
      select: CARD_SELECT,
      orderBy: [{ addedAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: PAGE_SIZE + 1,
    });

    const videos = rows.slice(0, PAGE_SIZE).map(toCardVideo);

    return { videos, hasMore: rows.length > PAGE_SIZE };
  },
  ["feed-page"],
  { tags: ["videos"] }
);

// The newest stories after the featured one, for the "page not found" page and
// the empty search page. Same arguments as the homepage's first batch, so it is
// the same cache entry: no extra database work. Never throws; a database error
// just means no stories.
export async function getLatestStories(count) {
  try {
    const hero = await getHero();
    const { videos } = await getFeedPage("", "", 0, hero?.id || null);
    return videos.slice(0, count);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Channel pages (/channel/<slug>). Same rules as above: cached under the
// "videos" tag, and every argument comes from a validated set. An unknown slug
// THROWS inside the cached function, because unstable_cache does not cache
// errors, so made-up URLs cannot create cache entries.

export const CHANNEL_NOT_FOUND = "CHANNEL_NOT_FOUND";
const CHANNEL_SLUG_RE = /^[a-z0-9-]{1,60}$/;

export function isChannelSlug(value) {
  return typeof value === "string" && CHANNEL_SLUG_RE.test(value);
}

// The channel and the categories its published stories are in (most used
// first, for the filter chips). Only channels with a published story exist.
export const getChannelPage = unstable_cache(
  async (slug) => {
    const channel = await prisma.channel.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailUrl: true,
        youtubeChannelId: true,
        _count: { select: { videos: { where: { status: "published" } } } },
      },
    });
    if (!channel || channel._count.videos === 0) throw new Error(CHANNEL_NOT_FOUND);

    const inChannel = { status: "published", channelId: channel.id };
    const categories = await prisma.category.findMany({
      where: { videos: { some: { video: inChannel } } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { videos: { where: { video: inChannel } } } },
      },
    });
    categories.sort((a, b) => b._count.videos - a._count.videos);

    const { _count, ...rest } = channel;
    return { channel: { ...rest, storyCount: _count.videos }, categories };
  },
  ["channel-page"],
  { tags: ["videos"] }
);

// Loads a channel page, or null for an unknown or malformed slug.
export async function loadChannelPage(slug) {
  if (!isChannelSlug(slug)) return null;
  try {
    return await getChannelPage(slug);
  } catch (err) {
    if (err?.message === CHANNEL_NOT_FOUND) return null;
    throw err;
  }
}

// One page of a channel's stories, optionally within one category. Callers
// pass a channel id from getChannelPage and a category slug checked against
// that channel's categories.
export const getChannelFeedPage = unstable_cache(
  async (channelId, category, offset) => {
    const where = { status: "published", channelId };
    if (category) where.categories = { some: { category: { slug: category } } };

    const rows = await prisma.video.findMany({
      where,
      select: CARD_SELECT,
      orderBy: [{ addedAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: PAGE_SIZE + 1,
    });

    return { videos: rows.slice(0, PAGE_SIZE).map(toCardVideo), hasMore: rows.length > PAGE_SIZE };
  },
  ["channel-feed-page"],
  { tags: ["videos"] }
);
