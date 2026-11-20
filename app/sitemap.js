import { prisma } from "../lib/prisma";
import { displayTitle } from "../lib/title";

const BASE_URL = "https://www.peoplelens.in";

// Regenerate hourly so newly curated videos reach the sitemap without a redeploy.
export const revalidate = 3600;

const MAX_DESCRIPTION_LENGTH = 2048; // Google's limit for <video:description>

// Next.js writes video sitemap fields into the XML as they are, without
// escaping, so titles with "&", "<" or quotes must be escaped here.
function xml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function videoEntry(v) {
  const title = displayTitle(v.title);
  const description = (v.curatorNote || title).slice(0, MAX_DESCRIPTION_LENGTH);
  return {
    title: xml(title),
    thumbnail_loc: `https://i.ytimg.com/vi/${v.youtubeVideoId}/hqdefault.jpg`,
    description: xml(description),
    player_loc: `https://www.youtube-nocookie.com/embed/${v.youtubeVideoId}`,
    ...(v.publishedAt && { publication_date: v.publishedAt.toISOString() }),
    // Next.js prints the uploader's info attribute even when it is missing,
    // so the uploader is only added together with its channel page.
    ...(v.channel?.slug && {
      uploader: { content: xml(v.channel.name), info: `${BASE_URL}/channel/${v.channel.slug}` },
    }),
  };
}

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
    url: `${BASE_URL}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const videos = await prisma.video.findMany({
    where: { status: "published" },
    select: {
      youtubeVideoId: true,
      addedAt: true,
      title: true,
      curatorNote: true,
      publishedAt: true,
      channel: { select: { name: true, slug: true } },
    },
    orderBy: { addedAt: "desc" },
  });

  // Each video page also carries a <video:video> block (Google's video sitemap
  // extension), so Search Console can count and report the video pages. The
  // same details are already in each page's VideoObject JSON-LD.
  const videoRoutes = videos.map((v) => ({
    url: `${BASE_URL}/video/${v.youtubeVideoId}`,
    lastModified: v.addedAt,
    changeFrequency: "monthly",
    priority: 0.6,
    videos: [videoEntry(v)],
  }));

  // One entry per channel page (channels with a published story and a slug).
  const channels = await prisma.channel.findMany({
    where: { slug: { not: null }, videos: { some: { status: "published" } } },
    select: { slug: true },
  });

  const channelRoutes = channels.map((c) => ({
    url: `${BASE_URL}/channel/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...channelRoutes, ...videoRoutes];
}
