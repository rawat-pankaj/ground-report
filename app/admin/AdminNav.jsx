"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Admin menu: six groups. "Add" and "Tools" each hold related pages, shown as
// a second row of tabs while you are inside the group. The current group is
// underlined; Suggested shows how many suggestions wait for review.
const GROUPS = [
  { label: "Published", href: "/admin", match: ["/admin"] },
  { label: "Suggested", href: "/admin/nominations", match: ["/admin/nominations"], badge: true },
  {
    label: "Add",
    href: "/admin/add-video",
    tabs: [
      { label: "One video", href: "/admin/add-video" },
      { label: "From a channel", href: "/admin/add" },
    ],
  },
  { label: "Topics", href: "/admin/categories", match: ["/admin/categories"] },
  {
    label: "Tools",
    href: "/admin/notes",
    tabs: [
      { label: "Notes check", href: "/admin/notes" },
      { label: "Places", href: "/admin/place-suggestions" },
      { label: "Link check", href: "/admin/link-check" },
    ],
  },
  { label: "Stats", href: "/admin/stats", match: ["/admin/stats"] },
];

const isIn = (group, pathname) =>
  (group.match || group.tabs.map((t) => t.href)).includes(pathname);

export default function AdminNav() {
  const pathname = usePathname();
  const [pending, setPending] = useState(0);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/admin/nominations")
      .then((res) => (res.ok ? res.json() : { nominations: [] }))
      .then((data) => setPending((data.nominations || []).filter((n) => n.status === "pending").length))
      .catch(() => {});
  }, [isLoginPage, pathname]);

  if (isLoginPage) return null;

  const current = GROUPS.find((g) => isIn(g, pathname));

  return (
    <nav className="admin-nav mb-6" aria-label="Admin">
      <div className="admin-nav-row">
        {GROUPS.map((group) => (
          <a
            key={group.label}
            href={group.href}
            className={"admin-nav-link" + (group === current ? " is-current" : "")}
            aria-current={group === current ? "page" : undefined}
          >
            {group.label}
            {group.badge && pending > 0 && (
              <span className="admin-badge" aria-label={`${pending} waiting`}>
                {pending}
              </span>
            )}
          </a>
        ))}
      </div>
      {current?.tabs && (
        <div className="admin-subtabs">
          {current.tabs.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              className={"admin-subtab" + (tab.href === pathname ? " is-current" : "")}
              aria-current={tab.href === pathname ? "page" : undefined}
            >
              {tab.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
