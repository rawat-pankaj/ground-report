import { prisma } from "../lib/prisma";

const BASE_URL = "https://www.peoplelens.in";

// Regenerate hourly so newly curated videos reach the sitemap without a redeploy.
export const revalidate = 3600;

export default async function sitemap() {
  const staticRoutes = [
    { url: BASE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/suggest`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // One entry per category that actually has published content — mirrors
  // the same "hide empty categories" rule the homepage's own filter pills
  // use, so the sitemap never points a crawler at an empty page.
  const categories = await prisma.category.findMany({
    where: { videos: { some: { video: { status: "published" } } } },
    select: { slug: true },
  });

  const categoryRoutes = categories.map((c) => ({
    url: `${BASE_URL}/?category=${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const videos = await prisma.video.findMany({
    where: { status: "published" },
    select: { youtubeVideoId: true, addedAt: true },
    orderBy: { addedAt: "desc" },
  });

  const videoRoutes = videos.map((v) => ({
    url: `${BASE_URL}/video/${v.youtubeVideoId}`,
    lastModified: v.addedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...videoRoutes];
}
