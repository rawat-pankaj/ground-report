// YouTube titles often end with a run of hashtags ("... Without Explanation!
// #gyaneshkumar #eci"). They add clutter on cards and headings, so strip them
// for display only. The stored title is untouched (and the structured data on
// the video page still uses the original). A title that is nothing but
// hashtags is returned as it is.
const TRAILING_HASHTAGS = /(?:\s*#[^\s#]+)+\s*$/u;

export function displayTitle(title) {
  const text = String(title || "");
  const stripped = text.replace(TRAILING_HASHTAGS, "").trim();
  return stripped || text.trim();
}
