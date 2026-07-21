"use client";

import { useState } from "react";

const VISIBLE_COUNT = 6;

export default function BeatFilters({ beatOptions, activeBeat, language }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? beatOptions : beatOptions.slice(0, VISIBLE_COUNT);
  const hiddenCount = beatOptions.length - VISIBLE_COUNT;

  function hrefFor(beat) {
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (beat) params.set("beat", beat);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <a href={hrefFor("")} className={`tag ${activeBeat === "" ? "tag-active" : ""}`}>
        All beats
      </a>
      {visible.map((b) => (
        <a key={b} href={hrefFor(b)} className={`tag ${activeBeat === b ? "tag-active" : ""}`}>
          {b}
        </a>
      ))}
      {!expanded && hiddenCount > 0 && (
        <button type="button" onClick={() => setExpanded(true)} className="tag">
          +{hiddenCount} more
        </button>
      )}
      {expanded && beatOptions.length > VISIBLE_COUNT && (
        <button type="button" onClick={() => setExpanded(false)} className="tag">
          Show less
        </button>
      )}
    </div>
  );
}