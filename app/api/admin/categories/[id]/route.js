import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody, isNotFound } from "../../../../../lib/http";

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const name = (typeof body.name === "string" ? body.name : "").trim();

  if (!name) {
    return NextResponse.json({ error: "A category name is required" }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "That name can't be turned into a valid slug" }, { status: 400 });
  }

  const clash = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }], NOT: { id } },
  });
  if (clash) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }

  let category;
  try {
    category = await prisma.category.update({ where: { id }, data: { name, slug } });
  } catch (err) {
    if (isNotFound(err)) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    throw err;
  }
  revalidateTag("videos");
  return NextResponse.json({ category });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (err) {
    // Deleted by someone else between the check above and here.
    if (isNotFound(err)) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    throw err;
  }
  revalidateTag("videos");
  return NextResponse.json({ ok: true });
}
