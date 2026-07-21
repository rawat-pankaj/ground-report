import { prisma } from "../lib/prisma";
import BeatFilters from "./BeatFilters";

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

export default async function FeedPage({ searchParams }) {
  const params = await searchParams;
  const language = params?.language || "";
  const beat = params?.beat || "";

  const where = { status: "published" };
  if (language) where.language = language;
  if (beat) where.beatTags = { contains: beat };

  const videos = await prisma.video.findMany({
    where,
    include: { channel: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  const beats = await prisma.video.findMany({
    where: { status: "published", beatTags: { not: null } },
    select: { beatTags: true },
    distinct: ["beatTags"],
  });
  const beatOptions = [
    ...new Set(
      beats.flatMap((v) => (v.beatTags ? v.beatTags.split(",").map((t) => t.trim()) : []))
    ),
  ].filter(Boolean);

  function hrefFor(nextLanguage, nextBeat) {
    const params = new URLSearchParams();
    if (nextLanguage) params.set("language", nextLanguage);
    if (nextBeat) params.set("beat", nextBeat);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div>
      <div className="mb-6">
        <p className="story-meta !text-[13px] !normal-case" style={{ color: "var(--ink-soft)" }}>
          Real issues. Stories about the people.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {LANGUAGES.map((l) => (
          <a
            key={l.value}
            href={hrefFor(l.value, beat)}
            className={`tag ${language === l.value ? "tag-active" : ""}`}
          >
            {l.label}
          </a>
        ))}
      </div>
      {beatOptions.length > 0 && (
       <BeatFilters beatOptions={beatOptions} activeBeat={beat} language={language} />
      )}

      {videos.length === 0 && (
        <div className="panel text-center py-12">
          <p className="story-meta mb-2">No dispatches yet</p>
          <p style={{ color: "var(--ink-soft)" }} className="text-sm">
            Nothing matches these filters. Try "All" above, or come back once the desk has curated more.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {videos.map((video) => {
          const primaryTag = video.beatTags ? video.beatTags.split(",")[0].trim() : video.language;
          return (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="story-card overflow-hidden flex sm:flex-row flex-col items-start"
	     >
              {video.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="w-full sm:w-48 aspect-video object-cover shrink-0"
                />
              )}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className="story-headline text-[16px] leading-snug mb-2">{video.title}</p>
                  <p className="story-meta">
                    {video.channel.name} · {timeAgo(video.publishedAt)}
                  </p>
                </div>
                {primaryTag && <span className="stamp self-start">{primaryTag}</span>}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
