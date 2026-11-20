import Link from "next/link";
import CategoryPills from "./CategoryPills";
import TodayDate from "./TodayDate";
import AdminHint from "./AdminHint";
import StoryCard, { CardLabel, formatDate } from "./StoryCard";
import LoadMore from "./LoadMore";
import HeroImage from "./HeroImage";
import { displayTitle } from "../lib/title";
import { PAGE_SIZE, getCategories, getHero, getFeedPage } from "../lib/feed";

// Title and description come from the layout. The canonical tells search
// engines that variants such as /?language=hi are this page.
export const metadata = {
  alternates: { canonical: "/" },
};

// Data comes from lib/feed.js: unstable_cache-wrapped queries tagged "videos".
// Admin routes call revalidateTag("videos") after any write that changes what
// is shown here (publish/hide/feature/categorize/add/delete a video, or
// create/rename/delete a category) -- that is what keeps this fresh; there is no
// time-based revalidation.
//
// The page itself is ready-made (static): it reads no cookies, no address and
// no clock on the server, so Vercel serves a saved copy and rebuilds it only
// when that tag is revalidated. Hence the browser-side pieces: TodayDate (the
// header date) and AdminHint (the admin-only "no featured story" note). Old
// /?category= links are redirected by proxy.js; old ?language= links now show
// all stories.
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
          fontSize: "12px",
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
          {/* The curator's "Why this matters" note, as a standfirst, cut to 3 lines.
              On desktop it makes the 2x2 block about 20px taller. No note, no line. */}
          {video.curatorNote && (
            <p
              className="mt-3"
              style={{
                fontSize: "15px",
                lineHeight: 1.55,
                color: "var(--ink-soft)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {video.curatorNote}
            </p>
          )}
        </div>

        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
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

export default async function FeedPage() {
  // getHero() and getCategories() take no arguments (one cache entry each), so
  // they run side by side.
  const [categories, hero] = await Promise.all([getCategories(), getHero()]);
  const { videos, hasMore } = await getFeedPage("", "", 0, hero?.id || null);

  return (
    <div>
      {/* Headline left, short date right on one line; on a phone the date wraps under the headline. */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 style={{ color: "var(--ink)", fontSize: "22px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", lineHeight: 1.2 }}>
          Stories that matter &amp; issues that affect ordinary people!
        </h1>
        <TodayDate style={{ color: "var(--ink-soft)", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }} />
      </div>

      {categories.length > 0 && (
        <div className="mb-2">
          {/* Visually hidden: the chips explain themselves, but screen readers keep the heading. */}
          <h2 className="sr-only">Category</h2>
          <CategoryPills categories={categories} category="" />
        </div>
      )}

      {/* Shown only to a signed-in admin, and only when no story is featured. */}
      {!hero && <AdminHint />}

      {videos.length === 0 && !hero && (
        <div className="panel text-center py-12">
          <p className="story-meta mb-2">No dispatches yet</p>
          <p style={{ color: "var(--ink-soft)" }} className="text-sm">
            Stories will appear here once they are published.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-flow-dense gap-3">
        {hero && <FeaturedCard video={hero} />}
        {videos.map((video) => (
          <StoryCard key={video.id} video={video} />
        ))}
        <LoadMore initialHasMore={hasMore} initialIds={videos.map((v) => v.id)} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
