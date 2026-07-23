"use client";

export default function AdminLayout({ children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--rule)" }}>
        <nav className="masthead-nav flex items-center gap-5">
          <a href="/admin">Videos</a>
          <a href="/admin/add">Add channel</a>
          <a href="/admin/add-video">Add video</a>
          <a href="/admin/nominations">Nominations</a>
        </nav>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            fetch("/api/auth/logout", { method: "POST" }).then(() => (window.location.href = "/"));
          }}
          className="masthead-nav"
        >
          Log out
        </a>
      </div>
      {children}
    </div>
  );
}
