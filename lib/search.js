import { prisma } from "./prisma";

// On-site search over published videos. Deliberately NOT wrapped in
// unstable_cache: the cache key would be the free-text query, which is exactly
// the unbounded-key case the other lib/feed.js functions are built to avoid.
// Instead the input is capped hard (length, word count, characters), and the
// query runs against a few hundred rows next to the database, so a miss costs
// one cheap indexless scan. Nothing about the query text is stored or logged.
//
// Postgres 'simple' text-search config: no stemming, no stop words, and it keeps
// whole Devanagari words intact (checked against the live database), so Hindi
// and English titles are matched the same way. Each word is a prefix match.

export const SEARCH_LIMIT = 24;
export const MAX_QUERY_LENGTH = 60;
const MAX_TERMS = 5;
const MAX_TERM_LENGTH = 30;

// Words only: letters, combining marks (Devanagari vowel signs) and digits.
// Everything else is a separator, which also keeps tsquery operators and
// quotes out of the query we build below.
export function cleanSearchTerms(raw) {
  const text = String(raw || "").normalize("NFC").slice(0, MAX_QUERY_LENGTH).toLowerCase();
  return text
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, MAX_TERMS)
    .map((t) => t.slice(0, MAX_TERM_LENGTH));
}

export async function searchVideos(raw) {
  const terms = cleanSearchTerms(raw);
  if (terms.length === 0) return { terms, videos: [] };

  // Only [letters marks digits] and ":*" / "&" reach Postgres, as one bound parameter.
  const tsQuery = terms.map((t) => `${t}:*`).join(" & ");

  const rows = await prisma.$queryRaw`
    WITH q AS (SELECT to_tsquery('simple', ${tsQuery}::text) AS query),
    docs AS (
      SELECT
        v.id,
        v."youtubeVideoId",
        v.title,
        v."thumbnailUrl",
        v."publishedAt",
        v.language,
        v."addedAt",
        c.name AS "channelName",
        (
          SELECT cat.name
          FROM "VideoCategory" vc
          JOIN "Category" cat ON cat.id = vc."categoryId"
          WHERE vc."videoId" = v.id
          ORDER BY (SELECT count(*) FROM "VideoCategory" x WHERE x."categoryId" = cat.id) DESC, cat.name
          LIMIT 1
        ) AS "categoryName",
        setweight(to_tsvector('simple', coalesce(v.title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(v.place, '') || ' ' || coalesce((
          SELECT string_agg(cat.name, ' ')
          FROM "VideoCategory" vc
          JOIN "Category" cat ON cat.id = vc."categoryId"
          WHERE vc."videoId" = v.id
        ), '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(c.name, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(v."curatorNote", '')), 'D') AS doc
      FROM "Video" v
      JOIN "Channel" c ON c.id = v."channelId"
      WHERE v.status = 'published'
    )
    SELECT d.id, d."youtubeVideoId", d.title, d."thumbnailUrl", d."publishedAt", d.language, d."channelName", d."categoryName"
    FROM docs d, q
    WHERE d.doc @@ q.query
    ORDER BY ts_rank(d.doc, q.query) DESC, d."addedAt" DESC, d.id DESC
    LIMIT ${SEARCH_LIMIT}
  `;

  // Shaped like the feed rows so StoryCard can render them unchanged.
  const videos = rows.map((r) => ({
    id: r.id,
    youtubeVideoId: r.youtubeVideoId,
    title: r.title,
    thumbnailUrl: r.thumbnailUrl,
    publishedAt: r.publishedAt,
    language: r.language,
    channel: { name: r.channelName },
    categoryName: r.categoryName,
  }));

  return { terms, videos };
}
