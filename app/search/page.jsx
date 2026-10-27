import Link from "next/link";
import SearchBox from "../SearchBox";
import StoryCard from "../StoryCard";
import { SEARCH_LIMIT, MAX_QUERY_LENGTH, searchVideos } from "../../lib/search";

// Search result pages are not worth indexing (endless query variants, thin
// content), but links on them can be followed.
export const metadata = {
  title: "Search — PeopleLens",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const rawQuery = typeof params?.q === "string" ? params.q : "";
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

  const { terms, videos } = await searchVideos(query);
  const hasQuery = terms.length > 0;

  return (
    <div>
      <div className="mb-4">
        <h1 style={{ color: "var(--ink)", fontSize: "22px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", marginBottom: "10px", lineHeight: 1.2 }}>
          Search
        </h1>
        <SearchBox defaultValue={query} />
      </div>

      {!hasQuery && (
        <p style={{ color: "var(--ink-soft)" }} className="text-sm">
          Type a word to search story titles, channels, places and categories. Hindi and English both work.
        </p>
      )}

      {hasQuery && (
        <p className="story-meta mb-3" style={{ textTransform: "uppercase" }}>
          {videos.length === 0
            ? `No stories for "${terms.join(" ")}"`
            : videos.length >= SEARCH_LIMIT
              ? `Top ${videos.length} stories for "${terms.join(" ")}"`
              : `${videos.length} ${videos.length === 1 ? "story" : "stories"} for "${terms.join(" ")}"`}
        </p>
      )}

      {hasQuery && videos.length === 0 && (
        <div className="panel text-center py-12">
          <p style={{ color: "var(--ink-soft)" }} className="text-sm mb-3">
            Try a shorter or different word. Search matches the same script you type, so Hindi titles need Hindi words.
          </p>
          <Link href="/" className="tag">
            Browse all stories
          </Link>
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {videos.map((video) => (
            <StoryCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
