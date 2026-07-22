import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

const LANGUAGES = [
  { value: "", label: "All" },
  { value: "hi", label: "हिंदी" },
  { value: "en", label: "English" },
];

function timeAgo(date) {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function FeaturedCard({ video }) {


  return (
    <a
      href={"https://www.youtube.com/watch?v=" + video.youtubeVideoId}
      target="_blank"
      rel="noopener noreferrer"
      className="story-card overflow-hidden flex flex-col col-span-2 row-span-2"
    >
      <div style={{ position: "relative", width: "100%" }}>
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        )}
        <span style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "var(--signal)",
          color: "#fff",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "3px 8px",
        }}>
          Featured
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3 w-full">
        <div>
          <p className="story-headline text-[18px] leading-snug mb-2">{video.title}</p>
          <p className="story-meta">{video.channel.name} · {timeAgo(video.publishedAt)}</p>
        </div>

        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          padding: "8px 14px",
          alignSelf: "flex-start",
        }}>
          Watch on YouTube →
        </span>
      </div>
    </a>
  );
}

function StoryCard({ video }) {
  return (
    <a
      href={"https://www.youtube.com/watch?v=" + video.youtubeVideoId}
      target="_blank"
      rel="noopener noreferrer"
      className="story-card overflow-hidden flex flex-col"
    >
      {video.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" className="w-full aspect-video object-cover shrink-0" />
      )}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2 w-full">
        <div>
          <p className="story-headline text-[13px] leading-snug mb-1">{video.title}</p>
          <p className="story-meta" style={{ fontSize: "10px" }}>
            {video.channel.name} · {timeAgo(video.publishedAt)}
          </p>
        </div>

      </div>
    </a>
  );
}

export default async function FeedPage({ searchParams }) {
  const params = await searchParams;
  const language = params?.language || "";
  const beat = params?.beat || "";
  const noFilters = !language && !beat;

  const where = { status: "published" };
  if (language) where.language = language;
  if (beat) where.beatTags = { contains: beat };

  const hero = noFilters
    ? await prisma.video.findFirst({
        where: { status: "published", featured: true },
        include: { channel: true },
      })
    : null;

  const gridWhere = hero ? { ...where, id: { not: hero.id } } : where;
  const videos = await prisma.video.findMany({
    where: gridWhere,
    include: { channel: true },
    orderBy: { addedAt: "desc" },
    take: 100,
  });


  function hrefFor(nextLanguage, nextBeat) {
    const p = new URLSearchParams();
    if (nextLanguage) p.set("language", nextLanguage);
    if (nextBeat) p.set("beat", nextBeat);
    const qs = p.toString();
    return qs ? "/" + "?" + qs : "/";
  }

  return (
    <div>
      <div className="mb-6">
        <p style={{ color: "var(--ink)", fontSize: "15px", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: "4px" }}>
          Ground-level reporting on issues that affect ordinary people!
        </p>
        <p className="story-meta !text-[11px] !normal-case" style={{ color: "var(--ink-soft)" }}>
          Picked by hand &nbsp;|&nbsp; Not by algorithm
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {LANGUAGES.map((l) => (
          <a
            key={l.value}
            href={hrefFor(l.value, beat)}
            className={"tag " + (language === l.value ? "tag-active" : "")}
          >
            {l.label}
          </a>
        ))}
      </div>


      {videos.length === 0 && !hero && (
        <div className="panel text-center py-12">
          <p className="story-meta mb-2">No dispatches yet</p>
          <p style={{ color: "var(--ink-soft)" }} className="text-sm">
            Nothing matches these filters. Try "All" above.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {hero && <FeaturedCard video={hero} />}
        {videos.map((video) => (
          <StoryCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

