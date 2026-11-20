"use client";

// Search, filters and sort for Published Videos. Everything runs in the browser
// on the list the page already loaded, so it is instant and costs nothing.

export const EMPTY_FILTERS = { q: "", status: "", category: "", language: "", missing: [] };

export const SORTS = {
  "added-desc": "Newest added",
  "added-asc": "Oldest added",
  "published-desc": "Newest on YouTube",
  "published-asc": "Oldest on YouTube",
  "title-asc": "Title A–Z",
  "channel-asc": "Channel A–Z",
};

const MISSING = {
  note: { label: "No note", test: (v) => !v.curatorNote?.trim() },
  place: { label: "No place", test: (v) => !v.place?.trim() },
  topic: { label: "No topic", test: (v) => !(v.categories || []).length },
  featured: { label: "Featured", test: (v) => v.featured },
};

const time = (d) => (d ? new Date(d).getTime() : 0);
const byText = (a, b) =>
  String(a || "").replace(/^[\s"'“‘]+/, "").localeCompare(String(b || "").replace(/^[\s"'“‘]+/, ""), undefined, { sensitivity: "base" });

export function applyFilters(videos, filters, sort) {
  const q = filters.q.trim().toLowerCase();
  const shown = videos.filter((v) => {
    if (q) {
      const haystack = `${v.title} ${v.channel?.name || ""} ${v.place || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status && v.status !== filters.status) return false;
    if (filters.category && !(v.categories || []).some((vc) => vc.category.id === filters.category)) return false;
    if (filters.language === "none" ? v.language : filters.language && v.language !== filters.language) return false;
    return filters.missing.every((key) => MISSING[key].test(v));
  });

  const compare = {
    "added-desc": (a, b) => time(b.addedAt) - time(a.addedAt),
    "added-asc": (a, b) => time(a.addedAt) - time(b.addedAt),
    "published-desc": (a, b) => time(b.publishedAt) - time(a.publishedAt),
    "published-asc": (a, b) => time(a.publishedAt) - time(b.publishedAt),
    // Trimmed: some YouTube titles start with a space or a quote mark.
    "title-asc": (a, b) => byText(a.title, b.title),
    "channel-asc": (a, b) => byText(a.channel?.name, b.channel?.name) || time(b.addedAt) - time(a.addedAt),
  }[sort];
  // The featured story stays on top in the default order, as before.
  return sort === "added-desc"
    ? shown.sort((a, b) => Number(b.featured) - Number(a.featured) || compare(a, b))
    : shown.sort(compare);
}

const SHORTCUTS = ["note", "place", "topic", "featured"];

// One line of controls (search, three filters, sort), then shortcut chips that
// show how many videos each would leave. Chips combine; an active chip shows ×.
export default function VideoFilters({ filters, setFilters, sort, setSort, categories, videos, shownCount }) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const toggleMissing = (key) =>
    setFilters((f) => ({
      ...f,
      missing: f.missing.includes(key) ? f.missing.filter((k) => k !== key) : [...f.missing, key],
    }));
  const active =
    filters.q || filters.status || filters.category || filters.language || filters.missing.length;

  return (
    <div className="filter-bar mb-3">
      <div className="filter-row">
        <input
          type="search"
          className="filter-control filter-search"
          placeholder="Search title, channel or place"
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          aria-label="Search videos"
        />
        <select className={"filter-control" + (filters.status ? " is-set" : "")} value={filters.status} onChange={(e) => set("status", e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
        <select className={"filter-control" + (filters.category ? " is-set" : "")} value={filters.category} onChange={(e) => set("category", e.target.value)} aria-label="Topic">
          <option value="">Any topic</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={"filter-control" + (filters.language ? " is-set" : "")} value={filters.language} onChange={(e) => set("language", e.target.value)} aria-label="Language">
          <option value="">Any language</option>
          <option value="hi">Hindi</option>
          <option value="en">English</option>
          <option value="none">Language not set</option>
        </select>
        <select className="filter-control" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          {Object.entries(SORTS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-row filter-chips">
        {SHORTCUTS.map((key) => {
          const on = filters.missing.includes(key);
          const count = videos.filter(MISSING[key].test).length;
          return (
            <button
              key={key}
              type="button"
              className={"filter-chip" + (on ? " is-on" : "")}
              aria-pressed={on}
              onClick={() => toggleMissing(key)}
            >
              {MISSING[key].label} · {count}
              {on && <span aria-hidden="true"> ×</span>}
            </button>
          );
        })}
        {active ? (
          <button type="button" className="link-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        ) : null}
        <span className="filter-count">
          {active ? `${shownCount} of ${videos.length}` : `${videos.length} videos`}
        </span>
      </div>
    </div>
  );
}
