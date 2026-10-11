"use client";

import { useState } from "react";
import StoryCard from "./StoryCard";

// Rendered as the LAST child of the homepage grid: appended cards flow into the
// same grid as the server-rendered ones, followed by a full-width button row.
export default function LoadMore({ initialHasMore, initialIds, pageSize, language, category }) {
  const [extra, setExtra] = useState([]);
  const [offset, setOffset] = useState(pageSize);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMore() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ offset: String(offset) });
      if (language) qs.set("language", language);
      if (category) qs.set("category", category);
      const res = await fetch(`/api/feed?${qs.toString()}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();

      // A story added while the reader was browsing shifts everything down by
      // one; skip anything already on screen rather than showing it twice.
      const seen = new Set([...initialIds, ...extra.map((v) => v.id)]);
      setExtra((prev) => [...prev, ...data.videos.filter((v) => !seen.has(v.id))]);
      setOffset((o) => o + pageSize);
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load more stories — please try again.");
    }
    setLoading(false);
  }

  return (
    <>
      {extra.map((video) => (
        <StoryCard key={video.id} video={video} />
      ))}
      {(hasMore || error) && (
        <div className="col-span-2 lg:col-span-4 flex flex-col items-center gap-2 py-4">
          <button type="button" className="btn btn-outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more stories"}
          </button>
          {error && (
            <p className="story-meta" role="alert" style={{ color: "var(--signal)" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
