"use client";

import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) return null;

  const navLinkStyle = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--ink-soft)",
    borderBottom: "1px solid transparent",
    paddingBottom: "2px",
    textDecoration: "none",
  };

  return (
    <nav
      className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 pb-4"
      style={{ borderBottom: "1px solid var(--rule)" }}
    >
      <a href="/admin" style={navLinkStyle}>Published Videos</a>
      <a href="/admin/nominations" style={navLinkStyle}>Suggested Videos</a>
      <a href="/admin/add-video" style={navLinkStyle}>Add video</a>
      <a href="/admin/add" style={navLinkStyle}>Add channel</a>
      <a href="/admin/categories" style={navLinkStyle}>Categories</a>
      <a href="/admin/place-suggestions" style={navLinkStyle}>Places</a>
      <a href="/admin/stats" style={navLinkStyle}>Stats</a>
      <a href="/admin/link-check" style={navLinkStyle}>Link check</a>
    </nav>
  );
}
