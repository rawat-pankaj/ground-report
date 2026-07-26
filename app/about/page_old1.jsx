export const metadata = {
  title: "About — PeopleLens",
  description: "Why this exists and how videos are chosen.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <a
        href="/"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--ink-soft)",
          display: "inline-block",
          marginBottom: "20px",
        }}
      >
        ← Back to stories
      </a>

      <h1
        style={{
          fontSize: "26px",
          fontWeight: 700,
          color: "var(--ink)",
          fontFamily: "'Archivo Narrow', sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          marginBottom: "20px",
        }}
      >
        About
      </h1>

      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink)", marginBottom: "16px" }}>
        Every day, independent journalists across India travel to places the studio panels never
        reach — and report what they find. Those stories rarely surface in your feed.
      </p>

      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "32px" }}>
        This is where they are collected. Every video here is watched and chosen by a person, not
        surfaced by an algorithm optimising for outrage.
      </p>

      <hr className="divider" style={{ marginBottom: "28px" }} />

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        What we look for
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "28px" }}>
        Reporting from the ground, on issues that affect ordinary people. No propaganda, no
        manufactured outrage, no narrative dressed up as news. If a story cannot stand on what was
        actually seen and recorded, it does not belong here.
      </p>

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        How videos are chosen
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "28px" }}>
        Nothing is automated. Every video is watched before it is published here, and credit stays
        with the journalist who did the work — each story links straight back to the original
        channel on YouTube.
      </p>

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        Anyone can contribute
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "28px" }}>
        Found a report worth sharing? Send it across and a human will review it before it appears
        here. Suggestions are welcome for individual videos or for channels worth following.
      </p>

      <a href="/suggest" className="btn btn-primary">
        Suggest a video
      </a>
    </div>
  );
}
