"use client";

import { useEffect, useMemo, useState } from "react";
import NoteField from "./NoteField";
import VideoFilters, { EMPTY_FILTERS, applyFilters } from "./VideoFilters";
import BulkBar from "./BulkBar";
import { formatDate } from "../StoryCard";

export default function AdminDashboard() {
  const [videos, setVideos] = useState(null);
  const [categories, setCategories] = useState([]);
  const [saveState, setSaveState] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("added-desc");
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  // Bumped after a bulk edit so every row remounts and its boxes show the new values.
  const [version, setVersion] = useState(0);

  const shown = useMemo(() => (videos ? applyFilters(videos, filters, sort) : []), [videos, filters, sort]);

  async function load() {
    const [videosRes, categoriesRes] = await Promise.all([
      fetch("/api/admin/videos"),
      fetch("/api/admin/categories"),
    ]);
    const videosData = await videosRes.json();
    const categoriesData = await categoriesRes.json();
    setVideos(videosData.videos);
    setCategories(categoriesData.categories || []);
  }

  useEffect(() => {
    load();
  }, []);

  // Admin -> Notes links here as /admin#v-<id>. The list loads after the page,
  // so scroll to that video once it is on screen.
  useEffect(() => {
    if (!videos || !window.location.hash.startsWith("#v-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [videos]);

  async function toggleStatus(video) {
    const nextStatus = video.status === "published" ? "hidden" : "published";
    const res = await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, status: data.video.status } : v))
    );
  }

  async function setFeatured(video) {
    const nextFeatured = !video.featured;
    const res = await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: nextFeatured }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === video.id) return { ...v, featured: data.video.featured };
        // Setting one video as featured un-features every other video server-side.
        return nextFeatured ? { ...v, featured: false } : v;
      })
    );
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

  async function toggleCategory(video, categoryId) {
    const currentIds = video.categories.map((vc) => vc.category.id);
    const nextIds = currentIds.includes(categoryId)
      ? currentIds.filter((id) => id !== categoryId)
      : [...currentIds, categoryId];

    const res = await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: nextIds }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, categories: data.video.categories } : v))
    );
  }

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allShownSelected = shown.length > 0 && shown.every((v) => selected.has(v.id));
  function toggleAllShown() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const v of shown) allShownSelected ? next.delete(v.id) : next.add(v.id);
      return next;
    });
  }

  async function applyBulk(action, value) {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "status" && value === "hidden" && !confirm(`Hide ${ids.length} video${ids.length === 1 ? "" : "s"} from the site?`)) return;
    setBulkBusy(true);
    setBulkMessage("");
    const payload = action === "addCategory" || action === "removeCategory"
      ? { ids, action, categoryId: value }
      : { ids, action, value: action === "language" && value === "none" ? "" : value };
    try {
      const res = await fetch("/api/admin/videos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      await load();
      setVersion((n) => n + 1);
      setBulkMessage(`Updated ${data.updated} ${action.endsWith("Category") ? "topic link" : "video"}${data.updated === 1 ? "" : "s"}.`);
    } catch (err) {
      setBulkMessage(`Could not save: ${err.message}`);
    }
    setBulkBusy(false);
  }

  async function remove(video) {
    if (!confirm(`Remove "${video.title}"?`)) return;
    const res = await fetch(`/api/admin/videos/${video.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not remove — try again.");
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(video.id);
      return next;
    });
  }

  if (!videos) return <p className="story-meta">Loading…</p>;

  // The homepage hero needs a video that is both featured and published. When
  // there is none the hero silently disappears, so say so here, where it is fixed.
  const hasHero = videos.some((v) => v.featured && v.status === "published");
  const hasHiddenFeatured = videos.some((v) => v.featured && v.status !== "published");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", fontFamily: "'Archivo Narrow', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em" }}>Curated videos ({videos.length})</h1>
        </div>
        <div className="flex gap-2">
          <a href="/admin/add-video" className="btn btn-outline">+ Video</a>
          <a href="/admin/add" className="btn btn-primary">+ Channel</a>
        </div>
      </div>

      {videos.length > 0 && !hasHero && (
        <div
          role="note"
          className="mb-4 text-sm"
          style={{ border: "1px dashed var(--signal)", background: "var(--signal-tint)", padding: "10px 14px", color: "var(--ink)" }}
        >
          <span style={{ fontWeight: 600 }}>No featured story set.</span>{" "}
          {hasHiddenFeatured
            ? "The featured video is hidden, so the homepage has no hero. Publish it, or set another video as featured."
            : "The homepage has no hero. Use “Set as featured” on a video below to pin one."}
        </div>
      )}

      <VideoFilters
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        categories={categories}
        shownCount={shown.length}
        totalCount={videos.length}
      />

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          categories={categories}
          onApply={applyBulk}
          onClear={() => setSelected(new Set())}
          busy={bulkBusy}
        />
      )}
      {bulkMessage && (
        <p className="story-meta mb-2" role="status" style={{ textTransform: "none", color: bulkMessage.startsWith("Could not") ? "var(--signal)" : "#2f8f4e" }}>
          {bulkMessage}
        </p>
      )}

      {shown.length > 0 && (
        <label className="flex items-center gap-2 mb-2 story-meta" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} />
          Select all {shown.length} shown
        </label>
      )}
      {shown.length === 0 && <p className="story-meta">No videos match these filters.</p>}

      <div className="flex flex-col gap-3">
        {shown.map((video) => (
          <div key={`${video.id}:${version}`} id={`v-${video.id}`} className="story-card p-3 flex gap-3 items-start">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={selected.has(video.id)}
              onChange={() => toggleSelected(video.id)}
              aria-label={`Select ${video.title}`}
            />
            {video.thumbnailUrl && (
              <div style={{ position: "relative" }} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnailUrl} alt="" className="w-32 aspect-video object-cover" />
                {video.featured && (
                  <span
                    className="stamp"
                    style={{ position: "absolute", top: 6, left: 6, background: "var(--signal)", color: "#fff" }}
                  >
                    Featured
                  </span>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {video.featured && (
                  <span
                    style={{
                      background: "var(--signal)",
                      color: "#fff",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "2px 8px",
                      flexShrink: 0,
                    }}
                  >
                    Featured Story
                  </span>
                )}
                <p className="story-headline text-[14px] leading-snug">{video.title}</p>
              </div>
              {/* Both dates: the list is sorted by date added, not by YouTube's date. */}
              <p className="story-meta mb-2">
                {video.channel.name}
                {video.publishedAt && <> · Published {formatDate(video.publishedAt)}</>}
                {video.addedAt && <> · Added {formatDate(video.addedAt)}</>}
              </p>
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
              <div className="flex flex-wrap gap-2 mb-1 items-start">
                <input
                  className="input text-[12px] w-full sm:w-48"
                  placeholder="place, e.g. Gaya, Bihar"
                  maxLength={100}
                  defaultValue={video.place || ""}
                  onBlur={(e) => updateTags(video, "place", e.target.value)}
                />
                <NoteField video={video} onSave={(value) => updateTags(video, "curatorNote", value)} />
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {categories.map((category) => {
                    const isActive = (video.categories || []).some(
                      (vc) => vc.category.id === category.id
                    );
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={"tag " + (isActive ? "tag-active" : "")}
                        onClick={() => toggleCategory(video, category.id)}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mb-2 h-[16px]">
                {["language", "beatTags", "place", "curatorNote"].map((field) => {
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
                {video.status === "published" && (
                  <a
                    className="btn btn-outline text-[12px] py-1"
                    href={"/video/" + video.youtubeVideoId}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View page
                  </a>
                )}
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