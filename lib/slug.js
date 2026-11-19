// URL slugs for channel pages: "DoubleCheck By Sanket Upadhyay" ->
// "doublecheck-by-sanket-upadhyay". Latin letters and digits only; accents are
// dropped, everything else (spaces, punctuation, emoji, Devanagari) becomes a
// single hyphen. Returns "" when nothing is left, so the caller can fall back.

const MAX_SLUG_LENGTH = 60;

export function slugify(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

// A slug for a NEW channel that no other channel uses yet: the name's slug
// (or "channel" if the name has no Latin letters), then "-2", "-3"... on a
// clash. `isTaken(slug)` is an async check against the database.
export async function uniqueSlug(name, isTaken) {
  const base = slugify(name) || "channel";
  let candidate = base;
  for (let n = 2; await isTaken(candidate); n++) {
    candidate = `${base}-${n}`;
  }
  return candidate;
}
