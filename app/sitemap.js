import { prisma } from "../lib/prisma";

const BASE_URL = "https://www.peoplelens.in";

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

  return [...staticRoutes, ...categoryRoutes];
}
