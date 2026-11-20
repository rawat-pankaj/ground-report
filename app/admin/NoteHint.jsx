"use client";

import { classifyNote } from "../../lib/noteCheck";

// The hint under a "Why this matters" box: yellow when the note is the channel's
// YouTube text (or its title, or keeps a channel ad), green once the curator has
// added words of their own. Shown only when the YouTube description is known
// (Add video, or after "Draft from description"). Advice only; saving is never
// blocked.
export default function NoteHint({ note, description, title }) {
  if (!description || !String(note || "").trim()) return null;
  const kind = classifyNote(note, { description, title });

  if (kind === "own") {
    return (
      <p className="note-hint note-hint-ok" role="status">
        Your own words added.
      </p>
    );
  }

  const message =
    kind === "title"
      ? "This is just the video’s title. Add a line about why it matters."
      : kind === "promo"
        ? "This still has the channel’s promotion (subscribe, app, links). Remove it and add a line in your own words."
        : "Same as the channel’s YouTube text. Google already has these words, so they won’t help this page in search. Add a line in your own words, e.g. why PeopleLens picked it.";

  return (
    <p className="note-hint note-hint-warn" role="status">
      {message}
    </p>
  );
}
