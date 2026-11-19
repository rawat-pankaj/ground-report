import { NextResponse } from "next/server";
import {
  PAGE_SIZE,
  cleanLanguage,
  getCategories,
  getHero,
  getFeedPage,
  loadChannelPage,
  getChannelFeedPage,
} from "../../../lib/feed";

// Public, read-only. Powers the "Load more" button on the homepage, category
// pages and channel pages. Every parameter is validated into a small set
// before it reaches a cached query, so arbitrary URLs cannot create unbounded
// cache entries or database queries.

const MAX_OFFSET = 2000;
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

export async function GET(request) {
  const params = new URL(request.url).searchParams;

  const offset = Number.parseInt(params.get("offset") || "0", 10);
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET || offset % PAGE_SIZE !== 0) {
    return NextResponse.json({ error: "invalid offset" }, { status: 400 });
  }

  const requested = params.get("category") || "";

  // Channel page: the channel must exist (with published stories) and the
  // category must be one of that channel's.
  if (params.has("channel")) {
    const data = await loadChannelPage(params.get("channel"));
    if (!data) return NextResponse.json({ error: "unknown channel" }, { status: 404 });
    const category = data.categories.some((c) => c.slug === requested) ? requested : "";
    const page = await getChannelFeedPage(data.channel.id, category, offset);
    return NextResponse.json(page, { headers: CACHE_HEADERS });
  }

  const language = cleanLanguage(params.get("language"));

  // Same whitelist the pages use: unknown categories fall back to "all".
  const categories = await getCategories();
  const category = categories.some((c) => c.slug === requested) ? requested : "";

  // The homepage only shows (and so only excludes) the featured hero when no
  // filter is active; mirror that so the two lists never overlap or skip.
  const hero = !language && !category ? await getHero() : null;

  const page = await getFeedPage(language, category, offset, hero?.id || null);
  return NextResponse.json(page, { headers: CACHE_HEADERS });
}
