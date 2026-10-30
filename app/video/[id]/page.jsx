import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { CARD_SELECT, toCardVideo } from "../../../lib/feed";
import { displayTitle } from "../../../lib/title";
import StoryCard, { formatDate } from "../../StoryCard";
import CopyLinkButton from "./CopyLinkButton";

// Public page for one curated video: embedded player, the curator's note,
// place, categories, channel credit and related stories.
//
// Caching mirrors the homepage: the data is wrapped in unstable_cache with the
// "videos" tag, which every admin write route already revalidates, so editing a
// note/place/category in admin shows up here without any extra wiring.
//
// A miss THROWS inside the cached function on purpose. unstable_cache does not
// cache thrown errors, so random /video/<anything> URLs can't mint unlimited
// cache entries (the same concern the homepage category whitelist guards
// against). Only real, published videos ever get a cache entry.

const VIDEO_ID_RE = /^[\w-]{11}$/;
const NOT_FOUND = "VIDEO_NOT_FOUND";
const RELATED_COUNT = 4;

const getVideoPage = unstable_cache(
  async (youtubeVideoId) => {
    const video = await prisma.video.findFirst({
      where: { youtubeVideoId, status: "published" },
      include: { channel: true, categories: { include: { category: true } } },
    });
    if (!video) throw new Error(NOT_FOUND);

    const categoryIds = video.categories.map((vc) => vc.categoryId);
    const base = { status: "published", id: { not: video.id } };

    // Same-category stories first; top up with the newest others so the
    // section is never empty on a small catalogue. Rows carry what a story card
    // needs (category label, language, channel name), the same as the home grid.
    const sameCategory = categoryIds.length
      ? await prisma.video.findMany({
          where: { ...base, categories: { some: { categoryId: { in: categoryIds } } } },
          select: CARD_SELECT,
          orderBy: { addedAt: "desc" },
          take: RELATED_COUNT,
        })
      : [];

    let related = sameCategory;
    if (related.length < RELATED_COUNT) {
      const filler = await prisma.video.findMany({
        where: { ...base, id: { notIn: [video.id, ...related.map((r) => r.id)] } },
        select: CARD_SELECT,
        orderBy: { addedAt: "desc" },
        take: RELATED_COUNT - related.length,
      });
      related = [...related, ...filler];
    }
    related = related.map(toCardVideo);

    const channelCount = await prisma.video.count({
      where: { channelId: video.channelId, status: "published" },
    });

    return { video, related, channelCount };
  },
  ["video-page"],
  { tags: ["videos"] }
);

async function load(id) {
  if (!VIDEO_ID_RE.test(id)) return null;
  try {
    return await getVideoPage(id);
  } catch (err) {
    if (err?.message === NOT_FOUND) return null;
    throw err;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await load(id);
  if (!data) return { title: "Story not found — PeopleLens", robots: { index: false } };

  const { video } = data;
  const description = (
    video.curatorNote ||
    `Ground report by ${video.channel.name}${video.place ? ` from ${video.place}` : ""}. Hand-picked on PeopleLens.`
  ).slice(0, 200);
  const image = `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;

  return {
    title: `${displayTitle(video.title)} — PeopleLens`,
    description,
    alternates: { canonical: `/video/${video.youtubeVideoId}` },
    openGraph: {
      title: displayTitle(video.title),
      description,
      url: `/video/${video.youtubeVideoId}`,
      siteName: "PeopleLens",
      type: "article",
      images: [{ url: image, width: 480, height: 360 }],
    },
    twitter: { card: "summary_large_image", title: displayTitle(video.title), description, images: [image] },
  };
}

export default async function VideoPage({ params }) {
  const { id } = await params;
  const data = await load(id);
  if (!data) notFound();

  const { video, related, channelCount } = data;
  const categories = video.categories.map((vc) => vc.category);
  const isHindi = video.language === "hi";
  const thumb = `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;

  // VideoObject structured data (eligible for video rich results). "<" is
  // escaped so a title or note can never close the script tag.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.curatorNote || video.title,
    thumbnailUrl: [thumb],
    uploadDate: video.publishedAt ? new Date(video.publishedAt).toISOString() : undefined,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}`,
    url: `https://www.peoplelens.in/video/${video.youtubeVideoId}`,
    author: { "@type": "Organization", name: video.channel.name },
    inLanguage: video.language || undefined,
  }).replace(/</g, "\\u003c");

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <p className="story-meta mb-3">
          <Link href="/" style={{ borderBottom: "1px solid var(--rule)" }}>← All stories</Link>
          {categories[0] && (
            <>
              {" / "}
              <Link href={`/?category=${categories[0].slug}`} style={{ borderBottom: "1px solid var(--rule)" }}>
                {categories[0].name}
              </Link>
            </>
          )}
        </p>

        <h1
          className="story-headline"
          style={{ fontSize: "clamp(22px, 4vw, 28px)", lineHeight: 1.25, letterSpacing: "-0.01em", marginBottom: "10px" }}
        >
          {displayTitle(video.title)}
        </h1>

        <div className="flex flex-wrap items-center mb-3" style={{ gap: "6px 14px" }}>
          <span className="story-meta">{video.channel.name}</span>
          {video.publishedAt && <span className="story-meta">{formatDate(video.publishedAt)}</span>}
          {video.place && (
            <span className="story-meta" style={{ color: "var(--ink)" }}>
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  background: "var(--signal)",
                  marginRight: 6,
                }}
              />
              {video.place}
            </span>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/?category=${c.slug}`} className="tag">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div style={{ position: "relative", aspectRatio: "16/9", background: "#111", border: "1px solid var(--ink)" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?rel=0`}
            title={displayTitle(video.title)}
            loading="lazy"
            allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>

        {video.curatorNote && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--rule)",
              borderLeft: "4px solid var(--signal)",
              padding: "16px 18px",
              margin: "16px 0",
            }}
          >
            <p
              className="story-meta"
              style={{ color: "var(--signal)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {isHindi ? "यह क्यों ज़रूरी है" : "Why this matters"}
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.6, whiteSpace: "pre-line" }}>{video.curatorNote}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 my-4">
          <a
            className="btn btn-primary"
            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on YouTube →
          </a>
          <CopyLinkButton />
        </div>

        <div className="story-card flex items-center gap-3 p-3 mt-6">
          {video.channel.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.channel.thumbnailUrl} alt="" width={44} height={44} style={{ borderRadius: "50%" }} />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#1A6EBD",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {video.channel.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="story-headline text-[15px]">{video.channel.name}</p>
            <p className="story-meta" style={{ fontSize: "10px" }}>
              {channelCount} {channelCount === 1 ? "story" : "stories"} on PeopleLens
            </p>
          </div>
          <a
            className="btn btn-outline"
            style={{ padding: "6px 12px", fontSize: "13px" }}
            href={`https://www.youtube.com/channel/${video.channel.youtubeChannelId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Channel →
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2
            className="story-meta"
            style={{ fontWeight: 400, letterSpacing: "0.06em", paddingBottom: "6px", borderBottom: "1px solid var(--rule)", marginBottom: "12px" }}
          >
            Related stories
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map((r) => (
              <StoryCard key={r.id} video={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
