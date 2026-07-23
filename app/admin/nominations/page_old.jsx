"use client";

import { useEffect, useState } from "react";

export default function NominationsPage() {
  const [nominations, setNominations] = useState(null);

  async function load() {
    const res = await fetch("/api/admin/nominations");
    const data = await res.json();
    setNominations(data.nominations);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(nomination, status) {
    await fetch(`/api/admin/nominations/${nomination.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function reviewInPicker(nomination) {
    const base = nomination.type === "video" ? "/admin/add-video?video=" : "/admin/add?channel=";
    window.location.href = base + encodeURIComponent(nomination.input);
  }

  if (!nominations) return <p className="story-meta">Loading…</p>;

  const pending = nominations.filter((n) => n.status === "pending");
  const reviewed = nominations.filter((n) => n.status !== "pending");

  return (
    <div>
      <p className="eyebrow mb-1">Review queue</p>
      <h1 className="masthead-mark text-[22px] mb-4">Nominations ({pending.length} pending)</h1>

      <div className="flex flex-col gap-3 mb-8">
        {pending.map((n) => (
          <div key={n.id} className="panel">
            <div className="flex items-center gap-2 mb-1">
              <span className="stamp !rotate-0">{n.type === "video" ? "video" : "channel"}</span>
              <p className="story-headline text-[14px] break-all">{n.input}</p>
            </div>
            {n.reasonText && <p className="text-[13px] mb-2" style={{ color: "var(--ink-soft)" }}>{n.reasonText}</p>}
            <p className="story-meta mb-3">
              {new Date(n.submittedAt).toLocaleDateString()}
              {n.submitterContact ? ` · ${n.submitterContact}` : ""}
            </p>
            <div className="flex gap-2">
              <button className="btn text-[12px] py-1.5" onClick={() => reviewInPicker(n)}>
                Review &amp; pick
              </button>
              <button
                className="btn btn-danger-outline text-[12px] py-1.5"
                onClick={() => setStatus(n, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="story-meta">No pending nominations.</p>}
      </div>

      {reviewed.length > 0 && (
        <>
          <p className="eyebrow mb-2">Reviewed</p>
          <div className="flex flex-col gap-2">
            {reviewed.map((n) => (
              <div key={n.id} className="text-[12px] flex justify-between" style={{ color: "var(--ink-soft)" }}>
                <span className="break-all">
                  <span className="story-meta mr-2">{n.type}</span>
                  {n.input}
                </span>
                <span>{n.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
