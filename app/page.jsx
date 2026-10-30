import Link from "next/link";
import { cookies } from "next/headers";
import CategoryPills from "./CategoryPills";
import StoryCard, { CardLabel, formatDate } from "./StoryCard";
import LoadMore from "./LoadMore";
import HeroImage from "./HeroImage";
import { displayTitle } from "../lib/title";
import { SESSION_COOKIE, verifySessionToken } from "../lib/session";
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
  return (
    <Link
      href={`/video/${video.youtubeVideoId}`}
      className="story-card overflow-hidden flex flex-col col-span-2 lg:row-span-2"
    >
      <div style={{ position: "relative", width: "100%" }}>
        <HeroImage videoId={video.youtubeVideoId} />
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
          <CardLabel category={video.categoryName} language={video.language} />
          <p
            className="story-headline text-[18px] leading-snug mb-2"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {displayTitle(video.title)}
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

  // Admin-only nudge: with no video marked featured the hero just disappears, which
  // looks like a bug to the person who curates the page. Same cookie check as
  // proxy.js; visitors never see this.
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const isAdmin = await verifySessionToken(session);
  const showFeaturedHint = isAdmin && noFilters && !hero;

  // "Fri, 30 Oct 2026", shown to the right of the headline. Assembled from parts
  // because en-IN puts an extra comma after the month ("Fri, 30 Oct, 2026").
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const today = `${dateParts.weekday}, ${dateParts.day} ${dateParts.month} ${dateParts.year}`;

  return (
    <div>
      {/* Headline left, short date right on one line; on a phone the date wraps under the headline. */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 style={{ color: "var(--ink)", fontSize: "22px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", lineHeight: 1.2 }}>
          Stories that matter &amp; issues that affect ordinary people!
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          {today}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-2">
          {/* Visually hidden: the chips explain themselves, but screen readers keep the heading. */}
          <h2 className="sr-only">Category</h2>
          <CategoryPills
            categories={categories}
            language={language}
            category={category}
          />
        </div>
      )}


      {showFeaturedHint && (
        <div
          role="note"
          className="mb-3 text-sm"
          style={{ border: "1px dashed var(--signal)", background: "var(--signal-tint)", padding: "10px 14px", color: "var(--ink)" }}
        >
          <span className="story-meta" style={{ color: "var(--signal)", marginRight: "8px" }}>Admin only</span>
          No featured story set.{" "}
          <Link href="/admin" style={{ textDecoration: "underline" }}>
            Go to Admin
          </Link>{" "}
          to pin one.
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
