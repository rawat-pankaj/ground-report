import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const TOP_CHANNELS_LIMIT = 12;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10) || 30, 1), 365);

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [
    totalVideos,
    publishedCount,
    hiddenCount,
    featuredCount,
    totalChannels,
    nominationCounts,
    recentVideos,
    channelBreakdown,
    languageBreakdown,
    categoryBreakdown,
  ] = await Promise.all([
    prisma.video.count(),
    prisma.video.count({ where: { status: "published" } }),
    prisma.video.count({ where: { status: "hidden" } }),
    prisma.video.count({ where: { featured: true } }),
    prisma.channel.count(),
    prisma.nomination.groupBy({ by: ["status"], _count: true }),
    prisma.video.findMany({
      where: { addedAt: { gte: since } },
      select: { addedAt: true },
    }),
    prisma.video.groupBy({
      by: ["channelId"],
      _count: true,
      orderBy: { _count: { channelId: "desc" } },
      take: TOP_CHANNELS_LIMIT,
    }),
    prisma.video.groupBy({
      by: ["language"],
      _count: true,
    }),
    prisma.category.findMany({
      select: {
        name: true,
        _count: { select: { videos: true } },
      },
    }),
  ]);

  // Backfill every day in the window to zero, then overlay real counts --
  // otherwise days with no activity would just be missing from the series,
  // which would misleadingly compress the chart rather than show a gap.
  const dayBuckets = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayBuckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const v of recentVideos) {
    const key = v.addedAt.toISOString().slice(0, 10);
    if (key in dayBuckets) dayBuckets[key] += 1;
  }
  const dailyActivity = Object.entries(dayBuckets).map(([date, count]) => ({ date, count }));

  const channelIds = channelBreakdown.map((c) => c.channelId);
  const channels = await prisma.channel.findMany({
    where: { id: { in: channelIds } },
    select: { id: true, name: true },
  });
  const channelNameById = Object.fromEntries(channels.map((c) => [c.id, c.name]));
  const topChannels = channelBreakdown.map((c) => ({
    name: channelNameById[c.channelId] || "Unknown",
    count: c._count,
  }));

  const languages = languageBreakdown
    .map((l) => ({ language: l.language || "Unspecified", count: l._count }))
    .sort((a, b) => b.count - a.count);

  const categories = categoryBreakdown
    .map((c) => ({ name: c.name, count: c._count.videos }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const nominations = { pending: 0, approved: 0, rejected: 0 };
  for (const n of nominationCounts) {
    nominations[n.status] = n._count;
  }

  return NextResponse.json({
    days,
    totals: {
      videos: totalVideos,
      published: publishedCount,
      hidden: hiddenCount,
      featured: featuredCount,
      channels: totalChannels,
    },
    nominations,
    dailyActivity,
    topChannels,
    languages,
    categories,
  });
}
