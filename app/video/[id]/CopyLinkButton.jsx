"use client";

import { useEffect, useRef, useState } from "react";

// Share on phones, Copy link on computers.
//
// Phones (a coarse pointer with the Web Share API) get "Share ↗", which opens
// the phone's own share sheet (WhatsApp, Telegram, Copy...). That also works in
// in-app browsers where copying to the clipboard is blocked. Computers get
// "Copy link". If copying fails, or sharing fails for a reason other than the
// reader closing the sheet, the page address is shown selected in a box with a
// short note, so it can be copied by hand. The server renders "Copy link"; a
// phone switches to "Share ↗" right after the page loads.
export default function CopyLinkButton() {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const fieldRef = useRef(null);

  useEffect(() => {
    setCanShare(
      typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

  // Select the address as soon as the fallback box appears.
  useEffect(() => {
    if (fallback) fieldRef.current?.select();
  }, [fallback]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFallback(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (permissions, an in-app browser, an insecure page).
      setFallback(true);
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: document.title.replace(/ — PeopleLens$/, ""),
        url: window.location.href,
      });
    } catch (err) {
      // Closing the share sheet is not an error; anything else falls back.
      if (err?.name !== "AbortError") copy();
    }
  }

  return (
    <>
      <button type="button" className="btn btn-outline" onClick={canShare ? share : copy}>
        {canShare ? "Share ↗" : copied ? "Link copied" : "Copy link"}
      </button>
      {fallback && (
        <div style={{ flexBasis: "100%" }}>
          <p role="alert" className="text-sm" style={{ color: "var(--signal)", marginBottom: "6px" }}>
            Couldn’t copy automatically. Press and hold the link below to copy it.
          </p>
          <input
            ref={fieldRef}
            className="input"
            readOnly
            value={typeof window === "undefined" ? "" : window.location.href}
            onFocus={(e) => e.target.select()}
            aria-label="Link to this story"
            style={{ maxWidth: "440px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}
          />
        </div>
      )}
    </>
  );
}
