"use client";

import { useState } from "react";

// The "Why this matters" box on Published Videos. Typed notes save when you
// leave the box, as before. A draft from the YouTube description (the button
// under an empty box) never saves on its own: it waits for "Save note" or
// "Discard draft", so an unreviewed draft can't go live by accident.
export default function NoteField({ video, onSave }) {
  const [value, setValue] = useState(video.curatorNote || "");
  const [isDraft, setIsDraft] = useState(false);
  const [state, setState] = useState("idle"); // idle | loading | none | error
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);

  async function fetchDraft() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/youtube/video-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.youtubeVideoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reach YouTube");
      setDescription(data.description || "");
      if (data.draft) {
        setValue(data.draft);
        setIsDraft(true);
        setState("idle");
      } else {
        setState("none");
        setMessage("No usable summary in this video’s description (only channel info and links).");
      }
    } catch (err) {
      setState("error");
      setMessage(err.message);
    }
  }

  function saveDraft() {
    setIsDraft(false);
    onSave(value);
  }

  function discardDraft() {
    setIsDraft(false);
    setValue("");
  }

  return (
    <div className="flex-1 min-w-[200px]">
      <textarea
        className={"input text-[12px]" + (isDraft ? " input-draft" : "")}
        rows={isDraft ? 4 : 2}
        maxLength={1000}
        placeholder="Why this matters — 1-2 lines shown on the video page"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!isDraft) onSave(value);
        }}
      />

      {isDraft && (
        <div className="flex gap-3 items-center flex-wrap mt-1">
          <button type="button" className="btn btn-primary text-[12px] py-1" onClick={saveDraft}>
            Save note
          </button>
          <button type="button" className="link-btn" onClick={discardDraft}>
            Discard draft
          </button>
          <span className="story-meta" style={{ textTransform: "none" }}>
            Draft from the YouTube description. Edit it first; it saves only when you click Save.
          </span>
        </div>
      )}

      {!isDraft && !value.trim() && (
        <div className="flex gap-3 items-center flex-wrap mt-1">
          <button
            type="button"
            className="btn btn-outline text-[12px] py-1"
            onClick={fetchDraft}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Fetching…" : "Draft from description"}
          </button>
          {message && (
            <span className="story-meta" style={{ textTransform: "none", color: state === "error" ? "var(--signal)" : undefined }}>
              {message}
            </span>
          )}
        </div>
      )}

      {description && (
        <div className="mt-1">
          <button type="button" className="link-btn" onClick={() => setShowDescription(!showDescription)}>
            {showDescription ? "Hide full description" : "Show full description"}
          </button>
          {showDescription && <pre className="description-box">{description}</pre>}
        </div>
      )}
    </div>
  );
}
