"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [videos, setVideos] = useState(null);
  const [saveState, setSaveState] = useState({});

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

  async function setFeatured(video) {
    await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !video.featured }),
    });
    load();
  }

  async function updateTags(video, field, value) {
    const key = `${video.id}:${field}`;
    setSaveState((prev) => ({ ...prev, [key]: "saving" }));
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState((prev) => ({ ...prev, [key]: "saved" }));
      setTimeout(() => {
        setSaveState((prev) => ({ ...prev, [key]: undefined }));
      }, 1500);
    } catch {
      setSaveState((prev) => ({ ...prev, [key]: "error" }));
    }
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
              <div style={{ position: "relative" }} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnailUrl} alt="" className="w-32 aspect-video object-cover" />
                {video.featured && (
                  <span
                    className="stamp"
                    style={{ position: "absolute", top: 6, left: 6, background: "#fff" }}
                  >
                    Featured
                  </span>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="story-headline text-[14px] leading-snug mb-1">{video.title}</p>
              <p className="story-meta mb-2">{video.channel.name}</p>
              <div className="flex flex-wrap gap-2 mb-1 items-center">
                <input
                  className="input text-[12px] w-24"
                  placeholder="language"
                  defaultValue={video.language || ""}
                  onBlur={(e) => updateTags(video, "language", e.target.value)}
                />
                <input
                  className="input text-[12px] flex-1 min-w-[140px]"
                  placeholder="beat tags, comma separated"
                  defaultValue={video.beatTags || ""}
                  onBlur={(e) => updateTags(video, "beatTags", e.target.value)}
                />
              </div>
              <div className="mb-2 h-[16px]">
                {["language", "beatTags"].map((field) => {
                  const state = saveState[`${video.id}:${field}`];
                  if (state === "saving") return <span key={field} className="story-meta">Saving…</span>;
                  if (state === "saved") return <span key={field} className="story-meta" style={{ color: "#2f8f4e" }}>Saved</span>;
                  if (state === "error") return <span key={field} className="story-meta" style={{ color: "var(--signal)" }}>Could not save — try again</span>;
                  return null;
                })}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-outline text-[12px] py-1" onClick={() => toggleStatus(video)}>
                  {video.status === "published" ? "Hide" : "Publish"}
                </button>
                <button
                  className={`btn text-[12px] py-1 ${video.featured ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setFeatured(video)}
                >
                  {video.featured ? "Featured" : "Set as featured"}
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