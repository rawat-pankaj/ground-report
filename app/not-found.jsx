import Link from "next/link";
import SearchBox from "./SearchBox";
import StoryCard from "./StoryCard";
import { getLatestStories } from "../lib/feed";

// Shown for any unknown URL and for /video/<id> when the video is gone (removed
// by its channel, hidden or deleted in admin). Readers arriving from an old
// link get a way back: search, the latest stories, and a link home.
// getLatestStories reuses the homepage's cache entry and never throws, so a
// database hiccup can't break the 404 page itself.

const LATEST_COUNT = 4;

export const metadata = {
  title: "Page not found — PeopleLens",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const latest = await getLatestStories(LATEST_COUNT);

  return (
    <div>
      <div style={{ maxWidth: "640px", margin: "8px 0 28px" }}>
        <p className="eyebrow" style={{ marginBottom: "10px" }}>
          404 · Page not found
        </p>
        <h1
          style={{
            color: "var(--ink)",
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 700,
            fontFamily: "'Archivo Narrow', sans-serif",
            letterSpacing: "0.01em",
            lineHeight: 1.15,
            marginBottom: "10px",
          }}
        >
          This story isn’t here
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink)", marginBottom: "16px" }}>
          The video may have been removed by its channel, or the link is mistyped.
        </p>
        <div style={{ marginBottom: "16px" }}>
          <SearchBox />
        </div>
        <Link href="/" className="btn btn-primary">
          Browse all stories →
        </Link>
      </div>

      {latest.length > 0 && (
        <section>
          <h2
            className="story-meta"
            style={{ fontWeight: 400, letterSpacing: "0.06em", paddingBottom: "6px", borderBottom: "1px solid var(--rule)", marginBottom: "12px" }}
          >
            Latest stories
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {latest.map((v) => (
              <StoryCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
