import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { videos: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "A category name is required" }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "That name can't be turned into a valid slug" }, { status: 400 });
  }

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }

  const category = await prisma.category.create({ data: { name, slug } });
  revalidateTag("videos");
  return NextResponse.json({ category });
}
