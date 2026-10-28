import Link from "next/link";
import CategoryPills from "./CategoryPills";
import StoryCard, { formatDate } from "./StoryCard";
import LoadMore from "./LoadMore";
import SearchBox from "./SearchBox";
import { PAGE_SIZE, cleanLanguage, getCategories, getHero, getFeedPage } from "../lib/feed";

// Data comes from lib/feed.js: unstable_cache-wrapped queries tagged "videos".
// Admin routes call revalidateTag("videos") after any write that changes what
// is shown here (publish/hide/feature/categorize/add/delete a video, or
// create/rename/delete a category) -- that is what keeps this fresh; there is no
// time-based revalidation. Reading searchParams below does NOT defeat this
// caching, because the cache lives around the data fetch, keyed by the actual
// filter values, not around the page render itself.
//
// The first PAGE_SIZE stories render here; the "Load more" button fetches the
// rest in batches from /api/feed.

function FeaturedCard({ video }) {
  const heroThumbnail = `https://i.ytimg.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`;

  return (
    <Link
      href={`/video/${video.youtubeVideoId}`}
      className="story-card overflow-hidden flex flex-col col-span-2 lg:row-span-2"
    >
      <div style={{ position: "relative", width: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroThumbnail}
          alt=""
          className="w-full object-cover"
          style={{ aspectRatio: "16/9" }}
          fetchPriority="high"
          decoding="async"
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
          {video.categoryName && (
            <p className="card-eyebrow" style={{ fontSize: "11px", marginBottom: "5px" }}>
              {video.categoryName}
            </p>
          )}
          <p
            className="story-headline text-[18px] leading-snug mb-2"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {video.title}
          </p>
          <p className="story-meta">{video.channel.name} · {formatDate(video.publishedAt)}</p>
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
          Read &amp; watch →
        </span>
      </div>
    </Link>
  );
}

export default async function FeedPage({ searchParams }) {
  const params = await searchParams;
  // `language` is no longer surfaced in the UI (the language pills were
  // removed), but is still honoured so older bookmarked/shared links keep
  // working. Length-capped since it comes straight from the URL.
  const language = cleanLanguage(params?.language);

  // getHero() takes no arguments (one bounded cache entry), so it can start
  // alongside getCategories() instead of waiting for it; it is only used below
  // when no filter ends up applying.
  const [categories, heroCandidate] = await Promise.all([
    getCategories(),
    language ? null : getHero(),
  ]);

  // Validate the requested category against the real list rather than
  // passing the raw value through. getFeedPage() is unstable_cache-wrapped and
  // keyed on its arguments, so an unvalidated param would let anyone mint
  // unlimited distinct cache entries (and a fresh DB query each) by sending
  // /?category=<random>. Whitelisting bounds the key space to the categories
  // that actually exist; anything else falls back to the unfiltered feed.
  const requestedCategory = params?.category || "";
  const category = categories.some((c) => c.slug === requestedCategory)
    ? requestedCategory
    : "";

  const noFilters = !language && !category;

  const hero = noFilters ? heroCandidate : null;
  const { videos, hasMore } = await getFeedPage(language, category, 0, hero?.id || null);

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
        <h1 style={{ color: "var(--ink)", fontSize: "22px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", marginBottom: "6px", lineHeight: 1.2 }}>
          Stories that matter &amp; issues that affect ordinary people!
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Community suggested &nbsp;&nbsp;|&nbsp;&nbsp; Picked by hand &nbsp;&nbsp;|&nbsp;&nbsp; Not by algorithm
        </p>
      </div>

      <div className="mb-4">
        <SearchBox />
      </div>

      {categories.length > 0 && (
        <div className="mb-2">
          <h2 style={{ fontSize: "10px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px", fontWeight: 400 }}>
            Category
          </h2>
          <CategoryPills
            categories={categories}
            language={language}
            category={category}
          />
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

      <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-flow-dense gap-3">
        {hero && <FeaturedCard video={hero} />}
        {videos.map((video) => (
          <StoryCard key={video.id} video={video} />
        ))}
        <LoadMore
          initialHasMore={hasMore}
          initialIds={videos.map((v) => v.id)}
          pageSize={PAGE_SIZE}
          language={language}
          category={category}
        />
      </div>
    </div>
  );
}
