"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Plain SVG so the icon needs no extra dependency; decorative inside the box,
// labelled where it is the only content of a link.
function SearchIcon({ size = 16, label }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export default function MastheadBar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const searchRef = useRef(null);

  // "/" focuses the search box, the same shortcut the hint chip shows. Ignored
  // while typing in a field, with a modifier held, or when the box is hidden
  // (below lg, where only the icon link shows).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const input = searchRef.current;
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
      <div className="shrink-0">
        <div className="flex items-baseline gap-2">
          <a href="/" className="masthead-mark">
            PeopleLens
          </a>
          {isAdmin && (
            <span
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              / Admin
            </span>
          )}
        </div>
        {!isAdmin && (
          <p className="masthead-strap">
            Community suggested &nbsp;|&nbsp; Picked by hand &nbsp;|&nbsp; Not by algorithm
          </p>
        )}
      </div>

      {!isAdmin && (
        // Plain GET form to /search, so it works without JavaScript (Enter submits).
        // Wide screens get the pill; below lg the nav shows a search icon that
        // opens /search instead.
        <form action="/search" method="get" role="search" className="masthead-search hidden lg:flex">
          <span className="masthead-search-glyph">
            <SearchIcon />
          </span>
          <label htmlFor="masthead-q" className="sr-only">
            Search stories
          </label>
          <input
            id="masthead-q"
            ref={searchRef}
            name="q"
            type="search"
            maxLength={60}
            placeholder="Search stories, channels, places"
            autoComplete="off"
            enterKeyHint="search"
            className="masthead-search-input"
          />
          <kbd className="masthead-search-kbd" aria-hidden="true">
            /
          </kbd>
        </form>
      )}

      {isAdmin ? (
        !isLoginPage && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              fetch("/api/auth/logout", { method: "POST" }).then(() => (window.location.href = "/"));
            }}
            style={{
              color: "rgba(255,255,255,0.8)",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textDecoration: "none",
            }}
          >
            Log out
          </a>
        )
      ) : (
        <nav className="masthead-nav flex items-center gap-5 shrink-0">
          <a href="/search" className="masthead-search-icon">
            <SearchIcon size={22} label="Search" />
          </a>
          <a href="/about">About</a>
          <a href="/suggest" className="masthead-cta">
            <span className="cta-full">+ Suggest a video</span>
            <span className="cta-short">+ Suggest</span>
          </a>
        </nav>
      )}
    </div>
  );
}
