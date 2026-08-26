"use client";

import { useState } from "react";
import Link from "next/link";

const VISIBLE_COUNT = 8;

function hrefFor(language, category) {
  const p = new URLSearchParams();
  if (language) p.set("language", language);
  if (category) p.set("category", category);
  const qs = p.toString();
  return qs ? "/" + "?" + qs : "/";
}

export default function CategoryPills({ categories, language, category }) {
  const topSlugs = categories.slice(0, VISIBLE_COUNT).map((c) => c.slug);
  const activeIsHidden = category && !topSlugs.includes(category);

  const [expanded, setExpanded] = useState(activeIsHidden);

  // categories already arrives sorted by video count (highest first), so the
  // top VISIBLE_COUNT are the categories with the most content -- the ones
  // worth showing by default rather than treating all 20 as equally
  // prominent.
  const visible = expanded ? categories : categories.slice(0, VISIBLE_COUNT);
  const hiddenCount = categories.length - VISIBLE_COUNT;

  return (
    <div className="filter-strip">
      <Link
        href={hrefFor(language, "")}
        className={"tag " + (category === "" ? "tag-active" : "")}
      >
        All
      </Link>
      {visible.map((c) => (
        <Link
          key={c.id}
          href={hrefFor(language, c.slug)}
          className={"tag " + (category === c.slug ? "tag-active" : "")}
        >
          {c.name}
        </Link>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="tag"
          style={{ cursor: "pointer", borderStyle: "dashed" }}
        >
          {expanded ? "Less ⌃" : `More (${hiddenCount}) ⌄`}
        </button>
      )}
    </div>
  );
}
