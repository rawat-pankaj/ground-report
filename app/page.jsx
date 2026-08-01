import { prisma } from "../lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";

// The three Prisma queries below are wrapped in unstable_cache and tagged
// "videos". Admin routes call revalidateTag("videos") after any write that
// changes what's shown here (publish/hide/feature/categorize/add/delete a
// video, or create/rename/delete a category) — see
// app/api/admin/videos/[id]/route.js etc. That's what keeps this fresh;
// there is no time-based revalidation. Reading searchParams below does NOT
// defeat this caching, because the cache lives around the data fetch, keyed
// by the actual filter values, not around the page render itself.

const getCategories = unstable_cache(
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

const getHero = unstable_cache(
  async () => {
    return prisma.video.findFirst({
      where: { status: "published", featured: true },
      include: { channel: true },
    });
  },
  ["homepage-hero"],
  { tags: ["videos"] }
);

const getVideos = unstable_cache(
  async (language, category, excludeId) => {
    const where = { status: "published" };
    if (language) where.language = language;
    if (category) where.categories = { some: { category: { slug: category } } };
    if (excludeId) where.id = { not: excludeId };

    return prisma.video.findMany({
      where,
      include: { channel: true },
      orderBy: { addedAt: "desc" },
      take: 100,
    });
  },
  ["homepage-videos"],
  { tags: ["videos"] }
);

function timeAgo(date) {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function FeaturedCard({ video }) {
  const heroThumbnail = `https://i.ytimg.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`;

  return (
    <a
      href={"https://www.youtube.com/watch?v=" + video.youtubeVideoId}
      target="_blank"
      rel="noopener noreferrer"
      className="story-card overflow-hidden flex flex-col col-span-2 lg:row-span-2"
    >
      <div style={{ position: "relative", width: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroThumbnail}
          alt=""
          className="w-full object-cover"
          style={{ aspectRatio: "16/9" }}
        />
        <span style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "var(--signal)",
          color: "#fff",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "3px 8px",
        }}>
          Featured
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3 w-full">
        <div>
          <p className="story-headline text-[18px] leading-snug mb-2">{video.title}</p>
          <p className="story-meta">{video.channel.name} · {timeAgo(video.publishedAt)}</p>
        </div>

        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          padding: "8px 14px",
          alignSelf: "flex-start",
        }}>
          Watch on YouTube →
        </span>
      </div>
    </a>
  );
}

function StoryCard({ video }) {
  return (
    <a
      href={"https://www.youtube.com/watch?v=" + video.youtubeVideoId}
      target="_blank"
      rel="noopener noreferrer"
      className="story-card overflow-hidden flex flex-col"
    >
      {video.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" className="w-full aspect-video object-cover shrink-0" />
      )}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2 w-full">
        <div>
          <p className="story-headline text-[14px] leading-snug mb-1">{video.title}</p>
          <p className="story-meta" style={{ fontSize: "10px" }}>
            {video.channel.name} · {timeAgo(video.publishedAt)}
          </p>
        </div>

      </div>
    </a>
  );
}

export default async function FeedPage({ searchParams }) {
  const params = await searchParams;
  // `language` is no longer surfaced in the UI (the language pills were
  // removed), but is still honoured so older bookmarked/shared links keep
  // working. Length-capped since it comes straight from the URL.
  const language = (params?.language || "").slice(0, 20);
  const category = params?.category || "";
  const noFilters = !language && !category;

  const categories = await getCategories();
  const hero = noFilters ? await getHero() : null;
  const videos = await getVideos(language, category, hero?.id || null);


  function hrefFor(nextLanguage, nextCategory) {
    const p = new URLSearchParams();
    if (nextLanguage) p.set("language", nextLanguage);
    if (nextCategory) p.set("category", nextCategory);
    const qs = p.toString();
    return qs ? "/" + "?" + qs : "/";
  }

  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-4">
        <p style={{ color: "var(--ink-soft)", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
          {today}
        </p>
        <p style={{ color: "var(--ink)", fontSize: "22px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", marginBottom: "6px", lineHeight: 1.2 }}>
          Stories that matter & issues that affect ordinary people!
        </p>
        <p style={{ color: "var(--ink-soft)", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Community suggested &nbsp;&nbsp;|&nbsp;&nbsp; Picked by hand &nbsp;&nbsp;|&nbsp;&nbsp; Not by algorithm
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-2">
          <div style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
            Category
          </div>
          <div className="filter-strip">
            <Link
              href={hrefFor(language, "")}
              className={"tag " + (category === "" ? "tag-active" : "")}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={hrefFor(language, c.slug)}
                className={"tag " + (category === c.slug ? "tag-active" : "")}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}


      {videos.length === 0 && !hero && (
        <div className="panel text-center py-12">
          <p className="story-meta mb-2">No dispatches yet</p>
          <p style={{ color: "var(--ink-soft)" }} className="text-sm">
            Nothing matches these filters. Try "All" above.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {hero && <FeaturedCard video={hero} />}
        {videos.map((video) => (
          <StoryCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
