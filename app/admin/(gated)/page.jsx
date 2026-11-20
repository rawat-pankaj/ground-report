"use client";

import { useEffect, useMemo, useState } from "react";
import NoteField from "../NoteField";
import VideoFilters, { EMPTY_FILTERS, applyFilters } from "../VideoFilters";
import BulkBar from "../BulkBar";
import { formatDate } from "../../StoryCard";

const LANGUAGE_NAMES = { hi: "Hindi", en: "English" };

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
  // Rows are folded to one line; these are the ones opened for editing.
  const [open, setOpen] = useState(() => new Set());

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
    const id = window.location.hash.slice(3);
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() =>
      document.getElementById(`v-${id}`)?.scrollIntoView({ block: "center" })
    );
    // Only once, when the list first arrives; later reloads keep what is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos === null]);

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
      // Keep the list in step, so the folded row and the filters show the saved value.
      const data = await res.json().catch(() => ({}));
      if (data.video && field in data.video) {
        setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, [field]: data.video[field] } : v)));
      }
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

  function toggleOpen(id) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
        <h1 className="admin-title">
          Curated videos <span className="admin-title-count">{videos.length}</span>
        </h1>
        <a href="/admin/add-video" className="btn btn-primary">+ Add</a>
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
            : "The homepage has no hero. Open a video below and use “Set as featured” to pin one."}
        </div>
      )}

      <VideoFilters
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        categories={categories}
        videos={videos}
        shownCount={shown.length}
      />

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          categories={categories}
          onApply={applyBulk}
          onClear={() => {
            setSelected(new Set());
            setBulkMessage("");
          }}
          busy={bulkBusy}
          message={bulkMessage}
        />
      )}

      {shown.length > 0 && (
        <label className="flex items-center gap-2 mb-2 story-meta" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} />
          Select all {shown.length} shown
        </label>
      )}
      {shown.length === 0 && <p className="story-meta">No videos match these filters.</p>}

      <div className="video-list">
        {shown.map((video) => {
          const isOpen = open.has(video.id);
          const topics = (video.categories || []).map((vc) => vc.category.name);
          return (
            <div key={`${video.id}:${version}`} id={`v-${video.id}`} className={"video-row" + (isOpen ? " is-open" : "")}>
              <div className="video-row-head">
                <input
                  type="checkbox"
                  checked={selected.has(video.id)}
                  onChange={() => toggleSelected(video.id)}
                  aria-label={`Select ${video.title}`}
                />
                <button
                  type="button"
                  className="video-row-toggle"
                  onClick={() => toggleOpen(video.id)}
                  aria-expanded={isOpen}
                  aria-controls={`edit-${video.id}`}
                >
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnailUrl} alt="" className="video-row-thumb" loading="lazy" />
                  ) : (
                    <span className="video-row-thumb" />
                  )}
                  <span className="video-row-text">
                    <span className="video-row-title">{video.title}</span>
                    <span className="video-row-meta">
                      {[
                        video.channel.name,
                        video.place,
                        LANGUAGE_NAMES[video.language] || video.language,
                        topics.length ? topics.join(", ") : "No topic",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="video-row-badges">
                    {video.featured && <span className="row-badge badge-accent">Featured</span>}
                    {video.status !== "published" && <span className="row-badge badge-muted">Hidden</span>}
                    {video.curatorNote?.trim() ? (
                      <span className="row-badge badge-ok">Note</span>
                    ) : (
                      <span className="row-badge badge-warn">No note</span>
                    )}
                    <span className="video-row-chevron" aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
                  </span>
                </button>
              </div>

              {isOpen && (
                <div className="video-row-edit" id={`edit-${video.id}`}>
                  <p className="video-row-dates">
                    {video.publishedAt && <>On YouTube {formatDate(video.publishedAt)}</>}
                    {video.addedAt && <> · Added {formatDate(video.addedAt)}</>}
                  </p>
                  <div className="video-row-fields">
                    <label className="field">
                      <span className="field-label">Place</span>
                      <input
                        className="input text-[13px]"
                        placeholder="Gaya, Bihar"
                        maxLength={100}
                        defaultValue={video.place || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (video.place || "")) updateTags(video, "place", e.target.value);
                        }}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">Language</span>
                      <select
                        className="input text-[13px]"
                        defaultValue={video.language || ""}
                        onChange={(e) => updateTags(video, "language", e.target.value)}
                      >
                        <option value="">Not set</option>
                        <option value="hi">Hindi</option>
                        <option value="en">English</option>
                        {video.language && !LANGUAGE_NAMES[video.language] && (
                          <option value={video.language}>{video.language}</option>
                        )}
                      </select>
                    </label>
                  </div>

                  <div className="field">
                    <span className="field-label">Topics</span>
                    <div className="flex flex-wrap gap-1">
                      {categories.map((category) => {
                        const isActive = (video.categories || []).some((vc) => vc.category.id === category.id);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            className={"tag " + (isActive ? "tag-active" : "")}
                            aria-pressed={isActive}
                            onClick={() => toggleCategory(video, category.id)}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Why this matters</span>
                    <NoteField video={video} onSave={(value) => updateTags(video, "curatorNote", value)} />
                  </div>

                  <div className="video-row-actions">
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
                        View page ↗
                      </a>
                    )}
                    <span className="video-row-save" role="status">
                      {["language", "place", "curatorNote"].map((field) => {
                        const state = saveState[`${video.id}:${field}`];
                        if (state === "saving") return <span key={field}>Saving…</span>;
                        if (state === "saved") return <span key={field} style={{ color: "#2f8f4e" }}>Saved</span>;
                        if (state === "error") return <span key={field} style={{ color: "var(--signal)" }}>Could not save. Try again.</span>;
                        return null;
                      })}
                    </span>
                    <button className="btn btn-danger-outline text-[12px] py-1 video-row-remove" onClick={() => remove(video)}>
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
