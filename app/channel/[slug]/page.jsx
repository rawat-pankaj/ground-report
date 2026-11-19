import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryPills from "../../CategoryPills";
import StoryCard from "../../StoryCard";
import LoadMore from "../../LoadMore";
import { PAGE_SIZE, loadChannelPage, getChannelFeedPage } from "../../../lib/feed";

// /channel/<slug>: every story PeopleLens has picked from one channel, with
// topic chips that filter within the channel (?category=) and "Load more".
// An unknown slug is a 404 (loadChannelPage never caches a miss), and the
// category must be one of this channel's.

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await loadChannelPage(slug);
  if (!data) return { title: "Channel not found — PeopleLens", robots: { index: false } };

  const { channel } = data;
  const title = `${channel.name} — PeopleLens`;
  const description = `${channel.storyCount} ground ${channel.storyCount === 1 ? "report" : "reports"} by ${channel.name}, hand-picked on PeopleLens.`;
  return {
    title,
    description,
    // Filtered views (?category=) point search engines at the full channel page.
    alternates: { canonical: `/channel/${channel.slug}` },
    openGraph: { title, description, url: `/channel/${channel.slug}`, siteName: "PeopleLens", type: "profile" },
  };
}

export default async function ChannelPage({ params, searchParams }) {
  const { slug } = await params;
  const data = await loadChannelPage(slug);
  if (!data) notFound();

  const { channel, categories } = data;
  const query = await searchParams;
  const requested = typeof query?.category === "string" ? query.category : "";
  const category = categories.some((c) => c.slug === requested) ? requested : "";

  const { videos, hasMore } = await getChannelFeedPage(channel.id, category, 0);
  const basePath = `/channel/${channel.slug}`;

  return (
    <div>
      <p className="story-meta mb-3">
        <Link href="/" style={{ borderBottom: "1px solid var(--rule)" }}>← All stories</Link>
      </p>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {channel.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.thumbnailUrl} alt="" width={56} height={56} style={{ borderRadius: "50%", background: "#eceae3" }} />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#1A6EBD",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "22px",
            }}
          >
            {channel.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-[180px]">
          <h1 style={{ color: "var(--ink)", fontSize: "26px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", lineHeight: 1.15 }}>
            {channel.name}
          </h1>
          <p className="story-meta mt-1">
            {channel.storyCount} {channel.storyCount === 1 ? "story" : "stories"} on PeopleLens
          </p>
        </div>
        <a
          className="btn btn-outline"
          href={`https://www.youtube.com/channel/${channel.youtubeChannelId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube →
        </a>
      </div>

      {categories.length > 1 && (
        <div className="mb-3">
          <h2 className="sr-only">Topics from this channel</h2>
          <CategoryPills categories={categories} category={category} basePath={basePath} />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {videos.map((video) => (
          <StoryCard key={video.id} video={video} />
        ))}
        <LoadMore
          initialHasMore={hasMore}
          initialIds={videos.map((v) => v.id)}
          pageSize={PAGE_SIZE}
          category={category}
          channel={channel.slug}
        />
      </div>
    </div>
  );
}
