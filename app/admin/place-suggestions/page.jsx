"use client";

import { useState } from "react";

// Admin -> Places: suggest places for videos added before place suggestions
// existed. "Find places" only reads (the scan saves nothing); the admin edits
// or unticks rows, then "Save" writes the ticked ones. Saving never overwrites
// a place that is already set.
export default function AdminPlaceSuggestions() {
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scan, setScan] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedMessage, setSavedMessage] = useState("");

  async function runScan() {
    setScanning(true);
    setError("");
    setSavedMessage("");
    try {
      const res = await fetch("/api/admin/suggest-places", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setScan(data);
      setRows(data.suggestions.map((s) => ({ ...s, checked: true })));
    } catch (err) {
      setError(err.message || "Scan failed");
    }
    setScanning(false);
  }

  function updateRow(id, changes) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  const selected = rows.filter((r) => r.checked && r.place.trim());

  async function save() {
    if (!selected.length) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/suggest-places/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selected.map((r) => ({ id: r.id, place: r.place })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      const savedIds = new Set(selected.map((r) => r.id));
      setRows((prev) => prev.filter((r) => !savedIds.has(r.id)));
      setSavedMessage(
        `Saved ${data.saved} place${data.saved === 1 ? "" : "s"}` +
          (data.skipped ? ` · ${data.skipped} skipped (a place was already set)` : "")
      );
    } catch (err) {
      setError(err.message || "Save failed");
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "'Archivo Narrow', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Places
        </h1>
        <button className="btn btn-primary text-[12px] py-1" onClick={runScan} disabled={scanning || saving}>
          {scanning ? "Finding…" : scan ? "Find places again" : "Find places"}
        </button>
      </div>

      <p className="story-meta mb-4" style={{ textTransform: "none" }}>
        Suggests a place for videos that have none, from each video&apos;s title, description and
        YouTube recording location (about 1 quota unit per 50 videos). Nothing is saved until you
        click Save, and a place that is already set is never changed.
      </p>

      {error && (
        <p className="story-meta mb-4" style={{ color: "var(--signal)", textTransform: "none" }}>
          {error}
        </p>
      )}

      {savedMessage && (
        <p className="story-meta mb-4" style={{ color: "#2f8f4e", textTransform: "none" }}>
          {savedMessage}
        </p>
      )}

      {scan && (
        <>
          <p className="story-meta mb-3">
            {scan.scanned} video{scan.scanned === 1 ? "" : "s"} without a place · suggestions for {rows.length}
            {scan.scanned > rows.length ? ` · none for ${scan.scanned - rows.length} (add those by hand)` : ""}
          </p>

          {rows.length > 0 && (
            <>
              <div className="flex flex-col gap-2 mb-4">
                {rows.map((r) => (
                  <div key={r.id} className="story-card p-3 flex gap-3 items-center flex-wrap" style={{ opacity: r.checked ? 1 : 0.55 }}>
                    <input
                      type="checkbox"
                      checked={r.checked}
                      onChange={(e) => updateRow(r.id, { checked: e.target.checked })}
                      aria-label={`Save a place for ${r.title}`}
                    />
                    <div className="flex-1 min-w-[200px]">
                      <p className="story-headline text-[14px] leading-snug">{r.title}</p>
                      <p className="story-meta mt-1">
                        {r.channel}
                        {r.status === "hidden" ? " · hidden" : ""} ·{" "}
                        <a
                          href={`https://www.youtube.com/watch?v=${r.youtubeVideoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "underline" }}
                        >
                          YouTube
                        </a>
                      </p>
                    </div>
                    <input
                      className="input text-[13px] w-full sm:w-56"
                      maxLength={100}
                      value={r.place}
                      onChange={(e) => updateRow(r.id, { place: e.target.value })}
                      aria-label={`Place for ${r.title}`}
                    />
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" onClick={save} disabled={saving || !selected.length}>
                {saving ? "Saving…" : `Save ${selected.length} place${selected.length === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
