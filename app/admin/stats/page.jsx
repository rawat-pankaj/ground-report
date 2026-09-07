"use client";

import { useEffect, useState } from "react";

const RANGE_OPTIONS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

function StatCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid var(--rule)",
        padding: "16px",
        background: "var(--paper)",
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-soft)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Archivo Narrow', sans-serif",
          fontWeight: 700,
          fontSize: "28px",
          color: "var(--ink)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h2
      style={{
        fontFamily: "'Archivo Narrow', sans-serif",
        fontWeight: 700,
        fontSize: "14px",
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        color: "var(--ink)",
        marginBottom: "12px",
      }}
    >
      {children}
    </h2>
  );
}

// A simple inline SVG bar chart -- no charting library dependency. Built
// directly against the day-bucketed data from the API.
function ActivityChart({ data }) {
  const width = 900;
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.map((d) => d.count));
  const barGap = 2;
  const barW = data.length > 0 ? chartW / data.length - barGap : 0;

  // Label every Nth bar so long ranges (90d/1y) don't crowd the axis.
  const labelEvery = Math.max(1, Math.ceil(data.length / 10));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      {data.map((d, i) => {
        const barH = (d.count / max) * chartH;
        const x = padding.left + i * (barW + barGap);
        const y = padding.top + (chartH - barH);
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={Math.max(barW, 1)}
              height={Math.max(barH, d.count > 0 ? 2 : 0)}
              fill={d.count > 0 ? "var(--signal)" : "var(--rule)"}
            >
              <title>{`${d.date}: ${d.count} video${d.count === 1 ? "" : "s"}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="9"
                fontFamily="'IBM Plex Mono', monospace"
                fill="var(--ink-soft)"
              >
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Horizontal bar list -- used for channels, languages, categories. Simpler
// and more legible than trying to force everything into vertical bars.
function HorizontalBars({ items, maxItems = 12 }) {
  const shown = items.slice(0, maxItems);
  const max = Math.max(1, ...shown.map((i) => i.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {shown.map((item) => (
        <div key={item.name || item.language} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "160px",
              flexShrink: 0,
              fontSize: "12px",
              color: "var(--ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name || item.language}
          </span>
          <div style={{ flex: 1, background: "var(--rule)", height: "14px", position: "relative" }}>
            <div
              style={{
                width: `${(item.count / max) * 100}%`,
                background: "var(--signal)",
                height: "100%",
              }}
            />
          </div>
          <span
            style={{
              width: "32px",
              flexShrink: 0,
              textAlign: "right",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: "var(--ink-soft)",
            }}
          >
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminStats() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, [days]);

  if (loading && !stats) return <p className="story-meta">Loading stats…</p>;
  if (!stats) return <p className="story-meta">Could not load stats.</p>;

  return (
    <div className="flex flex-col gap-8">
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
            Stats
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <StatCard label="Total videos" value={stats.totals.videos} />
          <StatCard label="Published" value={stats.totals.published} />
          <StatCard label="Hidden" value={stats.totals.hidden} />
          <StatCard label="Featured" value={stats.totals.featured} />
          <StatCard label="Channels" value={stats.totals.channels} />
        </div>

        {stats.totals.featured === 0 && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--signal)",
              marginTop: "-20px",
              marginBottom: "24px",
            }}
          >
            No featured story set — go to <a href="/admin" style={{ textDecoration: "underline" }}>Published Videos</a> to pin one.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Curation activity</SectionLabel>
          <div className="flex gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                className={"tag " + (days === opt.days ? "tag-active" : "")}
                style={{ cursor: "pointer" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="story-meta">Updating…</p>
        ) : (
          <ActivityChart data={stats.dailyActivity} />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <SectionLabel>Top sources</SectionLabel>
          <HorizontalBars items={stats.topChannels} />
        </div>

        <div>
          <SectionLabel>Categories</SectionLabel>
          <HorizontalBars items={stats.categories} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <SectionLabel>Language</SectionLabel>
          <HorizontalBars items={stats.languages} maxItems={5} />
        </div>

        <div>
          <SectionLabel>Suggestions</SectionLabel>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--ink-soft)" }}>Pending</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stats.nominations.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--ink-soft)" }}>Approved</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stats.nominations.approved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--ink-soft)" }}>Rejected</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stats.nominations.rejected}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
