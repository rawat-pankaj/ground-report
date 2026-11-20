"use client";

import { useState } from "react";
import { NOTE_LABELS } from "../../../../lib/noteCheck";

// Admin -> Notes: one click checks every saved "Why this matters" note against
// its video's YouTube text, so the curator can see which notes are copied and
// still need a line of their own. Read-only; each row links to the video's box
// on Published Videos for editing.

const ORDER = ["promo", "title", "copied", "own"];
const BADGE_STYLE = {
  promo: { background: "#fbe7e7", color: "#8a1c1c", border: "1px solid #e7a9a9" },
  title: { background: "#fcf3d9", color: "#5c4100", border: "1px solid #e8c96a" },
  copied: { background: "#fcf3d9", color: "#5c4100", border: "1px solid #e8c96a" },
  own: { background: "#e6f2ea", color: "#1e5a33", border: "1px solid #9ccbaa" },
};

export default function AdminNotes() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function runCheck() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/admin/check-notes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Check failed");
    }
    setRunning(false);
  }

  const counts = {};
  for (const n of result?.notes || []) counts[n.kind] = (counts[n.kind] || 0) + 1;
  // Notes that need attention first (ads, titles, copies), own words last.
  const sorted = [...(result?.notes || [])].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

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
          Notes
        </h1>
        <button className="btn btn-primary text-[12px] py-1" onClick={runCheck} disabled={running}>
          {running ? "Checking…" : result ? "Check notes again" : "Check notes"}
        </button>
      </div>

      <p className="story-meta mb-4" style={{ textTransform: "none" }}>
        Compares each “Why this matters” note with the video’s YouTube description and title (about 1 quota
        unit per 50 notes). Notes copied from YouTube add nothing new for search engines; a line in your own
        words does. Nothing is changed here.
      </p>

      {error && (
        <p className="story-meta mb-4" style={{ color: "var(--signal)", textTransform: "none" }}>
          {error}
        </p>
      )}

      {result && (
        <>
          <p className="story-meta mb-3">
            {result.notes.length} note{result.notes.length === 1 ? "" : "s"} ·{" "}
            {ORDER.filter((k) => counts[k]).map((k) => `${NOTE_LABELS[k]} ${counts[k]}`).join(" · ")}
          </p>

          <div className="flex flex-col gap-2">
            {sorted.map((n) => (
              <div key={n.id} className="story-card p-3 flex gap-3 items-start flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <p className="story-headline text-[14px] leading-snug">{n.title}</p>
                  <p className="story-meta mt-1">
                    {n.channel}
                    {n.status === "hidden" ? " · hidden" : ""}
                  </p>
                  <p className="text-[13px] mt-2" style={{ color: "var(--ink-soft)", lineHeight: 1.5 }}>
                    {n.note.length > 220 ? n.note.slice(0, 220) + "…" : n.note}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    style={{
                      ...BADGE_STYLE[n.kind],
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      padding: "2px 8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {NOTE_LABELS[n.kind]}
                  </span>
                  <a className="btn btn-outline text-[12px] py-1" href={`/admin#v-${n.id}`}>
                    Edit note
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
