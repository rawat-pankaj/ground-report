import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryPills from "../../CategoryPills";
import StoryCard from "../../StoryCard";
import LoadMore from "../../LoadMore";
import { PAGE_SIZE, getCategories, getFeedPage } from "../../../lib/feed";

// /category/<slug>: one topic's stories, newest picks first, with "Load more".
// The slug is checked against the cached category list before anything else,
// so a made-up URL is a 404 and never reaches the cached feed query.

async function findCategory(slug) {
  const categories = await getCategories();
  return { categories, category: categories.find((c) => c.slug === slug) || null };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { category } = await findCategory(slug);
  if (!category) return { title: "Topic not found — PeopleLens", robots: { index: false } };

  const title = `${category.name} — PeopleLens`;
  const description = `${category._count.videos} independent ground reports on ${category.name.toLowerCase()} from India, hand-picked from YouTube journalists.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title, description, url: `/category/${category.slug}`, siteName: "PeopleLens", type: "website" },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const { categories, category } = await findCategory(slug);
  if (!category) notFound();

  const { videos, hasMore } = await getFeedPage("", category.slug, 0, null);
  const count = category._count.videos;

  return (
    <div>
      <p className="story-meta mb-2">
        <Link href="/" style={{ borderBottom: "1px solid var(--rule)" }}>← All stories</Link>
      </p>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 style={{ color: "var(--ink)", fontSize: "26px", fontWeight: 700, fontFamily: "'Archivo Narrow', sans-serif", letterSpacing: "0.01em", lineHeight: 1.2 }}>
          {category.name}
        </h1>
        <p className="story-meta">
          {count} {count === 1 ? "story" : "stories"}
        </p>
      </div>

      <div className="mb-3">
        <h2 className="sr-only">Other topics</h2>
        <CategoryPills categories={categories} category={category.slug} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {videos.map((video) => (
          <StoryCard key={video.id} video={video} />
        ))}
        <LoadMore
          initialHasMore={hasMore}
          initialIds={videos.map((v) => v.id)}
          pageSize={PAGE_SIZE}
          category={category.slug}
        />
      </div>
    </div>
  );
}
