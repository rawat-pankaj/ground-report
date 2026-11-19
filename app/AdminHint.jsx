"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_MARKER_COOKIE } from "../lib/adminMarker";

// Admin-only nudge on the homepage: with no video marked featured the hero just
// disappears, which looks like a bug to the person who curates the page. The
// homepage is a ready-made page, so the server can't check the session; the
// browser shows this only when the readable "signed in" marker set at login is
// present (lib/adminMarker.js). Visitors never see it and make no extra request.
export default function AdminHint() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(document.cookie.split("; ").includes(`${ADMIN_MARKER_COOKIE}=1`));
  }, []);

  if (!isAdmin) return null;

  return (
    <div
      role="note"
      className="mb-3 text-sm"
      style={{ border: "1px dashed var(--signal)", background: "var(--signal-tint)", padding: "10px 14px", color: "var(--ink)" }}
    >
      <span className="story-meta" style={{ color: "var(--signal)", marginRight: "8px" }}>Admin only</span>
      No featured story set.{" "}
      <Link href="/admin" style={{ textDecoration: "underline" }}>
        Go to Admin
      </Link>{" "}
      to pin one.
    </div>
  );
}
