import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const name = (body.name || "").trim();

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

  const category = await prisma.category.update({ where: { id }, data: { name, slug } });
  return NextResponse.json({ category });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
