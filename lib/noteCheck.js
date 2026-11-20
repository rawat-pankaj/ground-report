import { hasChannelPromo } from "./draftNote";

// Tells whether a "Why this matters" note is the curator's own words or text
// copied from the video's YouTube page. Search engines already have the
// YouTube text, so a copied note adds nothing original to the page. Used by the
// hint under the note box (app/admin/NoteField.jsx, Add video) and by the
// Admin -> Notes check. Plain text comparison, no AI and no network.
//
// The measure: of the note's 4-word phrases, how many also appear in the
// YouTube description or title (letters and digits only, any script).

const COPIED_SHARE = 0.9;

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

export function copiedShare(note, { description = "", title = "" } = {}) {
  const words = normalise(note).split(" ").filter(Boolean);
  const source = ` ${normalise(description)} ${normalise(title)} `;
  if (words.length < 4) return source.includes(` ${words.join(" ")} `) && words.length ? 1 : 0;
  let found = 0;
  let total = 0;
  for (let i = 0; i + 4 <= words.length; i++) {
    total++;
    if (source.includes(` ${words.slice(i, i + 4).join(" ")} `)) found++;
  }
  return found / total;
}

// "empty" | "title" (just the video title) | "promo" (keeps a channel ad or
// link line) | "copied" (90%+ from YouTube) | "own" (the curator's words).
export function classifyNote(note, { description = "", title = "" } = {}) {
  const text = String(note || "").trim();
  if (!text) return "empty";
  if (normalise(text) === normalise(title)) return "title";
  if (hasChannelPromo(text)) return "promo";
  return copiedShare(text, { description, title }) >= COPIED_SHARE ? "copied" : "own";
}

export const NOTE_LABELS = {
  title: "Same as title",
  promo: "Has channel ad",
  copied: "Copied",
  own: "Own words",
};
