"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

// "Why this matters", pre-filled with a draft cut from the YouTube description
// (lib/draftNote.js). Saved only when the video is published.
function NoteDraftField({ note, setNote, suggestedNote, description, showDescription, setShowDescription }) {
  const isDraft = Boolean(suggestedNote) && note === suggestedNote;
  return (
    <div className="mb-2 mt-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="field-label" htmlFor="curator-note" style={{ marginBottom: 0 }}>
          Why this matters
        </label>
        {isDraft && <span className="draft-chip">Draft from YouTube description</span>}
      </div>
      <textarea
        id="curator-note"
        className={"input mt-1" + (isDraft ? " input-draft" : "")}
        rows={4}
        maxLength={1000}
        placeholder="1-2 lines shown on the video page"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-between gap-3 flex-wrap mt-1">
        <p className="story-meta" style={{ textTransform: "none" }}>
          {suggestedNote
            ? "Cut from the channel’s description, links and hashtags removed. Rewrite it in your own words before publishing."
            : "No usable summary in this video’s description — write one if you like."}{" "}
          {note.length} / 1000
        </p>
        <span className="flex gap-3">
          {description && (
            <button type="button" className="link-btn" onClick={() => setShowDescription(!showDescription)}>
              {showDescription ? "Hide full description" : "Show full description"}
            </button>
          )}
          {note && (
            <button type="button" className="link-btn" onClick={() => setNote("")}>
              Clear
            </button>
          )}
        </span>
      </div>
      {showDescription && <pre className="description-box">{description}</pre>}
    </div>
  );
}

function AddVideoInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("video") || "");
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState("");
  const [beatTags, setBeatTags] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleLookup(e) {
    e?.preventDefault();
    setStatus("looking-up");
    setError("");
    setResult(null);

    const res = await fetch("/api/admin/youtube/lookup-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    setStatus("idle");
    if (!res.ok) {
      setError(data.error || "Video not found");
      return;
    }
    setResult(data);
    // Pre-fill from the title/description/recording location. Editable.
    setPlace(data.video.suggestedPlace || "");
    setNote(data.video.suggestedNote || "");
    setShowDescription(false);
  }

  async function handlePublish() {
    if (!result) return;
    setStatus("saving");
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: result.channel,
        // The description and suggestions stay here; only the reviewed fields go.
        videos: [
          {
            youtubeVideoId: result.video.youtubeVideoId,
            title: result.video.title,
            thumbnailUrl: result.video.thumbnailUrl,
            publishedAt: result.video.publishedAt,
            place,
            curatorNote: note,
          },
        ],
        language,
        beatTags,
      }),
    });
    setStatus("idle");
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      const data = await res.json();
      setError(data.error || "Could not save video");
    }
  }

  return (
    <div>
      <p className="eyebrow mb-1">Single dispatch</p>
      <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", fontFamily: "'Archivo Narrow', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "16px" }}>Add one video</h1>

      <form onSubmit={handleLookup} className="panel flex gap-2 mb-6">
        <input
          className="input"
          placeholder="Paste a video URL (youtube.com/watch?v=... or youtu.be/...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn" disabled={status === "looking-up"}>
          {status === "looking-up" ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && <p className="text-sm mb-4" style={{ color: "var(--signal)" }}>{error}</p>}

      {result && (
        <>
          <div className="story-card overflow-hidden flex sm:flex-row flex-col items-start mb-6">
            {result.video.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.video.thumbnailUrl}
                alt=""
                className="w-full sm:w-56 aspect-video object-cover shrink-0"
              />
            )}
            <div className="p-4">
              <p className="story-headline text-[15px] leading-snug mb-2">{result.video.title}</p>
              <p className="story-meta">{result.channel.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <div className="flex-1 min-w-[120px]">
              <label className="field-label">Language</label>
              <input className="input" placeholder="hi / en" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="field-label">Beat tags</label>
              <input className="input" placeholder="comma separated" value={beatTags} onChange={(e) => setBeatTags(e.target.value)} />
            </div>
          </div>

          <div className="mb-2">
            <label className="field-label">Place</label>
            <input
              className="input"
              placeholder="e.g. Gaya, Bihar"
              maxLength={100}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <p className="story-meta mt-1" style={{ fontSize: "10px" }}>
              {result.video.suggestedPlace
                ? "Suggested from the video details — edit or clear it before publishing."
                : "No place found in the video details — add one if you know it."}
            </p>
          </div>

          <NoteDraftField
            note={note}
            setNote={setNote}
            suggestedNote={result.video.suggestedNote || ""}
            description={result.video.description || ""}
            showDescription={showDescription}
            setShowDescription={setShowDescription}
          />

          <button className="btn btn-primary w-full justify-center mt-4" disabled={status === "saving"} onClick={handlePublish}>
            {status === "saving" ? "Publishing…" : "Publish this video"}
          </button>
        </>
      )}
    </div>
  );
}

export default function AddVideoPage() {
  return (
    <Suspense fallback={<p className="story-meta">Loading…</p>}>
      <AddVideoInner />
    </Suspense>
  );
}