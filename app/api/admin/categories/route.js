import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../lib/prisma";
import { readJson, badBody } from "../../../../lib/http";
import { requireAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { videos: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const name = (typeof body.name === "string" ? body.name : "").trim();
  if (name.length > 60) {
    return NextResponse.json({ error: "A category name can be at most 60 characters" }, { status: 400 });
  }

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
