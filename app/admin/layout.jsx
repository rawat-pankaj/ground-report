"use client";

import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

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

  const navLinkHoverStyle = {
    color: "var(--signal)",
  };

  return (
    <div>
      {!isLoginPage && (
        <nav
          className="flex items-center gap-5 mb-6 pb-4"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <a href="/admin" style={navLinkStyle}>Published Videos</a>
          <a href="/admin/nominations" style={navLinkStyle}>Suggested Videos</a>
          <a href="/admin/add-video" style={navLinkStyle}>Add video</a>
          <a href="/admin/add" style={navLinkStyle}>Add channel</a>
          <a href="/admin/categories" style={navLinkStyle}>Categories</a>
        </nav>
      )}
      {children}
    </div>
  );
}
