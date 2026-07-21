"use client";

import { useState } from "react";

export default function SuggestPage() {
  const [type, setType] = useState("channel");
  const [input, setInput] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, input, reasonText, submitterContact }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) {
      setInput("");
      setReasonText("");
      setSubmitterContact("");
    }
  }

  if (status === "sent") {
    return (
      <div className="panel">
        <p className="story-headline mb-1">Suggestion received.</p>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          A human will take a look before it's added to the feed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-1">Route a tip to the desk</p>
      <h1 className="masthead-mark text-[22px] mb-2">Suggest a source</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        Know a channel or a specific report worth surfacing? Tell us and we'll review it by hand.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setType("channel")}
          className={`tag ${type === "channel" ? "tag-active" : ""}`}
        >
          A channel
        </button>
        <button
          type="button"
          onClick={() => setType("video")}
          className={`tag ${type === "video" ? "tag-active" : ""}`}
        >
          A specific video
        </button>
      </div>

      <form onSubmit={handleSubmit} className="panel flex flex-col gap-4">
        <div>
          <label className="field-label">{type === "channel" ? "Channel link or name" : "Video link"}</label>
          <input
            className="input"
            required
            placeholder={
              type === "channel" ? "https://youtube.com/@channelname" : "https://youtube.com/watch?v=..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Why you're suggesting {type === "channel" ? "them" : "it"}</label>
          <textarea
            className="input"
            rows={3}
            placeholder={type === "channel" ? "What kind of stories do they cover?" : "What does this report cover?"}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Your contact (optional)</label>
          <input
            className="input"
            placeholder="Email, in case we have questions"
            value={submitterContact}
            onChange={(e) => setSubmitterContact(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-fit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Submit suggestion"}
        </button>
        {status === "error" && (
          <p className="text-sm" style={{ color: "var(--signal)" }}>Something went wrong — try again.</p>
        )}
      </form>
    </div>
  );
}
