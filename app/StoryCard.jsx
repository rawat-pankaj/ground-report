import Link from "next/link";
import { displayTitle } from "../lib/title";

// Shared by the server-rendered first batch (app/page.jsx), the client-side
// "Load more" batches (app/LoadMore.jsx) and the search results. Pure and
// prop-driven so it works in both.

export function timeAgo(date) {
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

// "26 Oct 2026". Fixed to India time so the server render and the client-side
// "Load more" render always agree on the day.
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function formatDate(date) {
  if (!date) return "";
  return dateFormat.format(new Date(date));
}

const LANGUAGE_NAMES = { hi: "Hindi", en: "English" };

// Category label with a small language tag at the right ("HI" or "EN"). Shared by
// the grid cards and the featured card so they stay identical.
export function CardLabel({ category, language }) {
  if (!category && !language) return null;
  const code = language ? String(language).toLowerCase() : "";
  return (
    <div className="card-label-row">
      <p className="card-eyebrow" title={category || undefined}>{category}</p>
      {code && (
        <span className="card-lang" title={LANGUAGE_NAMES[code] || code.toUpperCase()}>
          <span aria-hidden="true">{code.toUpperCase()}</span>
          <span className="sr-only">Language: {LANGUAGE_NAMES[code] || code.toUpperCase()}</span>
        </span>
      )}
    </div>
  );
}

export default function StoryCard({ video }) {
  const date = formatDate(video.publishedAt);

  return (
    <Link
      href={"/video/" + video.youtubeVideoId}
      className="story-card overflow-hidden flex flex-col h-full"
    >
      {video.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" loading="lazy" decoding="async" className="w-full aspect-video object-cover shrink-0" />
      )}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2 w-full">
        <div>
          <CardLabel category={video.categoryName} language={video.language} />
          <p
            className="story-headline text-[14px] leading-snug mb-1"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {displayTitle(video.title)}
          </p>
          <p className="story-meta">
            {video.channel.name}{date ? ` · ${date}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
