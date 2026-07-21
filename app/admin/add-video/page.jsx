"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function AddVideoInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("video") || "");
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState("");
  const [region, setRegion] = useState("");
  const [beatTags, setBeatTags] = useState("");
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
  }

  async function handlePublish() {
    if (!result) return;
    setStatus("saving");
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: result.channel,
        videos: [result.video],
        language,
        region,
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
      <h1 className="masthead-mark text-[22px] mb-4">Add one video</h1>

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
          <div className="story-card overflow-hidden flex sm:flex-row flex-col mb-6">
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
            <div className="flex-1 min-w-[120px]">
              <label className="field-label">Region</label>
              <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="field-label">Beat tags</label>
              <input className="input" placeholder="comma separated" value={beatTags} onChange={(e) => setBeatTags(e.target.value)} />
            </div>
          </div>

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
