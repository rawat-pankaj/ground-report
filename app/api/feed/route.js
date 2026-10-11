import { NextResponse } from "next/server";
import { PAGE_SIZE, cleanLanguage, getCategories, getHero, getFeedPage } from "../../../lib/feed";

// Public, read-only. Powers the homepage "Load more" button. Every parameter is
// validated into a small set before it reaches the cached query, so arbitrary
// URLs cannot create unbounded cache entries or database queries.

const MAX_OFFSET = 2000;

export async function GET(request) {
  const params = new URL(request.url).searchParams;

  const offset = Number.parseInt(params.get("offset") || "0", 10);
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET || offset % PAGE_SIZE !== 0) {
    return NextResponse.json({ error: "invalid offset" }, { status: 400 });
  }

  const language = cleanLanguage(params.get("language"));

  // Same whitelist the page uses: unknown categories fall back to "all".
  const categories = await getCategories();
  const requested = params.get("category") || "";
  const category = categories.some((c) => c.slug === requested) ? requested : "";

  // The page only shows (and so only excludes) the featured hero when no
  // filter is active; mirror that so the two lists never overlap or skip.
  const hero = !language && !category ? await getHero() : null;

  const page = await getFeedPage(language, category, offset, hero?.id || null);
  return NextResponse.json(page, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
