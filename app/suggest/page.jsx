"use client";

import { useState } from "react";

// Same limits as app/api/nominations/route.js, so nothing is cut off unseen.
const MAX_INPUT_LENGTH = 500;
const MAX_REASON_LENGTH = 1000;
const MAX_CONTACT_LENGTH = 200;

const GENERIC_ERROR = "Something went wrong — try again.";

export default function SuggestPage() {
  const [type, setType] = useState("channel");
  const [input, setInput] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, input, reasonText, submitterContact }),
      });
      if (res.ok) {
        setStatus("sent");
        setInput("");
        setReasonText("");
        setSubmitterContact("");
        return;
      }
      // The server explains some failures (e.g. too many suggestions from one
      // connection, where trying again right away won't help); show its words.
      const data = await res.json().catch(() => null);
      setErrorMessage(typeof data?.error === "string" ? data.error : GENERIC_ERROR);
      setStatus("error");
    } catch {
      // No response at all: offline or a dropped connection. Without this the
      // button stayed on "Sending…" for good.
      setErrorMessage("Couldn't reach PeopleLens. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="max-w-xl">
        <a
          href="/"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--ink-soft)",
            display: "inline-block",
            marginBottom: "14px",
          }}
        >
          ← Back to stories
        </a>
        <div className="panel">
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", fontFamily: "'Archivo Narrow', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "8px" }}>
            Suggestion received.
          </h2>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            A human will take a look before it's added to the feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <a
        href="/"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--ink-soft)",
          display: "inline-block",
          marginBottom: "14px",
        }}
      >
        ← Back to stories
      </a>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", fontFamily: "'Archivo Narrow', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "8px" }}>
        Suggest a video
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        Know a channel or a specific report worth surfacing? Tell us and we'll review it by hand.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setType("channel")}
          aria-pressed={type === "channel"}
          className={`tag ${type === "channel" ? "tag-active" : ""}`}
        >
          A channel
        </button>
        <button
          type="button"
          onClick={() => setType("video")}
          aria-pressed={type === "video"}
          className={`tag ${type === "video" ? "tag-active" : ""}`}
        >
          A specific video
        </button>
      </div>

      <form onSubmit={handleSubmit} className="panel flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="suggest-input">{type === "channel" ? "Channel link or name" : "Video link"}</label>
          <input
            id="suggest-input"
            className="input"
            required
            maxLength={MAX_INPUT_LENGTH}
            placeholder={
              type === "channel" ? "https://youtube.com/@channelname" : "https://youtube.com/watch?v=..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="suggest-reason">Why you're suggesting {type === "channel" ? "them" : "it"}</label>
          <textarea
            id="suggest-reason"
            className="input"
            rows={3}
            maxLength={MAX_REASON_LENGTH}
            placeholder={type === "channel" ? "What kind of stories do they cover?" : "What does this report cover?"}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="suggest-contact">Your contact (optional)</label>
          <input
            id="suggest-contact"
            className="input"
            // Email keyboard on phones, but no email validation: the field has
            // always accepted any contact (a phone number, a handle).
            type="text"
            inputMode="email"
            autoComplete="email"
            maxLength={MAX_CONTACT_LENGTH}
            placeholder="Email, in case we have questions"
            value={submitterContact}
            onChange={(e) => setSubmitterContact(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-fit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Submit suggestion"}
        </button>
        {status === "error" && (
          <p className="text-sm" role="alert" style={{ color: "var(--signal)" }}>
            {errorMessage || GENERIC_ERROR}
          </p>
        )}
      </form>
    </div>
  );
}
