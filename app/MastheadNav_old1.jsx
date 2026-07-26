"use client";

import { usePathname } from "next/navigation";

export default function MastheadNav() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <nav className="masthead-nav flex items-center gap-5">
      {!isAdmin && <a href="/about">About</a>}
      {!isAdmin && (
        <a
          href="/suggest"
          style={{
            background: "var(--signal)",
            color: "#fff",
            padding: "7px 14px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "none",
            display: "inline-block",
          }}
        >
          + Suggest a video
        </a>
      )}
    </nav>
  );
}
