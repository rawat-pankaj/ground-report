"use client";

import { useEffect, useRef, useState } from "react";
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
  const dropRef = useRef(null);
  const [dropOpen, setDropOpen] = useState(false);
  // Search lives in the bar on the home page only (including its ?category= views,
  // since pathname ignores the query). Other pages, e.g. /search, have their own box.
  const showSearch = !isAdmin && pathname === "/";

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

  // The phone search box is closed whenever the page changes.
  useEffect(() => {
    setDropOpen(false);
  }, [pathname]);

  // ...and takes focus as soon as it opens, so the keyboard comes up.
  useEffect(() => {
    if (dropOpen) dropRef.current?.focus();
  }, [dropOpen]);

  function onIconClick(e) {
    // Plain tap: open the box under the bar so the stories stay on screen.
    // Modified clicks and no-JS visits fall through to the /search link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setDropOpen((o) => !o);
  }

  return (
    <>
      <div
        className={
          // Shorter on phones, where the strapline gets its own row below.
          "max-w-6xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between gap-3" +
          // With the search pill: three columns so the pill sits at the true centre.
          (showSearch ? " lg:grid lg:grid-cols-[1fr_400px_1fr] lg:gap-6" : "")
        }
      >
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
            <p className="masthead-strap hidden md:block">Picked by hand &nbsp;·&nbsp; Not by algorithm</p>
          )}
        </div>

        {showSearch && (
          // Plain GET form to /search, so it works without JavaScript (Enter submits).
          // Wide screens get the pill; below lg the nav shows a search icon that
          // opens a box under the bar instead.
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
          <nav className="masthead-nav flex items-center gap-5 shrink-0 lg:justify-self-end">
            {showSearch && (
              <a
                href="/search"
                className="masthead-search-icon"
                onClick={onIconClick}
                aria-expanded={dropOpen}
                aria-controls="masthead-drop"
              >
                <SearchIcon size={22} label="Search" />
              </a>
            )}
            <a href="/about">About</a>
            <a href="/suggest" className="masthead-cta">
              <span className="cta-full">+ Suggest a video</span>
              <span className="cta-short">+ Suggest</span>
            </a>
          </nav>
        )}
      </div>

      {!isAdmin && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:hidden">
          <p className="masthead-strap masthead-strap-row">Picked by hand &nbsp;·&nbsp; Not by algorithm</p>
        </div>
      )}

      {showSearch && dropOpen && (
        // Phone/tablet search box: sits under the blue bar and pushes the page
        // down, so the stories stay visible. Submitting goes to /search.
        <div id="masthead-drop" className="masthead-drop lg:hidden">
          <form action="/search" method="get" role="search" className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="masthead-drop-field">
              <span className="masthead-search-glyph">
                <SearchIcon />
              </span>
              <label htmlFor="masthead-drop-q" className="sr-only">
                Search stories
              </label>
              <input
                id="masthead-drop-q"
                ref={dropRef}
                name="q"
                type="search"
                maxLength={60}
                placeholder="Search stories, channels, places"
                autoComplete="off"
                enterKeyHint="search"
                className="masthead-search-input"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setDropOpen(false);
                }}
              />
              <button
                type="button"
                className="masthead-drop-close"
                aria-label="Close search"
                onClick={() => setDropOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
