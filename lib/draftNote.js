// Turns a YouTube description into a short draft for the curator's
// "Why this matters" note. A draft only: the admin page shows it in an editable
// box and nothing is saved until the curator saves or publishes it. Plain text
// rules, no AI and no network (like lib/places.js).
//
// Descriptions are mostly channel boilerplate (subscribe, social links,
// hashtags, credits, timestamps), so the draft keeps the first lines that read
// like a summary and stops at about MAX_DRAFT_LENGTH characters, ending on a
// sentence where it can. Returns "" when nothing usable is left.

export const MAX_DRAFT_LENGTH = 300;
const MIN_LINE_LENGTH = 25; // shorter lines are labels, names, "Watch now" etc.

const NOISE = [
  /https?:\/\/|www\.\S+/i,
  /\b(subscribe|like|share|comment|follow us|join (this|our)|membership|perks|whatsapp|telegram|instagram|facebook|twitter|linkedin|x\.com|download|bell icon|support us|donate|upi|paytm|sponsor|advertis|e-?mail us|contact us)/i,
  /सब्सक्राइब|लाइक|शेयर|फॉलो|जुड़ें|जुड़ सकते|डाउनलोड|ऐप|विज्ञापन/,
  /^(\d{1,2}:)?\d{1,2}:\d{2}\b/, // chapter timestamps
  /^(produced|edited|reported|report|camera|script|voice ?over|anchor|host|written|shot|graphics|video)\b[^.]{0,40}(by|:|-)/i,
  /^(रिपोर्ट|एडिट|कैमरा|प्रोड्यूसर|शूट|ग्राफ़िक्स|वीडियो एडिट)/,
  /©|copyright|disclaimer|all rights reserved/i,
];

function squash(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

export function draftNote(description, channelName = "") {
  if (typeof description !== "string" || !description.trim()) return "";
  // Compared without spaces: the channel "TheRedMike" writes "The Red Mike".
  const channel = squash(channelName);

  const lines = description
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/#[\p{L}\p{N}_]+/gu, "") // hashtags
        .replace(/\s+/g, " ")
        .replace(/^[\s:;,.|•*\-–—_=~>]+/, "") // punctuation left at the start
        .trim()
    )
    .filter(Boolean);

  const kept = [];
  for (const line of lines) {
    if (line.length < MIN_LINE_LENGTH) continue;
    if (NOISE.some((re) => re.test(line))) continue;
    // "The Red Mike is a new movement…", "About PEEK TV": the channel's own blurb.
    if (channel.length >= 4 && squash(line).includes(channel)) continue;
    kept.push(line);
    if (kept.join(" ").length >= MAX_DRAFT_LENGTH) break;
  }

  let text = kept.join(" ");
  if (text.length > MAX_DRAFT_LENGTH) {
    const cut = text.slice(0, MAX_DRAFT_LENGTH);
    const stop = Math.max(
      cut.lastIndexOf(". "),
      cut.lastIndexOf("। "),
      cut.lastIndexOf("? "),
      cut.lastIndexOf("! ")
    );
    text = stop > 80 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, "") + "…";
  }
  return text;
}
