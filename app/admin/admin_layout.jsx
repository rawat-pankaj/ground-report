"use client";

export default function AdminLayout({ children }) {
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
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--rule)" }}>
        <nav className="flex items-center gap-5">
          <a href="/admin" style={navLinkStyle}>Videos</a>
          <a href="/admin/add" style={navLinkStyle}>Add channel</a>
          <a href="/admin/add-video" style={navLinkStyle}>Add video</a>
          <a href="/admin/nominations" style={navLinkStyle}>Nominations</a>
        </nav>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            fetch("/api/auth/logout", { method: "POST" }).then(() => (window.location.href = "/"));
          }}
          style={navLinkStyle}
        >
          Log out
        </a>
      </div>
      {children}
    </div>
  );
}
