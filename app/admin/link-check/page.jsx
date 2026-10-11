"use client";

import { useState } from "react";

export default function AdminLinkCheck() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function runCheck() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/admin/check-videos", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Check failed");
    }
    setRunning(false);
  }

  async function hide(problem) {
    const res = await fetch(`/api/admin/videos/${problem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "hidden" }),
    });
    if (!res.ok) return;
    setResult((prev) => ({
      ...prev,
      problems: prev.problems.map((p) => (p.id === problem.id ? { ...p, status: "hidden" } : p)),
    }));
  }

  async function remove(problem) {
    if (!confirm(`Remove "${problem.title}" permanently?`)) return;
    const res = await fetch(`/api/admin/videos/${problem.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not remove — try again.");
      return;
    }
    setResult((prev) => ({
      ...prev,
      problems: prev.problems.filter((p) => p.id !== problem.id),
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "'Archivo Narrow', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Link check
        </h1>
        <button className="btn btn-primary text-[12px] py-1" onClick={runCheck} disabled={running}>
          {running ? "Checking…" : result ? "Check again" : "Check all videos"}
        </button>
      </div>

      <p className="story-meta mb-4">
        Finds curated videos that were deleted, made private, or are blocked in India, so readers
        don&apos;t land on an error. Nothing changes until you hide or remove a video yourself.
      </p>

      {error && (
        <p className="story-meta mb-4" style={{ color: "var(--signal)" }}>
          {error}
        </p>
      )}

      {result && (
        <>
          <p className="story-meta mb-3">
            Checked {result.checked} video{result.checked === 1 ? "" : "s"} ·{" "}
            {new Date(result.checkedAt).toLocaleString()} ·{" "}
            {result.problems.length === 0
              ? "all available"
              : `${result.problems.length} problem${result.problems.length === 1 ? "" : "s"}`}
          </p>

          <div className="flex flex-col gap-2">
            {result.problems.map((p) => (
              <div key={p.id} className="story-card p-3 flex gap-3 items-center">
                <div className="flex-1 min-w-0">
                  <p className="story-headline text-[14px]">{p.title}</p>
                  <p className="story-meta mt-1" style={{ fontSize: "10px" }}>
                    {p.channel} &nbsp;·&nbsp;{" "}
                    <span style={{ color: "var(--signal)" }}>{p.reason}</span> &nbsp;·&nbsp;{" "}
                    {p.status === "hidden" ? "hidden" : "still live on the site"}
                    {p.featured ? " · featured" : ""}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  <a
                    className="btn btn-outline text-[12px] py-1"
                    href={`https://www.youtube.com/watch?v=${p.youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Verify
                  </a>
                  {p.status !== "hidden" && (
                    <button className="btn btn-outline text-[12px] py-1" onClick={() => hide(p)}>
                      Hide
                    </button>
                  )}
                  <button className="btn btn-danger-outline text-[12px] py-1" onClick={() => remove(p)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
