"use client";

import { useState } from "react";

// The dark bar that appears when videos are ticked on Published Videos. Each
// action is one request to /api/admin/videos/bulk for all ticked videos.
// Deleting is deliberately not offered here.
export default function BulkBar({ count, categories, onApply, onClear, busy, message }) {
  const [place, setPlace] = useState("");

  const pick = (action) => (e) => {
    const value = e.target.value;
    e.target.value = "";
    if (value !== "") onApply(action, value);
  };

  return (
    <div className="bulk-bar" role="region" aria-label="Bulk edit">
      <span className="bulk-count">{busy ? "Saving…" : `${count} selected`}</span>
      <select className="bulk-select" defaultValue="" onChange={pick("addCategory")} disabled={busy} aria-label="Add topic">
        <option value="">+ Add topic</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select className="bulk-select" defaultValue="" onChange={pick("removeCategory")} disabled={busy} aria-label="Remove topic">
        <option value="">− Remove topic</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select className="bulk-select" defaultValue="" onChange={pick("language")} disabled={busy} aria-label="Set language">
        <option value="">Language</option>
        <option value="hi">Hindi</option>
        <option value="en">English</option>
        <option value="none">Not set</option>
      </select>
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          onApply("place", place);
          setPlace("");
        }}
      >
        <input
          className="bulk-input"
          placeholder="Set place, e.g. Delhi"
          maxLength={100}
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          disabled={busy}
          aria-label="Place for selected videos"
        />
        <button type="submit" className="bulk-btn" disabled={busy || !place.trim()}>
          Set
        </button>
      </form>
      <button type="button" className="bulk-btn" onClick={() => onApply("status", "hidden")} disabled={busy}>
        Hide
      </button>
      <button type="button" className="bulk-btn" onClick={() => onApply("status", "published")} disabled={busy}>
        Publish
      </button>
      <button type="button" className="link-btn bulk-clear" onClick={onClear} disabled={busy}>
        Clear selection
      </button>
      {/* The result sits inside the sticky bar so it is seen however far down the list you are. */}
      <span
        className={"bulk-message" + (message?.startsWith("Could not") ? " bulk-message-error" : "")}
        role="status"
        aria-live="polite"
      >
        {busy ? "" : message}
      </span>
    </div>
  );
}
