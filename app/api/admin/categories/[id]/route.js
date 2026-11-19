import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody, isNotFound } from "../../../../../lib/http";

// Renaming changes only the name. The slug, set when the category was created,
// is its address (/category/<slug>), so it stays the same: links already shared
// or indexed by search engines keep working after a rename.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const name = (typeof body.name === "string" ? body.name : "").trim();

  if (!name) {
    return NextResponse.json({ error: "A category name is required" }, { status: 400 });
  }

  const clash = await prisma.category.findFirst({
    where: { name, NOT: { id } },
  });
  if (clash) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }

  let category;
  try {
    category = await prisma.category.update({ where: { id }, data: { name } });
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
