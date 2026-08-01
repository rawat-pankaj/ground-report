"use client";

import { usePathname } from "next/navigation";

export default function MastheadBar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
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
