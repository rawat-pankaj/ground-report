import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Data access for the homepage feed, shared by the page (first batch) and
// /api/feed (the "Load more" button). Everything is wrapped in unstable_cache
// with the "videos" tag, which every admin write route already revalidates
// (publish/hide/feature/categorize/add/delete) -- that, not a timer, keeps it
// fresh. Cache keys are the function arguments, so every argument must come
// from a small, validated set; see the callers for how each one is bounded.

export const PAGE_SIZE = 50;

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
    return prisma.video.findFirst({
      where: { status: "published", featured: true },
      include: { channel: true },
    });
  },
  ["homepage-hero"],
  { tags: ["videos"] }
);

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
      select: {
        id: true,
        youtubeVideoId: true,
        title: true,
        thumbnailUrl: true,
        publishedAt: true,
        channel: { select: { name: true } },
      },
      orderBy: [{ addedAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: PAGE_SIZE + 1,
    });

    return { videos: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
  },
  ["feed-page"],
  { tags: ["videos"] }
);
