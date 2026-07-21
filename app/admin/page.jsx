"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [videos, setVideos] = useState(null);

  async function load() {
    const res = await fetch("/api/admin/videos");
    const data = await res.json();
    setVideos(data.videos);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(video) {
    const nextStatus = video.status === "published" ? "hidden" : "published";
    await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    load();
  }

  async function updateTags(video, field, value) {
    await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function remove(video) {
    if (!confirm(`Remove "${video.title}"?`)) return;
    await fetch(`/api/admin/videos/${video.id}`, { method: "DELETE" });
    load();
  }

  if (!videos) return <p className="story-meta">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="eyebrow mb-1">The desk</p>
          <h1 className="masthead-mark text-[22px]">Curated videos ({videos.length})</h1>
        </div>
        <div className="flex gap-2">
          <a href="/admin/add-video" className="btn btn-outline">+ Video</a>
          <a href="/admin/add" className="btn btn-primary">+ Channel</a>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {videos.map((video) => (
          <div key={video.id} className="story-card p-3 flex gap-3 items-start">
            {video.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.thumbnailUrl} alt="" className="w-32 aspect-video object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="story-headline text-[14px] leading-snug mb-1">{video.title}</p>
              <p className="story-meta mb-2">{video.channel.name}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  className="input text-[12px] w-24"
                  placeholder="language"
                  defaultValue={video.language || ""}
                  onBlur={(e) => updateTags(video, "language", e.target.value)}
                />
                <input
                  className="input text-[12px] w-28"
                  placeholder="region"
                  defaultValue={video.region || ""}
                  onBlur={(e) => updateTags(video, "region", e.target.value)}
                />
                <input
                  className="input text-[12px] flex-1 min-w-[140px]"
                  placeholder="beat tags, comma separated"
                  defaultValue={video.beatTags || ""}
                  onBlur={(e) => updateTags(video, "beatTags", e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline text-[12px] py-1" onClick={() => toggleStatus(video)}>
                  {video.status === "published" ? "Hide" : "Publish"}
                </button>
                <button className="btn btn-danger-outline text-[12px] py-1" onClick={() => remove(video)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
