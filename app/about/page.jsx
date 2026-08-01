export const metadata = {
  title: "About — PeopleLens",
  description: "Why this exists and how videos are chosen.",
  openGraph: {
    title: "About — PeopleLens",
    description: "Why this exists and how videos are chosen.",
    url: "https://www.peoplelens.in/about",
  },
  twitter: {
    title: "About — PeopleLens",
    description: "Why this exists and how videos are chosen.",
  },
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
          marginBottom: "14px",
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
          marginBottom: "14px",
        }}
      >
        About
      </h1>

      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink)", marginBottom: "10px" }}>
        Every day, independent journalists across India travel to places the studio panels never
        reach — and report what they find. Those stories rarely surface in your feed.
      </p>

      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "16px" }}>
        This is where they are collected. Every video here is watched and chosen by a person, not
        surfaced by an algorithm optimising for outrage.
      </p>

      <hr className="divider" style={{ marginBottom: "14px" }} />

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        What we look for
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "14px" }}>
        Reporting from the ground, on issues that affect ordinary people. No propaganda, no
        manufactured outrage, no narrative dressed up as news. If a story cannot stand on what was
        actually seen and recorded, it does not belong here.
      </p>

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        How videos are chosen
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "14px" }}>
        Nothing is automated. Every video is watched before it is published here, and credit stays
        with the journalist who did the work — each story links straight back to the original
        channel on YouTube.
      </p>

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        Anyone can contribute
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)", marginBottom: "14px" }}>
        Found a report worth sharing? Send it across and a human will review it before it appears
        here. Suggestions are welcome for individual videos or for channels worth following.
      </p>

      <a href="/suggest" className="btn btn-primary">
        Suggest a video
      </a>

      <hr className="divider" style={{ marginTop: "14px", marginBottom: "14px" }} />

      <p className="eyebrow" style={{ marginBottom: "10px" }}>
        Contact
      </p>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-soft)" }}>
        <a href="mailto:contact@peoplelens.in" style={{ color: "var(--signal)" }}>
          contact@peoplelens.in
        </a>
      </p>
    </div>
  );
}
