import Link from "next/link";

// Shared by the server-rendered first batch (app/page.jsx) and the client-side
// "Load more" batches (app/LoadMore.jsx). Pure and prop-driven so it works in both.

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

export default function StoryCard({ video }) {
  return (
    <Link
      href={"/video/" + video.youtubeVideoId}
      className="story-card overflow-hidden flex flex-col h-full"
    >
      {video.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" className="w-full aspect-video object-cover shrink-0" />
      )}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2 w-full">
        <div>
          <p
            className="story-headline text-[14px] leading-snug mb-1"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {video.title}
          </p>
          <p className="story-meta" style={{ fontSize: "10px" }}>
            {video.channel.name} · {timeAgo(video.publishedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
