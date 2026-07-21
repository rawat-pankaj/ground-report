"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function AddChannelInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("channel") || "");
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [selected, setSelected] = useState({});
  const [language, setLanguage] = useState("");
  const [region, setRegion] = useState("");
  const [beatTags, setBeatTags] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleLookup(e) {
    e?.preventDefault();
    setStatus("looking-up");
    setError("");
    setChannel(null);
    setVideos([]);
    setSelected({});

    const res = await fetch("/api/admin/youtube/lookup-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Channel not found");
      setStatus("idle");
      return;
    }
    setChannel(data.channel);
    await loadVideos(data.channel.uploadsPlaylistId, null, true);
    setStatus("idle");
  }

  async function loadVideos(uploadsPlaylistId, pageToken, replace) {
    const res = await fetch("/api/admin/youtube/channel-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadsPlaylistId, pageToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load videos");
      return;
    }
    setVideos((prev) => (replace ? data.videos : [...prev, ...data.videos]));
    setNextPageToken(data.nextPageToken);
  }

  function toggle(videoId) {
    setSelected((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  }

  async function handlePublish() {
    const picked = videos.filter((v) => selected[v.youtubeVideoId]);
    if (!picked.length) return;
    setStatus("saving");
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, videos: picked, language, region, beatTags }),
    });
    setStatus("idle");
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      const data = await res.json();
      setError(data.error || "Could not save videos");
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div>
      <p className="eyebrow mb-1">Bulk intake</p>
      <h1 className="masthead-mark text-[22px] mb-4">Add channel</h1>

      <form onSubmit={handleLookup} className="panel flex gap-2 mb-6">
        <input
          className="input"
          placeholder="Paste a channel URL, @handle, or channel ID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn" disabled={status === "looking-up"}>
          {status === "looking-up" ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && <p className="text-sm mb-4" style={{ color: "var(--signal)" }}>{error}</p>}

      {channel && (
        <>
          <div className="flex items-center gap-3 mb-4">
            {channel.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channel.thumbnailUrl} alt="" className="w-10 h-10 rounded-full" />
            )}
            <p className="story-headline">{channel.name}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <input
              className="input text-[13px] w-28"
              placeholder="language (hi/en)"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
            <input
              className="input text-[13px] w-32"
              placeholder="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <input
              className="input text-[13px] flex-1 min-w-[160px]"
              placeholder="beat tags, comma separated"
              value={beatTags}
              onChange={(e) => setBeatTags(e.target.value)}
            />
          </div>
          <p className="story-meta mb-4">
            Tags above apply to every video you select below.
          </p>

          <div className="grid gap-3 mb-4">
            {videos.map((v) => (
              <label
                key={v.youtubeVideoId}
                className="story-card p-3 flex gap-3 items-center cursor-pointer"
                style={selected[v.youtubeVideoId] ? { borderColor: "var(--ink)" } : undefined}
              >
                <input
                  type="checkbox"
                  checked={!!selected[v.youtubeVideoId]}
                  onChange={() => toggle(v.youtubeVideoId)}
                />
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnailUrl} alt="" className="w-24 aspect-video object-cover rounded" />
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug">{v.title}</p>
                  <p className="story-meta">
                    {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ""}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {nextPageToken && (
            <button
              className="btn btn-outline mb-6"
              onClick={() => loadVideos(channel.uploadsPlaylistId, nextPageToken, false)}
            >
              Load more
            </button>
          )}

          <div className="sticky bottom-4">
            <button
              className="btn btn-primary w-full justify-center"
              disabled={!selectedCount || status === "saving"}
              onClick={handlePublish}
            >
              {status === "saving" ? "Saving…" : `Publish ${selectedCount || ""} selected video${selectedCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AddChannelPage() {
  return (
    <Suspense fallback={<p className="story-meta">Loading…</p>}>
      <AddChannelInner />
    </Suspense>
  );
}
